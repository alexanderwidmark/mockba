'use client';

import { useState } from 'react';

import { toInches, type ChartRow } from '@/lib/size-chart';
import styles from './SizeChart.module.css';

/**
 * The size chart, beside the size register it explains.
 *
 * A `<details>` so it opens and closes with no script, and so a reader who
 * never asks for it is not handed a table. Inches first, because the price is
 * stated in dollars; centimetres are one press away and are the partner's own
 * figures. The selected size is marked in the table as it is in the register.
 */
export default function SizeChart({ rows, active }: { rows: ChartRow[]; active: string }) {
  const [unit, setUnit] = useState<'in' | 'cm'>('in');
  const show = (cm: number) => (unit === 'in' ? toInches(cm) : String(cm));

  return (
    <details className={styles.chart}>
      <summary className={styles.summary}>Size chart</summary>

      <div className={styles.body}>
        <div className={styles.unitRow}>
          <span className={styles.key}>
            Measurements in {unit === 'in' ? 'inches' : 'centimetres'}
          </span>
          <div className={styles.units} role="group" aria-label="Unit of measurement">
            {(['in', 'cm'] as const).map((u) => (
              <button
                type="button"
                key={u}
                aria-pressed={unit === u}
                onClick={() => setUnit(u)}
                className={`${styles.unit} ${unit === u ? styles.unitSelected : ''}`}
              >
                {u}
              </button>
            ))}
          </div>
        </div>

        <table className={styles.table}>
          <thead>
            <tr>
              <th scope="col">Size</th>
              <th scope="col">Chest width</th>
              <th scope="col">Length</th>
              <th scope="col">Sleeve</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.size} data-active={r.size === active ? '' : undefined}>
                <th scope="row">{r.size}</th>
                <td>{show(r.chest)}</td>
                <td>{show(r.length)}</td>
                <td>{show(r.sleeve)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <p className={styles.note}>Boxy fit. Chest width measured flat, armpit to armpit.</p>
      </div>
    </details>
  );
}
