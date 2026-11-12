'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { CART_EVENT, readCartCount } from '@/lib/cart-client';

/**
 * The order cell. Always rendered, and marked empty until the order holds
 * something: wide, an empty cell is hidden so the bar is exactly the document
 * bar in the design; on a phone it is the way to the order from every page,
 * and it stays. With no JS it is a plain link to the order.
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

  return (
    <Link
      href="/cart"
      className={className}
      data-empty={count ? undefined : ''}
      aria-label={count ? `The order, ${count} ${count === 1 ? 'item' : 'items'}` : 'The order'}
    >
      {count ? `Order · ${count}` : 'Order'}
    </Link>
  );
}
