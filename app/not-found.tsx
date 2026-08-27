import Link from 'next/link';

import Masthead from '@/components/Masthead';
import styles from '@/components/Empty.module.css';

export default function NotFound() {
  return (
    <>
      <Masthead series={null} />
      <section className={styles.empty}>
        <div className={styles.eyebrow}>No such record</div>
        <p className={styles.line}>
          The requested record is not held in this catalogue.{' '}
          <Link href="/">Return to the catalogue of items</Link>.
        </p>
      </section>
    </>
  );
}
