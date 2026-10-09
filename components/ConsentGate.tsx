'use client';

import { useCallback, useEffect, useState } from 'react';

import {
  CONSENT_CHANGED,
  CONSENT_REOPEN,
  readConsent,
  writeConsent,
  type ConsentCategory,
} from '@/lib/consent';
import styles from './ConsentGate.module.css';

type Choice = Record<ConsentCategory, boolean>;

const REFUSE_ALL: Choice = { measurement: false, marketing: false };
const PERMIT_ALL: Choice = { measurement: true, marketing: true };

/**
 * Anything measurement stored before a refusal. Dropped when the reader
 * refuses, because withdrawing permission has to withdraw the record too —
 * otherwise the refusal is a label on data that is still there.
 */
const MEASUREMENT_KEYS = ['mockba:traffic-source'];

function forgetMeasurement() {
  for (const key of MEASUREMENT_KEYS) {
    try {
      window.sessionStorage.removeItem(key);
    } catch {
      /* A store that cannot be written cannot be holding anything either. */
    }
    try {
      window.localStorage.removeItem(key);
    } catch {
      /* As above. */
    }
  }
}

const ROWS: { key: ConsentCategory; name: string; body: string }[] = [
  {
    key: 'measurement',
    name: 'Measurement',
    body:
      'Which pages are read, and whether an announcement reached anyone at all. Counted on this site only, with no profile built and nothing sold on.',
  },
  {
    key: 'marketing',
    name: 'Advertising',
    body:
      'Lets an advertising platform recognise a visit it was paid for. This one sends data to that platform, which is why it is asked separately.',
  },
];

/**
 * The notice of measurement.
 *
 * Nothing that is not strictly necessary runs until a decision is on record,
 * so the gate is the thing that must be right rather than the pixel behind it.
 * Refusing is one action, exactly like permitting: no pre-ticked box, no
 * buried link, no second colour on the answer we would prefer.
 *
 * It renders nothing on the server and nothing on the first client pass, so it
 * can never displace the document it sits under.
 */
export default function ConsentGate() {
  const [open, setOpen] = useState(false);
  const [choosing, setChoosing] = useState(false);
  const [choice, setChoice] = useState<Choice>(REFUSE_ALL);

  useEffect(() => {
    const record = (() => {
      try {
        return readConsent(window.localStorage);
      } catch {
        return null;
      }
    })();

    if (!record) setOpen(true);
    else setChoice({ measurement: record.measurement, marketing: record.marketing });

    const reopen = () => {
      try {
        const current = readConsent(window.localStorage);
        if (current) setChoice({ measurement: current.measurement, marketing: current.marketing });
      } catch {
        /* Undecided is the safe reading. */
      }
      setChoosing(true);
      setOpen(true);
    };

    window.addEventListener(CONSENT_REOPEN, reopen);
    return () => window.removeEventListener(CONSENT_REOPEN, reopen);
  }, []);

  const record = useCallback((decision: Choice) => {
    try {
      writeConsent(window.localStorage, decision);
    } catch {
      /* Unrecorded is undecided: the notice returns on the next page. */
    }

    if (!decision.measurement) forgetMeasurement();

    try {
      window.dispatchEvent(new CustomEvent(CONSENT_CHANGED));
    } catch {
      /* Nothing is listening in an environment without CustomEvent. */
    }

    setOpen(false);
    setChoosing(false);
  }, []);

  if (!open) return null;

  return (
    <aside className={styles.notice} aria-label="Record of measurement">
      <div className={styles.statement}>
        <div className={styles.eyebrow}>Record of measurement</div>
        <p className={styles.body}>
          Nothing is stored on your device for measurement or advertising until you permit it. The
          cart keeps its own record, which it cannot work without, and so does this decision.
        </p>
      </div>

      {choosing ? (
        <div className={styles.register}>
          <div className={styles.row}>
            <div>
              <div className={styles.rowKey}>Essential</div>
              <p className={styles.rowBody}>
                The cart, and this decision. The site cannot be operated without them, so they are
                stated rather than offered.
              </p>
            </div>
            <div className={styles.fixed}>Always</div>
          </div>

          {ROWS.map((row) => (
            <div className={styles.row} key={row.key}>
              <div>
                <div className={styles.rowKey}>{row.name}</div>
                <p className={styles.rowBody}>{row.body}</p>
              </div>
              <div className={styles.switch} role="group" aria-label={row.name}>
                <button
                  type="button"
                  className={`${styles.state} ${choice[row.key] ? '' : styles.stateSelected}`}
                  aria-pressed={!choice[row.key]}
                  onClick={() => setChoice((c) => ({ ...c, [row.key]: false }))}
                >
                  Refused
                </button>
                <button
                  type="button"
                  className={`${styles.state} ${choice[row.key] ? styles.stateSelected : ''}`}
                  aria-pressed={choice[row.key]}
                  onClick={() => setChoice((c) => ({ ...c, [row.key]: true }))}
                >
                  Permitted
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      <div className={styles.actions}>
        <button type="button" className={styles.action} onClick={() => record(REFUSE_ALL)}>
          Refuse all
        </button>
        {choosing ? (
          <button type="button" className={styles.action} onClick={() => record(choice)}>
            Record this
          </button>
        ) : (
          <button type="button" className={styles.action} onClick={() => setChoosing(true)}>
            Choose
          </button>
        )}
        <button type="button" className={styles.action} onClick={() => record(PERMIT_ALL)}>
          Permit all
        </button>
      </div>
    </aside>
  );
}

/**
 * The way back to the decision, carried in the footer colophon. Withdrawing has
 * to be as easy as giving, and a notice that cannot be reopened is not a
 * decision the reader holds.
 */
export function ConsentReopen() {
  return (
    <button
      type="button"
      className={styles.reopen}
      onClick={() => {
        try {
          window.dispatchEvent(new CustomEvent(CONSENT_REOPEN));
        } catch {
          /* Nothing to reopen where events cannot be dispatched. */
        }
      }}
    >
      Change what is recorded
    </button>
  );
}
