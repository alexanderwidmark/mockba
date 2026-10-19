import { describe, expect, it } from 'vitest';

import { byState, programmeLabel, sourceState } from './source-state';

describe('sourceState', () => {
  it('calls a source with a published item issued', () => {
    expect(sourceState('cleared', true)).toBe('issued');
  });

  /* Drain the Swamp is catalogued and restricted at once. The register says
     issued; the rights field on the same row says restricted. */
  it('calls a restricted source issued once it has an item', () => {
    expect(sourceState('restricted', true)).toBe('issued');
  });

  it('withholds a restricted source that has no item', () => {
    expect(sourceState('restricted', false)).toBe('withheld');
  });

  it('places a cleared source with no item as cleared', () => {
    expect(sourceState('cleared', false)).toBe('cleared');
  });

  it('reads the position whatever its casing or padding', () => {
    expect(sourceState('  RESTRICTED ', false)).toBe('withheld');
    expect(sourceState('Cleared', false)).toBe('cleared');
  });

  /* A source is never assumed clear: an empty or unrecognised rights field is
     work outstanding, not permission. */
  it('treats an unrecorded or unknown position as research outstanding', () => {
    expect(sourceState('research required', false)).toBe('research');
    expect(sourceState('', false)).toBe('research');
    expect(sourceState('pending counsel', false)).toBe('research');
  });
});

describe('byState', () => {
  const row = (state: string, year: string) => ({ state, year }) as never;

  it('orders what can be bought, then what is close, then what is not', () => {
    const rows = [
      row('withheld', '1930'),
      row('research', '1920'),
      row('issued', '1927'),
      row('cleared', '1921'),
    ];

    expect([...rows].sort(byState).map((r) => (r as unknown as { state: string }).state)).toEqual([
      'issued',
      'cleared',
      'research',
      'withheld',
    ]);
  });

  it('orders by year within a state, oldest first', () => {
    const rows = [row('issued', '1988'), row('issued', '1920'), row('issued', '1927')];

    expect([...rows].sort(byState).map((r) => (r as unknown as { year: string }).year)).toEqual([
      '1920',
      '1927',
      '1988',
    ]);
  });
});

describe('programmeLabel', () => {
  it('reads the recorded value whatever its casing or padding', () => {
    expect(programmeLabel(' In Preparation ')).toBe('Item in preparation');
    expect(programmeLabel('reserved')).toBe('Reserved for a later series');
  });

  /* An empty or unrecognised value is no marker at all, never a guess. */
  it('says nothing for an empty or unknown value', () => {
    expect(programmeLabel('')).toBe('');
    expect(programmeLabel('somebody typed this')).toBe('');
  });
});
