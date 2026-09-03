'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState, useTransition } from 'react';

import { addToCart, registerInterest } from '@/app/actions';
import { trackMockbaEvent } from '@/lib/analytics-client';
import { announceCartChange } from '@/lib/cart-client';
import { isRestricted, rightsColor, territoryLabel } from '@/lib/rights';
import { isIssued } from '@/lib/status';
import type { Item } from '@/lib/shopify/types';
import GarmentPlate from './GarmentPlate';
import AnalyticsVisibilityEvent from './AnalyticsVisibilityEvent';
import styles from './ItemRecord.module.css';

/**
 * Only what this view renders. The whole series used to be handed in, which put
 * every other item's variants and source note into the client payload for a
 * page that shows one item and a row of sibling titles.
 */
type Sibling = { handle: string; title: string };

type Props = {
  item: Item;
  seriesHandle: string;
  seriesTitle: string;
  seriesStatus: string;
  /** Every item in the series, for the register of interest chip row. */
  siblings: Sibling[];
  live: boolean;
  preorder: boolean;
};

export default function ItemRecord({
  item,
  seriesHandle,
  seriesTitle,
  seriesStatus,
  siblings,
  live,
  preorder,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [colourName, setColourName] = useState<string>(
    item.garmentName || item.colours[0]?.name || '',
  );
  const [size, setSize] = useState<string | null>(null);
  const [registering, setRegistering] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [added, setAdded] = useState(false);
  const [plateIndex, setPlateIndex] = useState(0);

  useEffect(() => {
    trackMockbaEvent('item_record_view', { item: item.accession });
  }, [item.accession]);

  /* Everything below is derived per render, never stored. */
  const colour = useMemo(
    () => item.colours.find((c) => c.name === colourName) ?? null,
    [item, colourName],
  );

  const forColour = useMemo(
    () => item.variants.filter((v) => v.colourName === colourName),
    [item.variants, colourName],
  );

  const firstAvailable = forColour.find((v) => v.available) ?? forColour[0] ?? null;
  const activeSize = size ?? firstAvailable?.size ?? item.sizeValues[0] ?? '';
  const variant = forColour.find((v) => v.size === activeSize) ?? firstAvailable ?? null;

  const issued = isIssued(seriesStatus);
  const inStock = Boolean(variant?.available);
  /* A restricted work is catalogued and stated, never transacted. */
  const restricted = isRestricted(item.rights);
  const sellable = live && inStock && !restricted;
  const price = variant?.price || item.price;

  const currency = (variant?.currency || item.currency || 'USD').toLowerCase();

  // A tracked count of 0 on a sellable variant means inventory is not tracked,
  // not that the shelf is empty. Stating "0 units recorded" beside "available"
  // reads as a contradiction, so the clause is dropped.
  const stockLabel = !variant
    ? 'no variant recorded'
    : variant.available
      ? `available${variant.qty ? ` · ${variant.qty} units recorded` : ''}`
      : 'sold out in this size';

  const ctaLabel = sellable
    ? `Add to cart — ${price}`
    : restricted
      ? registered
        ? 'Interest recorded'
        : 'Register interest in this item'
      : variant && !inStock
        ? 'Sold out · register interest'
        : preorder
          ? registered
          ? 'Reservation recorded'
          : 'Reserve this item'
        : registered
          ? 'Interest recorded'
          : 'Register interest in this item';

  const priceCaption = sellable
    ? `${currency} · ${variant?.title ?? ''}`
    : restricted
      ? `${currency} · not offered in this territory`
      : issued
      ? `${currency} · ${variant?.title ?? ''}`
      : preorder
        ? `${currency} · charged when the series is issued`
        : `${currency} test price · not yet fixed`;

  /* Choosing a blank resets size to that colour's first available size and
     clears any acknowledgement. */
  const pickColour = (name: string) => {
    const firstForColour =
      item.variants.find((candidate) => candidate.colourName === name && candidate.available) ??
      item.variants.find((candidate) => candidate.colourName === name);
    trackMockbaEvent('variant_select', {
      selection: `${item.accession}|${name}|${firstForColour?.size ?? ''}`,
    });
    setColourName(name);
    setSize(null);
    setPlateIndex(0);
    setRegistered(false);
    setRegistering(false);
    setAdded(false);
    setError(null);
  };

  const pickSize = (sz: string) => {
    trackMockbaEvent('variant_select', {
      selection: `${item.accession}|${colourName}|${sz}`,
    });
    setSize(sz);
    setRegistered(false);
    setRegistering(false);
    setAdded(false);
    setError(null);
  };

  const onCta = () => {
    setError(null);
    if (sellable && variant) {
      startTransition(async () => {
        const res = await addToCart(variant.id, 1);
        if (res.ok) {
          trackMockbaEvent('add_to_cart', {
            selection: `${item.accession}|${variant.accession}`,
          });
          setAdded(true);
          announceCartChange();
          router.refresh();
        } else {
          setError(res.message ?? 'The cart could not be opened.');
        }
      });
      return;
    }
    if (registered) return;
    setRegistering(true);
  };

  const onRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await registerInterest({
        email,
        itemNo: item.no,
        itemTitle: item.title,
        sku: variant?.accession || item.accession,
        variantTitle: variant?.title ?? '',
        seriesTitle,
        price,
      });
      if (res.ok) {
        trackMockbaEvent('register_interest', { item: item.accession });
        setRegistered(true);
        setRegistering(false);
        setEmail('');
      } else {
        setError(res.message ?? 'The entry could not be recorded.');
      }
    });
  };

  /**
   * The plates for the selected blank: the ones whose alt text names it, recto
   * first, then any that name no blank at all.
   *
   * Where no alt text names a blank the convention is not in use, and a
   * multi-blank object shows only its variant image — pairing an unattributed
   * photograph with a colour chip would show the wrong garment.
   */
  const plates = useMemo(() => {
    const anchor = {
      url: variant?.image || item.image,
      alt: variant?.imageAlt || item.imageAlt,
    };
    const rank = (v: string | null) => (v === 'recto' ? 0 : v === 'verso' ? 1 : 2);
    const dedupe = (list: { url: string; alt: string }[]) => {
      const seen = new Set<string>();
      return list.filter((p) => p.url && !seen.has(p.url) && seen.add(p.url));
    };

    const attributed = item.plates.some((p) => p.colour);
    if (attributed) {
      const mine = item.plates
        .filter((p) => p.colour?.toLowerCase() === colourName.toLowerCase())
        .sort((a, b) => rank(a.view) - rank(b.view));
      const neutral = item.plates.filter((p) => !p.colour);
      const ordered = dedupe([...mine, ...neutral]);
      return ordered.length ? ordered : dedupe([anchor]);
    }

    if (item.hasBlankOption) return dedupe([anchor]);
    return dedupe([anchor, ...item.plates.filter((p) => !p.variantOwned)]);
  }, [variant, item, colourName]);

  const plate = plates[Math.min(plateIndex, plates.length - 1)] ?? plates[0];
  /* The label names the face when the alt text does, and never otherwise. */
  const namedView = item.plates.find((p) => p.url === plate?.url)?.view ?? null;
  const view =
    namedView ?? (plateIndex === 0 ? 'recto' : `plate ${String(plateIndex + 1).padStart(2, '0')}`);

  const total = String(siblings.length).padStart(2, '0');

  return (
    <>
      <Link href={`/series/${seriesHandle}#drop`} className={styles.backBar}>
        ← Return to the catalogue of items
      </Link>

      <div className={styles.grid}>
        <div className={styles.platePanel}>
          <div className={styles.fig}>
            Fig. {item.no} — {view}
            {colour ? `, ${colour.name} ${item.substrate}` : ''}
          </div>

          {/* One sticky wrapper holds plate and caption together. */}
          <div className={styles.sticky}>
            <GarmentPlate
              className={styles.mockup}
              image={plate?.url ?? ''}
              imageAlt={plate?.alt ?? ''}
              priority
            />

            {plates.length > 1 ? (
              <div className={styles.plateRegister}>
                {plates.map((p, i) => (
                  <button
                    type="button"
                    key={p.url}
                    onClick={() => setPlateIndex(i)}
                    aria-pressed={i === plateIndex}
                    className={`${styles.plate} ${i === plateIndex ? styles.plateSelected : ''}`}
                  >
                    {String(i + 1).padStart(2, '0')}
                  </button>
                ))}
              </div>
            ) : null}
            <div className={styles.plateCaption}>
              Reproduced from archive source · print imperfections retained
            </div>
          </div>
        </div>

        <div className={styles.record}>
          <div className={styles.accession}>
            Item record {item.no} / {total} · {variant?.accession || item.accession}
          </div>

          <h1 className={styles.command}>{item.title}</h1>
          <div className={styles.contradiction}>{item.secondary}</div>

          <div className={styles.variants}>
            {item.hasBlankOption ? (
              <>
                <div className={styles.optionLabel}>Blank</div>
                <div className={styles.chips}>
                  {item.colours.map((c) => (
                    <button
                      type="button"
                      key={c.name}
                      onClick={() => pickColour(c.name)}
                      aria-pressed={c.name === colourName}
                      className={`${styles.chip} ${c.name === colourName ? styles.chipSelected : ''}`}
                    >
                      <span className={styles.swatch} style={{ background: c.garment }} />
                      <span>{c.name}</span>
                    </button>
                  ))}
                </div>
              </>
            ) : null}

            <div className={styles.sizeHeader}>
              {item.hasSizeOption ? (
                <div className={styles.optionLabel} style={{ marginBottom: 0 }}>
                  Size
                </div>
              ) : (
                <div className={styles.optionLabel} style={{ marginBottom: 0 }}>
                  Availability
                </div>
              )}
              <div
                className={styles.stock}
                style={{ color: inStock ? 'var(--cleared)' : 'var(--restricted)' }}
              >
                {stockLabel}
              </div>
            </div>

            {item.hasSizeOption ? (
            <div className={styles.sizeGrid}>
              {item.sizeValues.map((sz) => {
                const v = forColour.find((x) => x.size === sz);
                const ok = Boolean(v?.available);
                const on = sz === activeSize;
                return (
                  <button
                    type="button"
                    key={sz}
                    disabled={!ok}
                    aria-pressed={on}
                    onClick={ok ? () => pickSize(sz) : undefined}
                    className={[
                      styles.size,
                      on ? styles.sizeSelected : '',
                      ok ? '' : styles.sizeUnavailable,
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    {sz}
                  </button>
                );
              })}
            </div>
            ) : null}
          </div>

          <div className={styles.priceRow}>
            <span className={styles.price}>{price}</span>
            <span className={styles.priceCaption}>{priceCaption}</span>
          </div>

          <div className={styles.ctaWrap}>
            <button
              type="button"
              className={styles.cta}
              onClick={onCta}
              disabled={pending || (registered && !sellable)}
            >
              {ctaLabel}
            </button>
          </div>

          {restricted ? (
            <div className={styles.rightsNote}>
              Not offered while the rights record remains restricted. The item is
              catalogued and its source is stated; interest is entered in the register.
            </div>
          ) : null}

          {added ? (
            <div className={styles.cartNote}>
              Entered in the cart ·{' '}
              <Link href="/cart" className={styles.cartNoteLink}>
                Proceed to checkout
              </Link>
            </div>
          ) : null}

          {registering && !registered ? (
            <div className={styles.panel}>
              <div className={styles.panelEyebrow}>Register of interest</div>
              <div className={styles.panelPrompt}>
                State an address and the entry is recorded against{' '}
                {variant?.accession || item.accession}. You will be notified when the series
                is issued.
              </div>
              <form className={styles.field} onSubmit={onRegister}>
                <input
                  className={styles.input}
                  type="email"
                  required
                  name="email"
                  autoComplete="email"
                  placeholder="address for notification"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  aria-label="Address for notification"
                />
                <button type="submit" className={styles.submit} disabled={pending}>
                  Enter in the register
                </button>
              </form>
              {error ? <div className={styles.error}>{error}</div> : null}
            </div>
          ) : null}

          {registered ? (
            <div className={styles.panel}>
              <div className={styles.panelEyebrow}>Entered in the register</div>
              <div className={styles.panelPrompt}>
                Which item would you acquire at the stated price?
              </div>
              <div className={styles.chipRow}>
                {siblings.map((p) => (
                  <Link
                    key={p.handle}
                    href={`/series/${seriesHandle}/${p.handle}`}
                    className={styles.itemChip}
                  >
                    {p.title}
                  </Link>
                ))}
              </div>
            </div>
          ) : null}

          {error && !registering ? <div className={styles.error}>{error}</div> : null}

          {/* Stated only where there is a table to state; nothing is asserted
              about an object whose category has no specification template. */}
          {item.specs.length ? (
          <div className={styles.specs}>
            {item.specs.map((s) => (
              <div className={styles.spec} key={s.k}>
                <div className={styles.specKey}>{s.k}</div>
                <div className={styles.specValue}>{s.v}</div>
              </div>
            ))}
          </div>
          ) : null}

          <div className={styles.sectionLabel}>Source note</div>
          <div className={styles.sourceTitle}>{item.sourceTitle}</div>
          <p className={styles.sourceNote}>{item.sourceNote}</p>
          <AnalyticsVisibilityEvent
            name="source_note_read"
            detail={{ item: item.accession }}
          />

          <div className={styles.meta}>
            <span className={styles.metaKey}>artist</span>
            <span>{item.artist}</span>
            <span className={styles.metaKey}>year</span>
            <span>{item.year}</span>
            <span className={styles.metaKey}>origin</span>
            <span>{item.origin}</span>
            <span className={styles.metaKey}>accession</span>
            <span>{variant?.accession || item.accession}</span>
            <span className={styles.metaKey}>variant</span>
            <span>{variant?.title ?? ''}</span>
            <span className={styles.metaKey}>series</span>
            <span>{seriesTitle}</span>
            <span className={styles.metaKey}>rights</span>
            {/* Named with its territory only when the source records one, so an
                unscoped value is not dressed up as a territorial finding. */}
            <span style={{ color: rightsColor(item.rights) }}>
              {item.rights}
              {item.rightsScoped ? ` in the ${territoryLabel(item.rightsTerritory)}` : ''} /{' '}
              {item.risk} enforcement risk
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
