import Link from 'next/link';

import type { Series } from '@/lib/shopify/types';
import CartCell from './CartCell';
import styles from './Masthead.module.css';

/**
 * The document bar. Persistent on both views, sticky at the top.
 * Series number, status and revision come from collection metafields.
 */
export default function Masthead({ series }: { series: Series | null }) {
  const seriesLabel = `Series ${series?.seriesNo || '001'} / ${series?.status ?? ''}`;
  const revisionLabel = `Revision ${series?.issued || '—'}`;

  return (
    <div className={styles.masthead}>
      <Link href="/" className={`${styles.cell} ${styles.title}`}>
        MOCKBA Art Collective
      </Link>
      <div className={styles.cell}>Office of Public Information</div>
      <div className={styles.cell}>{seriesLabel}</div>
      <div className={styles.cell}>{revisionLabel}</div>
      <CartCell className={`${styles.cell} ${styles.cart}`} />
    </div>
  );
}
