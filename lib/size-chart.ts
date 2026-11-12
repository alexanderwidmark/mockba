/**
 * Garment measurements for the T-shirt blank, as published by the print
 * partner (Airventory), in centimetres. Inches are derived, never stored, so
 * the two columns cannot disagree.
 *
 * Only what the partner states is stated here. Chest width is a flat
 * measurement; how length and sleeve are taken is not published, so the
 * document does not claim it.
 */

type Row = { chest: number; length: number; sleeve: number };

const CHART_CM: Record<string, Row> = {
  S: { chest: 57, length: 73, sleeve: 21.5 },
  M: { chest: 59, length: 75, sleeve: 22.5 },
  L: { chest: 61, length: 77, sleeve: 23.5 },
  XL: { chest: 63, length: 79, sleeve: 24.5 },
  '2XL': { chest: 65, length: 81, sleeve: 25.5 },
};

export type ChartRow = { size: string } & Row;

/**
 * The chart for an item, or null. A chart is shown only for a T-shirt whose
 * every size the partner measures: a tote bag, or a size the table does not
 * cover, gets no table rather than a partly true one.
 */
export function sizeChartFor(category: string, sizes: string[]): ChartRow[] | null {
  if (!/t-?shirt/i.test(category) || !sizes.length) return null;
  if (!sizes.every((s) => s in CHART_CM)) return null;
  return sizes.map((size) => ({ size, ...CHART_CM[size] }));
}

export const toInches = (cm: number): string => (cm / 2.54).toFixed(1);
