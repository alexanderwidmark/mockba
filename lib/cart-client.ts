/** Client-side cart helpers. The cart itself lives in an httpOnly cookie. */

export const CART_EVENT = 'mockba:cart';

/** Broadcast a cart change so the masthead cell re-reads the count. */
export const announceCartChange = (): void => {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(CART_EVENT));
};

export async function readCartCount(): Promise<number> {
  try {
    const res = await fetch('/api/cart/count', { cache: 'no-store' });
    if (!res.ok) return 0;
    const json = (await res.json()) as { count?: number };
    return json.count ?? 0;
  } catch {
    return 0;
  }
}
