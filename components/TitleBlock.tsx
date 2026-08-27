import Link from 'next/link';

import type { Item, Series } from '@/lib/shopify/types';
import GarmentMockup from './GarmentMockup';
import styles from './TitleBlock.module.css';

export default function TitleBlock({
  series,
  hero,
  live,
}: {
  series: Series;
  hero: Item;
  live: boolean;
}) {
  const headMeta = [
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
            <GarmentMockup
              garmentColor={hero.garmentColor}
              printInk={hero.printInk}
              poster={hero.poster}
              posterAlt={hero.posterAlt}
              printAspect={hero.printAspect}
              title={hero.title}
              secondary={hero.secondary}
              priority
            />
          </Link>

          <div className={styles.heroCaption}>
            <span>
              Item {hero.no} · {hero.title}
            </span>
            <span>{hero.sku}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
