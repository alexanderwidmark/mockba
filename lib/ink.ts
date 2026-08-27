/**
 * Ink simulation for the garment mockup.
 *
 * `multiply` only reads as ink on a LIGHT blank; on a dark blank it crushes the
 * poster to black. Dark garments therefore print normally, screened back so the
 * weave still reads through. This split is required — do not collapse it.
 */

/** Relative luminance of a hex colour, 0–1. */
export function luminance(hex: string): number {
  const h = (hex || '#1A1A18').replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const n = parseInt(full, 16);
  if (Number.isNaN(n)) return 0;
  return (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
}

export const isLightBlank = (garmentColor: string): boolean => luminance(garmentColor) > 0.5;

/** The printed secondary line, derived from the ink colour. */
export const subInk = (ink: string): string =>
  (ink || '').toLowerCase() === '#171512' ? '#5C574C' : '#B9B4A8';

/** CSS `aspect-ratio` from the `print_aspect` metafield ('3/2' -> '3 / 2'). */
export const frameAspect = (printAspect: string | undefined): string =>
  (printAspect || '3/4').replace('/', ' / ');

export type InkStyle = {
  backgroundColor: string;
  mixBlendMode: 'multiply' | 'normal';
  opacity: number;
  filter: string;
};

export function inkStyle(garmentColor: string): InkStyle {
  return isLightBlank(garmentColor)
    ? {
        backgroundColor: garmentColor,
        mixBlendMode: 'multiply',
        opacity: 0.95,
        filter: 'contrast(1.04)',
      }
    : {
        backgroundColor: '#14130F',
        mixBlendMode: 'normal',
        opacity: 0.92,
        filter: 'contrast(1.06) brightness(1.12) saturate(1.04)',
      };
}

/** Rights colour-coding, surfaced in the item record. */
export const rightsColor = (status: string): string =>
  status === 'cleared' ? '#4F6B3F' : status === 'research required' ? '#8A6A16' : '#8A1E14';
