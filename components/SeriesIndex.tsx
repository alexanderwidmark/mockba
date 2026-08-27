import Link from 'next/link';

import type { Series } from '@/lib/shopify/types';
import styles from './SeriesIndex.module.css';

/** Rendered only when more than one series is published. */
export default function SeriesIndex({
  all,
  activeHandle,
}: {
  all: Series[];
  activeHandle: string;
}) {
  if (all.length < 2) return null;

  return (
    <nav className={styles.index}>
      <div className={styles.label}>Series index</div>
      {all.map((s) => (
        <Link
          key={s.handle}
          href={`/series/${s.handle}`}
          className={`${styles.tab} ${s.handle === activeHandle ? styles.active : ''}`}
          aria-current={s.handle === activeHandle ? 'page' : undefined}
        >
          {s.title} · {s.products.length} items
        </Link>
      ))}
    </nav>
  );
}
