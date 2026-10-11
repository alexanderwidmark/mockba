'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';

import type { Series } from '@/lib/shopify/types';
import CartCell from './CartCell';
import styles from './Masthead.module.css';

/**
 * The document bar. Series number, status and revision come from collection
 * metafields.
 *
 * It sticks at every width. On a phone it hides on the way down and returns on
 * the way up, because a bar that is simply given up takes the cart with it and
 * leaves no way back to the top. JavaScript only sets `data-hidden`: the
 * resting state is the bar in place, and the movement is transform only.
 */
export default function Masthead({ series }: { series: Series | null }) {
  const seriesLabel = `Series ${series?.seriesNo || '001'} / ${series?.status ?? ''}`;
  const revisionLabel = `Revision ${series?.issued || '—'}`;
  const bar = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = bar.current;
    if (!el) return;

    let last = Math.max(0, window.scrollY);
    let hidden = false;
    let frame = 0;

    const read = () => {
      frame = 0;
      const y = Math.max(0, window.scrollY);
      const delta = y - last;

      /* A short drag either way is a wobble, not an intention. Below the bar's
         own height there is nothing to uncover, so it always stays. */
      if (Math.abs(delta) < 6) return;
      const next = delta > 0 && y > el.offsetHeight;
      last = y;

      if (next === hidden) return;
      hidden = next;
      el.dataset.hidden = next ? 'true' : 'false';
    };

    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(read);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div className={styles.masthead} ref={bar}>
      <Link href="/" className={`${styles.cell} ${styles.title}`}>
        MOCKBA Art Collective
      </Link>
      <div className={`${styles.cell} ${styles.office}`}>Office of Public Information</div>
      <div className={styles.cell}>{seriesLabel}</div>
      <div className={styles.cell}>{revisionLabel}</div>
      <CartCell className={`${styles.cell} ${styles.cart}`} />
    </div>
  );
}
