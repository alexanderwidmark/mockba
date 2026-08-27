/**
 * Rights colour-coding. `rights_status` and `enforcement_risk` stay separate
 * fields and are both surfaced in the item record — they are the reason the
 * project can publish archive material at all.
 */
export const rightsColor = (status: string): string =>
  status === 'cleared' ? '#4F6B3F' : status === 'research required' ? '#8A6A16' : '#8A1E14';
