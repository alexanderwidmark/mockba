/**
 * The series status governs how the document describes itself.
 *
 * A release candidate is a document under review: nothing is dispatched, the
 * price is provisional, the print method is still to be confirmed against a
 * sample. An issued series is open for order, and every one of those hedges
 * becomes a contradiction — the page must not both take payment and say the
 * blank is unconfirmed.
 */
export type SeriesStatus = 'release candidate' | 'issued' | 'closed';

export const asStatus = (value: string): SeriesStatus =>
  value === 'issued' ? 'issued' : value === 'closed' ? 'closed' : 'release candidate';

/** True once the series is published as issued — or closed, which follows it. */
export const isIssued = (status: string): boolean => asStatus(status) !== 'release candidate';
