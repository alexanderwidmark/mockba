'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState, useTransition } from 'react';

import { addToCart, registerInterest } from '@/app/actions';
import { announceCartChange } from '@/lib/cart-client';
import { rightsColor } from '@/lib/rights';
import type { Item, Series } from '@/lib/shopify/types';
import GarmentPlate from './GarmentPlate';
import styles from './ItemRecord.module.css';

type Props = {
  item: Item;
  series: Series;
  live: boolean;
  preorder: boolean;
};

const SPECS = (sizes: string) => [
  { k: 'garment', v: 'Heavyweight 220g' },
  { k: 'fabric', v: '100% combed cotton' },
  { k: 'fit', v: 'Boxy / relaxed' },
  { k: 'print', v: 'DTG, TBD after sample' },
  { k: 'placement', v: 'Full front' },
  { k: 'sizes', v: sizes },
];

export default function ItemRecord({ item, series, live, preorder }: Props) {
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

  /* Everything below is derived per render, never stored. */
  const colour = useMemo(
    () =>
      item.colours.find((c) => c.name === colourName) ?? {
        name: colourName,
        garment: item.garmentColor,
        ink: item.printInk,
      },
    [item, colourName],
  );

  const forColour = useMemo(
    () => item.variants.filter((v) => v.colourName === colourName),
    [item.variants, colourName],
  );

  const firstAvailable = forColour.find((v) => v.available) ?? forColour[0] ?? null;
  const activeSize = size ?? firstAvailable?.size ?? item.sizeValues[0] ?? '';
  const variant = forColour.find((v) => v.size === activeSize) ?? firstAvailable ?? null;

  const inStock = Boolean(variant?.available);
  const sellable = live && inStock;
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
    : preorder
      ? `${currency} · charged when the series is issued`
      : `${currency} test price · not yet fixed`;

  /* Choosing a blank resets size to that colour's first available size and
     clears any acknowledgement. */
  const pickColour = (name: string) => {
    setColourName(name);
    setSize(null);
    setRegistered(false);
    setRegistering(false);
    setAdded(false);
    setError(null);
  };

  const pickSize = (sz: string) => {
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
        sku: variant?.sku || item.sku,
        variantTitle: variant?.title ?? '',
        seriesTitle: series.title,
        price,
      });
      if (res.ok) {
        setRegistered(true);
        setRegistering(false);
        setEmail('');
      } else {
        setError(res.message ?? 'The entry could not be recorded.');
      }
    });
  };

  const total = String(series.products.length).padStart(2, '0');

  return (
    <>
      <Link href={`/series/${series.handle}#drop`} className={styles.backBar}>
        ← Return to the catalogue of items
      </Link>

      <div className={styles.grid}>
        <div className={styles.platePanel}>
          <div className={styles.fig}>
            Fig. {item.no} — recto, {colour.name} cotton
          </div>

          {/* One sticky wrapper holds plate and caption together. */}
          <div className={styles.sticky}>
            <GarmentPlate
              className={styles.mockup}
              image={variant?.image || item.image}
              imageAlt={variant?.imageAlt || item.imageAlt}
              priority
            />
            <div className={styles.plateCaption}>
              Reproduced from archive source · print imperfections retained
            </div>
          </div>
        </div>

        <div className={styles.record}>
          <div className={styles.accession}>
            Item record {item.no} / {total} · {variant?.sku || item.sku}
          </div>

          <h1 className={styles.command}>{item.title}</h1>
          <div className={styles.contradiction}>{item.secondary}</div>

          <div className={styles.variants}>
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

            <div className={styles.sizeHeader}>
              <div className={styles.optionLabel} style={{ marginBottom: 0 }}>
                Size
              </div>
              <div
                className={styles.stock}
                style={{ color: inStock ? 'var(--cleared)' : 'var(--restricted)' }}
              >
                {stockLabel}
              </div>
            </div>

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
                {variant?.sku || item.sku}. You will be notified when the series is issued.
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
                {series.products.map((p) => (
                  <Link
                    key={p.handle}
                    href={`/series/${series.handle}/${p.handle}`}
                    className={styles.itemChip}
                  >
                    {p.title}
                  </Link>
                ))}
              </div>
            </div>
          ) : null}

          {error && !registering ? <div className={styles.error}>{error}</div> : null}

          <div className={styles.specs}>
            {SPECS(item.sizes).map((s) => (
              <div className={styles.spec} key={s.k}>
                <div className={styles.specKey}>{s.k}</div>
                <div className={styles.specValue}>{s.v}</div>
              </div>
            ))}
          </div>

          <div className={styles.sectionLabel}>Source note</div>
          <div className={styles.sourceTitle}>{item.sourceTitle}</div>
          <p className={styles.sourceNote}>{item.sourceNote}</p>

          <div className={styles.meta}>
            <span className={styles.metaKey}>artist</span>
            <span>{item.artist}</span>
            <span className={styles.metaKey}>year</span>
            <span>{item.year}</span>
            <span className={styles.metaKey}>origin</span>
            <span>{item.origin}</span>
            <span className={styles.metaKey}>accession</span>
            <span>{variant?.sku || item.sku}</span>
            <span className={styles.metaKey}>variant</span>
            <span>{variant?.title ?? ''}</span>
            <span className={styles.metaKey}>series</span>
            <span>{series.title}</span>
            <span className={styles.metaKey}>rights</span>
            <span style={{ color: rightsColor(item.rights) }}>
              {item.rights} / {item.risk} enforcement risk
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
