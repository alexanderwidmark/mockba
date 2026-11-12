import Link from 'next/link';

import type { Item, Series } from '@/lib/shopify/types';
import GarmentPlate from './GarmentPlate';
import styles from './TitleBlock.module.css';

/**
 * The document's record of itself. Stated in the title block where there is
 * room beside the plate; on a phone the title block gives that room to the
 * first object, and the statement of purpose carries the record instead.
 */
export function seriesRegister(series: Series, live: boolean) {
  return [
    {
      k: 'series',
      v: series.title + (series.seriesNo ? ` · no. ${series.seriesNo}` : ''),
    },
    {
      k: 'extent',
      v: `${series.products.length} items · full-front print, printed on demand`,
    },
    { k: 'sources', v: 'State archive posters, 1920–1988' },
    {
      k: 'status',
      v: `${series.status || 'release candidate'} · ${live ? 'checkout open' : 'interest registered only'}`,
    },
  ];
}

export default function TitleBlock({
  series,
  hero,
  live,
}: {
  series: Series;
  hero: Item;
  live: boolean;
}) {
  const headMeta = seriesRegister(series, live);

  const heroHref = `/series/${series.handle}/${hero.handle}`;

  return (
    <header className={styles.header}>
      <div className={styles.grid}>
        <div className={styles.text}>
          <div className={styles.eyebrow}>
            Issued by MOCKBA Art Collective · Moscow archive series
          </div>

          <div className={styles.thesis}>
            <span className={styles.line}>
              <span className={styles.lineInner} data-enter="line">Historical propaganda,</span>
            </span>
            <span className={styles.line}>
              <span className={styles.lineInner} data-enter="line" data-enter-delay="1">
                contemporary mechanisms.
              </span>
            </span>
          </div>

          {/* On a phone: the first object, its price and the way to its record,
              inside the first screen. Wide, the plate beside the text does
              this and the block is not rendered visible. */}
          <div className={styles.compact}>
            <Link
              href={heroHref}
              className={styles.compactPlate}
              tabIndex={-1}
              aria-hidden="true"
            >
              <span className={styles.compactLabel}>Plate I</span>
              <GarmentPlate className={styles.compactMockup} image={hero.image} imageAlt="" priority />
            </Link>
            <div className={styles.compactCaption}>
              <span className={styles.compactNo}>
                Item {hero.no} · {hero.accession}
              </span>
              <span className={styles.compactTitle}>
                <span>{hero.title}</span>
                <span className={styles.compactPrice}>{hero.price}</span>
              </span>
              <span className={styles.compactLine}>{hero.secondary}</span>
            </div>
            <Link href={heroHref} className={styles.compactAction}>
              Consult the item record →
            </Link>
          </div>

          <p className={styles.frame} data-enter="frame">
            The archive is not nostalgia. It is treated as evidence. The political systems
            change; the mechanisms are remarkably persistent.
          </p>

          <div className={styles.register} data-enter="register">
            {headMeta.map((m) => (
              <div className={styles.row} key={m.k}>
                <span className={styles.key}>{m.k}</span>
                <span className={styles.value}>{m.v}</span>
              </div>
            ))}
            <div className={styles.consultWrap}>
              <Link href="#drop" className={styles.consult}>
                Consult the catalogue of items →
              </Link>
            </div>
          </div>
        </div>

        <div className={styles.plate}>
          <div className={styles.plateLabel}>Plate I</div>

          <Link href={heroHref} className={styles.heroLink} data-enter="plate">
            <GarmentPlate image={hero.image} imageAlt={hero.imageAlt} priority />
          </Link>

          <div className={styles.heroCaption}>
            <span>
              Item {hero.no} · {hero.title}
            </span>
            <span>{hero.accession}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
