import Link from 'next/link';

import { dropLineForm, setLineQuantityForm } from '@/app/actions';
import Masthead from '@/components/Masthead';
import TrackedCheckoutLink from '@/components/TrackedCheckoutLink';
import { getCart } from '@/lib/shopify/cart';
import { getSeriesContext } from '@/lib/shopify/fetch';
import styles from './Cart.module.css';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Cart' };

export default async function CartPage() {
  const [cart, { series }] = await Promise.all([getCart(), getSeriesContext()]);
  const seriesHandle = series?.handle ?? '';

  return (
    <>
      <Masthead series={series} />
      <section className={styles.section}>
        <div className={styles.header}>
          <h1 className={styles.heading}>Cart</h1>
          <span className={styles.note}>
            Checkout, dispatch and payment are handled by Shopify
          </span>
        </div>

        {!cart || cart.lines.length === 0 ? (
          <>
            <p className={styles.empty}>Nothing is currently held for order.</p>
            <Link href={seriesHandle ? `/series/${seriesHandle}#drop` : '/'} className={styles.back}>
              Consult the catalogue of items →
            </Link>
          </>
        ) : (
          <>
            <div className={styles.lines}>
              {cart.lines.map((line) => (
                <div className={styles.line} key={line.id}>
                  <div>
                    <div className={styles.accession}>{line.sku || 'no accession recorded'}</div>
                    <Link
                      href={`/series/${seriesHandle}/${line.productHandle}`}
                      className={styles.title}
                    >
                      {line.productTitle}
                    </Link>
                    <div className={styles.variant}>
                      {line.variantTitle} · {line.price} each
                    </div>
                  </div>

                  <div className={styles.controls}>
                    <div className={styles.step}>
                      <form action={setLineQuantityForm}>
                        <input type="hidden" name="lineId" value={line.id} />
                        <input type="hidden" name="quantity" value={line.quantity - 1} />
                        <button type="submit" className={styles.stepButton} aria-label="Reduce by one">
                          −
                        </button>
                      </form>
                      <span className={styles.qty}>{line.quantity}</span>
                      <form action={setLineQuantityForm}>
                        <input type="hidden" name="lineId" value={line.id} />
                        <input type="hidden" name="quantity" value={line.quantity + 1} />
                        <button type="submit" className={styles.stepButton} aria-label="Add one">
                          +
                        </button>
                      </form>
                    </div>

                    <span className={styles.lineTotal}>{line.lineTotal}</span>

                    <form action={dropLineForm}>
                      <input type="hidden" name="lineId" value={line.id} />
                      <button type="submit" className={styles.remove}>
                        Strike from cart
                      </button>
                    </form>
                  </div>
                </div>
              ))}
            </div>

            <div className={styles.summary}>
              <div>
                <div className={styles.subtotalKey}>subtotal · before shipping and tax</div>
                <div className={styles.subtotal}>{cart.subtotal}</div>
              </div>
              <TrackedCheckoutLink href={cart.checkoutUrl} className={styles.checkout}>
                Proceed to checkout
              </TrackedCheckoutLink>
            </div>
          </>
        )}
      </section>
    </>
  );
}
