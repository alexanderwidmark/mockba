/**
 * Consent for anything that is not strictly necessary.
 *
 * The document stores nothing on a reader's device for measurement or
 * advertising until they permit it. Two things are exempt and are never put to
 * a choice: the cart, which cannot work without its own record, and this
 * decision itself.
 *
 * Everything here fails closed. An unreadable store, a record written against
 * a different set of categories, or anything that is not exactly the shape
 * below counts as *undecided*, and undecided grants nothing. A reader in a
 * private window is asked again rather than quietly measured.
 */

export type ConsentCategory = 'measurement' | 'marketing';

export type ConsentRecord = {
  v: number;
  measurement: boolean;
  marketing: boolean;
  /** When the decision was taken. Kept so the record can be shown back. */
  at: string;
};

/**
 * Bump this whenever a category is added, removed, or means something it did
 * not mean before. A record written against an older set is not a decision
 * about the current one, so everyone is asked again. That is the point.
 */
export const CONSENT_VERSION = 1;

export const CONSENT_KEY = 'mockba:consent';

/** Dispatched on `window` once a decision is recorded or withdrawn. */
export const CONSENT_CHANGED = 'mockba:consent-changed';

/** Dispatched on `window` to reopen the notice so a decision can be changed. */
export const CONSENT_REOPEN = 'mockba:consent-reopen';

type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

/** The decision on record, or null where there is none to read. */
export function readConsent(storage: StorageLike): ConsentRecord | null {
  try {
    const raw = storage.getItem(CONSENT_KEY);
    if (!raw) return null;

    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;

    const record = parsed as Partial<ConsentRecord>;
    if (record.v !== CONSENT_VERSION) return null;
    if (typeof record.measurement !== 'boolean') return null;
    if (typeof record.marketing !== 'boolean') return null;

    return {
      v: CONSENT_VERSION,
      measurement: record.measurement,
      marketing: record.marketing,
      at: typeof record.at === 'string' ? record.at : '',
    };
  } catch {
    return null;
  }
}

/** Whether one category is permitted. Undecided and unreadable both mean no. */
export function hasConsent(category: ConsentCategory, storage: StorageLike): boolean {
  const record = readConsent(storage);
  return record ? record[category] === true : false;
}

export function writeConsent(
  storage: StorageLike,
  choice: Record<ConsentCategory, boolean>,
  now: () => string = () => new Date().toISOString(),
): ConsentRecord | null {
  const record: ConsentRecord = {
    v: CONSENT_VERSION,
    measurement: choice.measurement === true,
    marketing: choice.marketing === true,
    at: now(),
  };

  try {
    storage.setItem(CONSENT_KEY, JSON.stringify(record));
    return record;
  } catch {
    // The decision could not be recorded, so there is no decision. The notice
    // returns on the next page, which is the honest outcome.
    return null;
  }
}

/** Withdraw the decision entirely. The reader returns to undecided. */
export function withdrawConsent(storage: StorageLike): boolean {
  try {
    storage.removeItem(CONSENT_KEY);
    return true;
  } catch {
    return false;
  }
}
