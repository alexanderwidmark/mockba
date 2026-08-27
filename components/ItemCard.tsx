import Link from 'next/link';

import type { Item } from '@/lib/shopify/types';
import GarmentPlate from './GarmentPlate';
import styles from './ItemCard.module.css';

function stockLine(item: Item): string {
  const total = item.variants.length;
  if (!total) return 'no variants recorded';
  const available = item.variants.filter((v) => v.available).length;
  if (available === 0) return 'all variants sold out';
  return `${available} of ${total} variants available`;
}

export default function ItemCard({
  item,
  seriesHandle,
  live,
}: {
  item: Item;
  seriesHandle: string;
  live: boolean;
}) {
  return (
    <Link
      href={`/series/${seriesHandle}/${item.handle}`}
      className={styles.card}
      data-enter="card"
    >
      <div className={styles.plate}>
        <span className={styles.fig}>Fig. {item.no}</span>
        <GarmentPlate className={styles.mockup} image={item.image} imageAlt={item.imageAlt} />
      </div>

      <div className={styles.body}>
        <div className={styles.accession}>
          Item {item.no} · {item.accession}
        </div>
        <h3 className={styles.title}>{item.title}</h3>
        <div className={styles.contradiction}>{item.secondary}</div>

        <div className={styles.meta}>
          <span className={styles.metaKey}>source</span>
          <span>{item.sourceShort}</span>
          <span className={styles.metaKey}>year</span>
          <span>{item.year}</span>
          {item.hasBlankOption ? (
            <>
              <span className={styles.metaKey}>blanks</span>
              <span>{item.colours.map((c) => c.name).join(' · ')}</span>
            </>
          ) : null}
          <span className={styles.metaKey}>stock</span>
          <span>{stockLine(item)}</span>
        </div>

        <p className={styles.mechanism}>{item.mechanismLine}</p>

        <div className={styles.footer}>
          <span className={styles.price}>{item.price}</span>
          <span className={styles.action}>
            {live ? 'Consult the item record' : 'Register interest'}
          </span>
        </div>
      </div>
    </Link>
  );
}
