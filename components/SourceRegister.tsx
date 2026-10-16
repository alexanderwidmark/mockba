import Image from 'next/image';
import Link from 'next/link';

import { rightsColor } from '@/lib/rights';
import {
  STATE_LABEL,
  STATE_NOTE,
  byState,
  plateMayBeShown,
  programmeLabel,
  sourceState,
  type SourceState,
} from '@/lib/source-state';
import type { SourceRecord } from '@/lib/shopify/sources';
import type { Item } from '@/lib/shopify/types';
import styles from './SourceRegister.module.css';

/**
 * The register of holdings.
 *
 * It lists what the archive has, not what the catalogue sells. A source
 * appears the day it is recorded; whether it has become an object is a state
 * on the row. That is what an institution's register is, and it is also the
 * honest picture of this project — most of the work here is rights research,
 * and until now none of it was visible.
 *
 * The archive source stays recorded on its own. The MOCKBA intervention is
 * named only where a source has become an item, and then as a reference to
 * that item rather than as part of this record. Work in progress on a source
 * is a third fact again, carried on its own marker and never folded into the
 * rights position beside it.
 *
 * A withheld source shows no plate. The register says the sheet is not offered
 * while its rights record is restricted, and reproducing it here would be the
 * one act that position rules out. The empty plate is the register working.
 *
 * Filtering and expansion are CSS: radio inputs ahead of the list, and a
 * `details` per row. Nothing here needs JavaScript, so with none the register
 * is simply a fully open list — which is the correct resting state anyway.
 */

type Row = SourceRecord & {
  state: SourceState;
  item: Item | null;
  /** How this row's programme marker reads, or '' when there is nothing to say. */
  programmeNote: string;
};

const key = (title: string) => title.replace(/[^\p{L}\p{N}]+/gu, '').toLowerCase();

const FILTERS: { id: SourceState | 'all'; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'issued', label: STATE_LABEL.issued },
  { id: 'cleared', label: STATE_LABEL.cleared },
  { id: 'research', label: STATE_LABEL.research },
  { id: 'withheld', label: STATE_LABEL.withheld },
];

export default function SourceRegister({
  sources,
  items,
  seriesHandle,
}: {
  sources: SourceRecord[];
  items: Item[];
  seriesHandle: string;
}) {
  /* A source is matched to its item by the archive title, which is the one
     field both carry and the one that is required. */
  const byTitle = new Map(items.map((item) => [key(item.sourceTitle), item]));

  const rows: Row[] = sources
    .map((source) => {
      const item = byTitle.get(key(source.originalTitle)) ?? null;
      const state = sourceState(source.rights, Boolean(item));
      return {
        ...source,
        item,
        state,
        /* An issued source has an item already; saying one is in preparation
           would contradict the row above it. And the plate is dropped here, at
           the one place that decides it, so no later edit can leak it back. */
        programmeNote: item ? '' : programmeLabel(source.programme),
        plate: plateMayBeShown(state) ? source.plate : null,
      };
    })
    .sort(byState);

  if (!rows.length) return null;

  const count = (id: SourceState | 'all') =>
    id === 'all' ? rows.length : rows.filter((r) => r.state === id).length;
  const shown = FILTERS.filter((f) => count(f.id) > 0);

  return (
    <section className={styles.section} id="sources">
      <div className={styles.eyebrow}>Register of sources</div>
      <p className={styles.standfirst}>
        Every poster the archive holds, whether or not it has become an object. A source is
        entered when it is recorded and stays entered; the state says how far it has got.
      </p>

      {/*
        The inputs sit ahead of both the filter row and the list so one `:checked`
        can reach each of them. They are off-screen rather than hidden, so they
        stay focusable and the labels stay operable from a keyboard.
      */}
      {shown.map((f) => (
        <input
          key={f.id}
          type="radio"
          name="mockba-source-filter"
          id={`mockba-source-${f.id}`}
          className={styles.radio}
          data-filter={f.id}
          defaultChecked={f.id === 'all'}
        />
      ))}

      <div className={styles.filters} role="group" aria-label="Filter the register by state">
        {shown.map((f) => (
          <label key={f.id} htmlFor={`mockba-source-${f.id}`} className={styles.filter}>
            {f.label}
            <span className={styles.tally}>{count(f.id)}</span>
          </label>
        ))}
      </div>

      <div className={styles.list}>
        {rows.map((row) => (
          <details className={styles.row} key={row.handle} data-state={row.state}>
            <summary className={styles.summary}>
              <span className={styles.state} data-state={row.state}>
                {row.item ? `Item ${row.item.no} · ${STATE_LABEL.issued}` : STATE_LABEL[row.state]}
              </span>

              <span className={styles.heading}>
                <span className={styles.plate} data-empty={row.plate ? undefined : ''}>
                  {row.plate ? (
                    <Image
                      src={row.plate.url}
                      alt={row.plate.alt}
                      width={row.plate.width ?? 80}
                      height={row.plate.height ?? 110}
                      sizes="56px"
                      className={styles.plateImage}
                    />
                  ) : null}
                </span>

                <span>
                  <span className={styles.title}>{row.originalTitle}</span>
                  <span className={styles.facts}>
                    {[row.artist, row.year, row.origin].filter(Boolean).join(' · ')}
                  </span>
                </span>
              </span>

              <span className={styles.rights}>
                <span style={{ color: rightsColor(row.rights) }}>{row.rights || 'unrecorded'}</span>
                <span className={styles.risk}>{row.risk ? `${row.risk} risk` : ''}</span>
                {row.programmeNote ? (
                  <span className={styles.programme}>{row.programmeNote}</span>
                ) : null}
              </span>
            </summary>

            <div className={styles.expanded}>
              <div className={styles.meta}>
                <span className={styles.metaKey}>artist</span>
                <span>{row.artist}</span>
                <span className={styles.metaKey}>year</span>
                <span>{row.year || 'unrecorded'}</span>
                <span className={styles.metaKey}>origin</span>
                <span>{row.origin || 'unrecorded'}</span>
                {row.purpose ? (
                  <>
                    <span className={styles.metaKey}>purpose</span>
                    <span>{row.purpose}</span>
                  </>
                ) : null}
                <span className={styles.metaKey}>state</span>
                <span>{STATE_NOTE[row.state]}</span>
              </div>

              {/* A source note is written in paragraphs in Shopify and is kept
                  in paragraphs here; a multi-line text field collapses into one
                  block otherwise. */}
              {row.note
                ? row.note
                    .split(/\n\s*\n/)
                    .map((para) => para.trim())
                    .filter(Boolean)
                    .map((para, i) => (
                      <p className={styles.note} key={i}>
                        {para}
                      </p>
                    ))
                : null}

              {row.item ? (
                <Link href={`/series/${seriesHandle}/${row.item.handle}`} className={styles.consult}>
                  Consult item {row.item.no} — {row.item.title} →
                </Link>
              ) : null}
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
