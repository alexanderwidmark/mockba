import Link from 'next/link';

import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <span className={styles.primary}>MOCKBA Art Collective</span>
      <span>mockba.org</span>
      <span>Original source and MOCKBA intervention recorded separately</span>
      <Link href="/contact" className={styles.link}>
        Contact the office
      </Link>
    </footer>
  );
}
