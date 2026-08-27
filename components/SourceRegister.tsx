import type { Item } from '@/lib/shopify/types';
import styles from './Sections.module.css';

/**
 * The archive source, recorded on its own. The MOCKBA intervention is never
 * merged into this register.
 */
export default function SourceRegister({ items }: { items: Item[] }) {
  return (
    <section className={styles.section}>
      <div className={styles.eyebrow}>Register of sources</div>
      <div className={styles.list}>
        {items.map((p) => (
          <div className={styles.sourceRow} key={p.handle}>
            <div>
              <div className={styles.itemLabel}>
                Item {p.no} · {p.title}
              </div>
              <div className={styles.originalTitle}>{p.sourceTitle}</div>
              <div className={styles.sourceMeta}>
                <span className={styles.metaKey}>artist</span>
                <span>{p.artist}</span>
                <span className={styles.metaKey}>year</span>
                <span>{p.year}</span>
                <span className={styles.metaKey}>origin</span>
                <span>{p.origin}</span>
                <span className={styles.metaKey}>purpose</span>
                <span>{p.purpose}</span>
              </div>
            </div>
            <p className={styles.sourceNote}>{p.sourceNote}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
