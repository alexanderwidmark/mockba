/**
 * Rights colour-coding and the sale gate.
 *
 * `rights_status` and `enforcement_risk` stay separate fields and are both
 * surfaced in the item record — they are the reason the project can publish
 * archive material at all.
 *
 * A restricted item is not offered for sale. That covers an active restriction
 * and equally an orphan work: in copyright, with the rights holder unlocatable.
 * The item stays in the catalogue with its status stated; only the transaction
 * is withheld.
 */
export const rightsColor = (status: string): string =>
  status === 'cleared' ? '#4F6B3F' : status === 'research required' ? '#8A6A16' : '#8A1E14';

export const isRestricted = (status: string): boolean => status === 'restricted';
