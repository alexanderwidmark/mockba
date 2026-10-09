import { describe, expect, it } from 'vitest';

import {
  CONSENT_KEY,
  CONSENT_VERSION,
  hasConsent,
  readConsent,
  withdrawConsent,
  writeConsent,
} from './consent';

/** A storage that can be made to fail the way a private window does. */
function memoryStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => void data.set(k, v),
    removeItem: (k: string) => void data.delete(k),
    raw: data,
  };
}

const throwingStorage = {
  getItem: () => {
    throw new Error('storage access denied');
  },
  setItem: () => {
    throw new Error('storage access denied');
  },
  removeItem: () => {
    throw new Error('storage access denied');
  },
};

describe('consent', () => {
  it('grants nothing before a decision is taken', () => {
    const storage = memoryStorage();

    expect(readConsent(storage)).toBeNull();
    expect(hasConsent('measurement', storage)).toBe(false);
    expect(hasConsent('marketing', storage)).toBe(false);
  });

  it('records a decision and reads it back', () => {
    const storage = memoryStorage();

    const written = writeConsent(storage, { measurement: true, marketing: false }, () => '2026-10-09T10:00:00Z');

    expect(written).toEqual({ v: CONSENT_VERSION, measurement: true, marketing: false, at: '2026-10-09T10:00:00Z' });
    expect(hasConsent('measurement', storage)).toBe(true);
    expect(hasConsent('marketing', storage)).toBe(false);
  });

  it('records a refusal as a decision, not as an absence', () => {
    const storage = memoryStorage();

    writeConsent(storage, { measurement: false, marketing: false });

    expect(readConsent(storage)).not.toBeNull();
    expect(hasConsent('measurement', storage)).toBe(false);
  });

  /* A record written against a different set of categories is not a decision
     about the current set. Asking again is the correct behaviour. */
  it('treats a record of another version as undecided', () => {
    const storage = memoryStorage({
      [CONSENT_KEY]: JSON.stringify({ v: CONSENT_VERSION + 1, measurement: true, marketing: true, at: '' }),
    });

    expect(readConsent(storage)).toBeNull();
    expect(hasConsent('measurement', storage)).toBe(false);
  });

  it('treats a malformed record as undecided rather than as permission', () => {
    for (const raw of ['not json', '[]', 'null', '{"v":1}', '{"v":1,"measurement":"yes","marketing":true}']) {
      const storage = memoryStorage({ [CONSENT_KEY]: raw });

      expect(readConsent(storage)).toBeNull();
      expect(hasConsent('marketing', storage)).toBe(false);
    }
  });

  it('fails closed when the store cannot be read', () => {
    expect(readConsent(throwingStorage)).toBeNull();
    expect(hasConsent('measurement', throwingStorage)).toBe(false);
  });

  /* A decision that could not be stored is not a decision: the notice has to
     come back, so nothing may be granted on the strength of the attempt. */
  it('reports no decision when the store refuses the write', () => {
    expect(writeConsent(throwingStorage, { measurement: true, marketing: true })).toBeNull();
  });

  it('coerces anything but true to a refusal', () => {
    const storage = memoryStorage();

    writeConsent(storage, { measurement: 1 as unknown as boolean, marketing: undefined as unknown as boolean });

    expect(hasConsent('measurement', storage)).toBe(false);
    expect(hasConsent('marketing', storage)).toBe(false);
  });

  it('returns to undecided when the decision is withdrawn', () => {
    const storage = memoryStorage();
    writeConsent(storage, { measurement: true, marketing: true });

    expect(withdrawConsent(storage)).toBe(true);
    expect(readConsent(storage)).toBeNull();
    expect(hasConsent('measurement', storage)).toBe(false);
  });

  it('does not throw when withdrawal cannot be written', () => {
    expect(withdrawConsent(throwingStorage)).toBe(false);
  });
});
