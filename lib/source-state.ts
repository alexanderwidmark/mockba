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
