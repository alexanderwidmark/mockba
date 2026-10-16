/**
 * Where a source stands in the archive.
 *
 * The register used to be built from the catalogue, so it could only ever list
 * sources that had already become objects — four rows that said nothing the
 * item records had not said already. An archive's register lists its holdings;
 * whether a holding has been published is a column in it, not the price of
 * entry.
 *
 * The state is derived, never stored. A source with a published item is issued
 * whatever its rights say — Drain the Swamp is catalogued and restricted at the
 * same time, and both facts belong on the row. A source with no item is placed
 * by the rights position alone, because that position is the only thing
 * standing between it and an object.
 */

export type SourceState = 'issued' | 'cleared' | 'research' | 'withheld';

export const STATE_LABEL: Record<SourceState, string> = {
  issued: 'Issued',
  cleared: 'Cleared',
  research: 'Research required',
  withheld: 'Withheld',
};

/** What the state means, stated on the row rather than left to be inferred. */
export const STATE_NOTE: Record<SourceState, string> = {
  issued: 'Published as an item in a series.',
  cleared: 'Cleared for use. Not yet made into an object.',
  research: 'Provenance or rights still being established.',
  withheld: 'Not offered while the rights record remains restricted.',
};

export function sourceState(rights: string, issued: boolean): SourceState {
  if (issued) return 'issued';

  const value = rights.trim().toLowerCase();
  if (value === 'restricted') return 'withheld';
  if (value === 'cleared') return 'cleared';

  /* Anything else — 'research required', an empty field, a value nobody has
     seen before — is work outstanding. A source is never assumed clear. */
  return 'research';
}

/** Register order: what can be bought, then what is close, then what is not. */
const RANK: Record<SourceState, number> = { issued: 0, cleared: 1, research: 2, withheld: 3 };

export function byState<T extends { state: SourceState; year: string }>(a: T, b: T): number {
  const rank = RANK[a.state] - RANK[b.state];
  if (rank !== 0) return rank;
  return (a.year || '').localeCompare(b.year || '', undefined, { numeric: true });
}

/**
 * Whether the archive may publish its scan of a source.
 *
 * The register's own position decides it. A source is withheld because the
 * rights record is restricted; reproducing the sheet on a public page is the
 * one thing that position forbids, and a register that prints what it says it
 * is not offering would be worth nothing. Those rows stay plateless, and the
 * gap is the honest part.
 *
 * Everything else — issued, cleared, or still in research with no restriction
 * found — may show its plate. An issued source is already printed on a garment
 * and photographed in the catalogue, so the scan adds no exposure that the
 * item record has not already taken.
 */
export const plateMayBeShown = (state: SourceState): boolean => state !== 'withheld';

/**
 * What MOCKBA is doing with a source, recorded apart from the source's rights
 * position because they are different facts about different things. The field
 * is free text in Shopify and may be empty, which is the normal case.
 */
export const PROGRAMME_LABEL: Record<string, string> = {
  'in preparation': 'Item in preparation',
  reserved: 'Reserved for a later series',
};

export const programmeLabel = (value: string): string =>
  PROGRAMME_LABEL[value.trim().toLowerCase()] ?? '';
