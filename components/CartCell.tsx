'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { CART_EVENT, readCartCount } from '@/lib/cart-client';

/**
 * The cart cell is an enhancement on top of the specified four-cell masthead:
 * with no JS, or with an empty cart, the bar is exactly the document bar in the
 * design. It appears only once the cart holds something.
 */
export default function CartCell({ className }: { className: string }) {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    let alive = true;
    const sync = async () => {
      const n = await readCartCount();
      if (alive) setCount(n);
    };
    void sync();
    window.addEventListener(CART_EVENT, sync);
    return () => {
      alive = false;
      window.removeEventListener(CART_EVENT, sync);
    };
  }, []);

  if (!count) return null;

  return (
    <Link href="/cart" className={className}>
      Cart · {count} {count === 1 ? 'item' : 'items'}
    </Link>
  );
}
