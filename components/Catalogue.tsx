import type { Series } from '@/lib/shopify/types';
import ItemCard from './ItemCard';
import styles from './Catalogue.module.css';

export default function Catalogue({ series, live }: { series: Series; live: boolean }) {
  const hero = series.products[0];
  const currency = (hero?.currency || 'USD').toLowerCase();
  const priceNote = hero?.price
    ? `${currency} test price · ${hero.price} stated · public price not yet fixed`
    : `${currency} test price · public price not yet fixed`;

  return (
    <section id="drop" className={styles.section}>
      <div className={styles.header}>
        <h2 className={styles.heading}>Catalogue of items — {series.title}</h2>
        <span className={styles.priceNote}>{priceNote}</span>
      </div>

      <div className={styles.grid}>
        {series.products.map((item) => (
          <ItemCard key={item.handle} item={item} seriesHandle={series.handle} live={live} />
        ))}
      </div>
    </section>
  );
}
