/**
 * The terms an order is placed on, stated once and quoted wherever the reader
 * is deciding: beside the action in the item record, and in the notes for the
 * public. Two copies of a dispatch window drift; one cannot.
 *
 * These are facts about production, not about the work, so they are in scope
 * for the document to state.
 */

/** As stated by the print partner. */
export const DISPATCH_WINDOW = 'Approximately 5–8 days from the order.';

export const TERMS_OF_ISSUE: { k: string; v: string }[] = [
  { k: 'Production', v: 'Printed after the order is placed. Nothing is held in stock.' },
  { k: 'Dispatch', v: DISPATCH_WINDOW },
  {
    k: 'Returns',
    v: 'Print defects and sizing errors, case by case. Write to the office before returning anything.',
  },
];
