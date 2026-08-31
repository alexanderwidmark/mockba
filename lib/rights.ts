/**
 * Rights colour-coding, territory resolution and the sale gate.
 *
 * `rights_status` and `enforcement_risk` stay separate fields and are both
 * surfaced in the item record — they are the reason the project can publish
 * archive material at all.
 *
 * A restricted item is not offered for sale. That covers an active restriction
 * and equally an orphan work: in copyright, with the rights holder unlocatable.
 * The item stays in the catalogue with its status stated; only the transaction
 * is withheld.
 *
 * Copyright is territorial, so the status is too. The same poster can be out of
 * term in one market and in copyright in another — a 1920 work is clear in the
 * US on the 95-year rule while a joint author who died in 1962 keeps a European
 * term running to 2032. One global value has to describe the worst case
 * everywhere or it is wrong somewhere, and understating it is the failure this
 * project can least afford.
 *
 * So the source record may carry a status per territory. Where it does, the
 * buyer's territory selects the value; where it does not, the base field
 * applies to everyone. The gate and the published field read the same data, and
 * that is deliberate: a visitor is never told one thing while the cart is
 * decided by another.
 */
export type Territory = 'us' | 'eu' | 'row';

/**
 * `eu` is the life+70 European bloc rather than the political union: the EEA,
 * the UK and Switzerland run the same term, so they resolve to the same rights
 * value. `row` is everywhere else and reads the base field.
 */
const EU_TERM: ReadonlySet<string> = new Set([
  'AT', 'BE', 'BG', 'CH', 'CY', 'CZ', 'DE', 'DK', 'EE', 'ES', 'FI', 'FR', 'GB',
  'GR', 'HR', 'HU', 'IE', 'IS', 'IT', 'LI', 'LT', 'LU', 'LV', 'MT', 'NL', 'NO',
  'PL', 'PT', 'RO', 'SE', 'SI', 'SK',
]);

export const territoryOf = (country: string): Territory => {
  const c = (country || '').toUpperCase();
  if (c === 'US') return 'us';
  return EU_TERM.has(c) ? 'eu' : 'row';
};

/** How a territory is written where the value is shown to a reader. */
export const territoryLabel = (t: Territory): string =>
  t === 'us' ? 'US' : t === 'eu' ? 'EU' : 'international';

export type ResolvedRights = {
  status: string;
  risk: string;
  /** True when a territory-specific value was found, not the base field. */
  scoped: boolean;
  territory: Territory;
};

/**
 * Resolve the rights pair for one territory.
 *
 * `read` takes a metaobject field key so the same resolution serves both the
 * normalised source record and the sale gate's own query — one rule, applied in
 * both places, rather than two that can drift apart.
 *
 * A territory value is used only when it is present and non-empty; anything
 * else falls through to the base field, which must therefore hold the most
 * restrictive status that applies anywhere.
 */
export function resolveRights(
  read: (key: string) => string | null | undefined,
  territory: Territory,
): ResolvedRights {
  const pick = (base: string): { value: string; scoped: boolean } => {
    const scoped = (read(`${base}_${territory}`) ?? '').trim();
    if (scoped) return { value: scoped, scoped: true };
    return { value: (read(base) ?? '').trim(), scoped: false };
  };

  const status = pick('rights_status');
  const risk = pick('enforcement_risk');

  return {
    status: status.value,
    risk: risk.value,
    scoped: status.scoped,
    territory,
  };
}

export const rightsColor = (status: string): string =>
  status === 'cleared' ? '#4F6B3F' : status === 'research required' ? '#8A6A16' : '#8A1E14';

export const isRestricted = (status: string): boolean => status === 'restricted';
