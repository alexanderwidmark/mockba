import Masthead from './Masthead';
import styles from './Empty.module.css';

/**
 * No series resolved — neither from Shopify nor from the snapshot. The page
 * still states what it is; it never renders a spinner or an error page.
 */
export default function Empty() {
  return (
    <>
      <Masthead series={null} />
      <section className={styles.empty}>
        <div className={styles.eyebrow}>Office of Public Information</div>
        <p className={styles.line}>
          No series is currently published. The catalogue is issued when a series passes
          review.
        </p>
      </section>
    </>
  );
}
