import styles from './Sections.module.css';

/**
 * `register` is the document's record of itself. Wide, the title block states
 * it; on a phone the title block gives that room to the first object, so the
 * statement carries it here and shows it only there.
 */
export default function Statement({ register = [] }: { register?: { k: string; v: string }[] }) {
  return (
    <section className={`${styles.section} ${styles.statement}`}>
      <div className={styles.statementGrid}>
        <div>
          <div className={styles.eyebrow}>Statement of purpose</div>
          <p className={styles.lead}>
            MOCKBA Art Collective uses historical propaganda to examine contemporary
            propaganda. The political systems change. The enemies change. The distribution
            channels change. The mechanisms persist.
          </p>
        </div>
        <div className={styles.statementBody}>
          <p className={styles.para}>
            The archive is treated as evidence rather than decoration: fear, loyalty,
            manufactured enemies, political theatre, patriotic consumption and official truth
            keep returning in new forms and under new authorities.
          </p>
          <p className={`${styles.para} ${styles.paraLast}`}>
            Every item records its original source and the contemporary intervention
            separately, so the two layers can never be confused for one another.
          </p>
          <div className={styles.callout}>Yesterday’s propaganda. Today’s infrastructure.</div>
          {register.length ? (
            <div className={styles.statementRegister}>
              {register.map((m) => (
                <div className={styles.registerRow} key={m.k}>
                  <span className={styles.metaKey}>{m.k}</span>
                  <span>{m.v}</span>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
