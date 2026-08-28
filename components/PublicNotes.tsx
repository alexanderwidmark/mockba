import { isIssued } from '@/lib/status';
import styles from './Sections.module.css';

/**
 * These notes explain how the work is made and why — never what a work means.
 * A question that interprets the artwork does not belong here.
 *
 * Four of the six answers change with the series status. While a series is a
 * release candidate the document says openly that the blank, the print method
 * and the production location are unconfirmed. Once it is issued and taking
 * payment, those hedges would contradict the transaction, so they are dropped
 * rather than left standing.
 */
const NOTES = (status: string, sizes: string) => [
  {
    q: 'What is MOCKBA?',
    a: 'An art collective using historical propaganda to examine contemporary propaganda. Every item starts from a documented archive source and adds a contemporary intervention. The two layers are always recorded separately.',
  },
  {
    q: 'Are these original historical posters?',
    a: 'The imagery is taken from real archive posters, reproduced with their age and print imperfections intact. The English headline and secondary line are the MOCKBA intervention, not part of the original work. Each item record states the original title, artist and year.',
  },
  {
    q: 'What is it printed on?',
    a: [
      sizes
        ? `Garments are heavyweight 220g, 100% combed cotton, boxy relaxed fit, sizes ${sizes}, printed full front.`
        : 'Every object is printed full front.',
      'Each item record states the specification for that object.',
      isIssued(status)
        ? ''
        : 'Exact blank and print method are confirmed after physical samples are approved.',
    ]
      .filter(Boolean)
      .join(' '),
  },
  {
    q: 'Where is it produced?',
    a: isIssued(status)
      ? 'Printed on demand through a print partner. Nothing is held in stock; each garment is produced after the order is placed.'
      : 'Printed on demand through a print partner, with no stockpiled inventory. Production location is confirmed at the same time as the blank, after sample approval.',
  },
  {
    q: isIssued(status) ? 'When is it dispatched?' : 'When will it be issued?',
    a: isIssued(status)
      ? 'The series is issued and open for order. Because every garment is printed after the order is placed, dispatch follows production rather than stock.'
      : 'This document is a release candidate. Nothing is dispatched until physical samples pass review. Register interest and you will be notified when the series is issued, with the dispatch window stated at that point.',
  },
  {
    q: 'Returns and sizing',
    a: isIssued(status)
      ? `${sizes ? `The size chart runs ${sizes}. ` : ''}Because every item is printed to order, returns are handled case by case for print defects and sizing errors. Write to the office before returning anything.`
      : 'The full size chart is published with the series. Because every garment is printed to order, returns are handled case by case for print defects and sizing errors — the policy is published before any payment is taken.',
  },
];

export default function PublicNotes({ status, sizes }: { status: string; sizes: string }) {
  return (
    <section className={`${styles.section} ${styles.last}`}>
      <div className={styles.eyebrow}>Notes for the public</div>
      <div className={styles.notes}>
        {NOTES(status, sizes).map((n) => (
          <div className={styles.note} key={n.q}>
            <div className={styles.question}>{n.q}</div>
            <div className={styles.answer}>{n.a}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
