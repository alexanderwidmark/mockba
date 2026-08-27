import Link from 'next/link';

import { getPolicies } from '@/lib/shopify/policies';
import styles from './Footer.module.css';

/**
 * The written policies are listed here because the checkout links to them and
 * the site must too — a policy reachable only from inside checkout is not
 * published. Only policies the merchant has actually written appear, so the
 * register grows on its own as they are added in Shopify.
 */
export default async function Footer() {
  const policies = await getPolicies();

  return (
    <footer className={styles.footer}>
      {policies.length ? (
        <nav className={styles.policies} aria-label="Written policies">
          <div className={styles.label}>Written policies</div>
          {policies.map((p) => (
            <Link key={p.handle} href={`/policies/${p.handle}`} className={styles.policy}>
              {p.title}
            </Link>
          ))}
        </nav>
      ) : null}

      <div className={styles.colophon}>
        <span className={styles.primary}>MOCKBA Art Collective</span>
        <span>mockba.org</span>
        <span>Original source and MOCKBA intervention recorded separately</span>
        <Link href="/contact" className={styles.link}>
          Contact the office
        </Link>
      </div>
    </footer>
  );
}
