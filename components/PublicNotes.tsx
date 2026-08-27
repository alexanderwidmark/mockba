import styles from './Sections.module.css';

/**
 * These notes explain how the work is made and why — never what a work means.
 * A question that interprets the artwork does not belong here.
 */
const NOTES = [
  {
    q: 'What is MOCKBA?',
    a: 'An art collective using historical propaganda to examine contemporary propaganda. Every item starts from a documented archive source and adds a contemporary intervention. The two layers are always recorded separately.',
  },
  {
    q: 'Are these original historical posters?',
    a: 'The imagery is taken from real archive posters, reproduced with their age and print imperfections intact. The English headline and secondary line are the MOCKBA intervention, not part of the original work. Each item record states the original title, artist and year.',
  },
  {
    q: 'What garment is used?',
    a: 'Heavyweight 220g, 100% combed cotton, boxy relaxed fit, sizes XS–3XL. Full-front print. Exact blank and print method are confirmed after physical samples are approved.',
  },
  {
    q: 'Where is it produced?',
    a: 'Printed on demand through a print partner, with no stockpiled inventory. Production location is confirmed at the same time as the blank, after sample approval.',
  },
  {
    q: 'When will it be issued?',
    a: 'This document is a release candidate. Nothing is dispatched until physical samples pass review. Register interest and you will be notified when the series is issued, with the dispatch window stated at that point.',
  },
  {
    q: 'Returns and sizing',
    a: 'The full size chart is published with the series. Because every garment is printed to order, returns are handled case by case for print defects and sizing errors — the policy is published before any payment is taken.',
  },
];

export default function PublicNotes() {
  return (
    <section className={`${styles.section} ${styles.last}`}>
      <div className={styles.eyebrow}>Notes for the public</div>
      <div className={styles.notes}>
        {NOTES.map((n) => (
          <div className={styles.note} key={n.q}>
            <div className={styles.question}>{n.q}</div>
            <div className={styles.answer}>{n.a}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
