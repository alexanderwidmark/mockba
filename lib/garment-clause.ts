/**
 * The sentence in the notes for the public that describes the blank.
 *
 * It states no material fact of its own. Every value comes from the
 * specification the object carries — the `spec_template` for its category,
 * the same rows the item record prints — so the note and the record cannot
 * disagree about the garment.
 *
 * They already had. The sentence was once written with the blank spelled out,
 * and went on claiming a heavyweight 220g combed cotton boxy tee for some time
 * after the template had stopped saying any of it. A fact kept in two places
 * drifts; this one is now kept in one.
 *
 * Only the shaping belongs to the sentence. The table carries a value in its
 * own register — `Midweight 180g`, a parenthesised weave — and prose wants it
 * in lower case with the qualification left to the table.
 */

export type Spec = { k: string; v: string };

const prose = (v: string): string =>
  v
    .replace(/\s*\([^)]*\)/g, '')
    .trim()
    .replace(/^./, (c) => c.toLowerCase());

export function garmentClause(specs: Spec[], sizes: string): string {
  const row = (key: string) => specs.find((r) => r.k.toLowerCase() === key)?.v ?? '';

  const parts = [
    prose(row('garment')),
    prose(row('fabric')),
    row('fit') ? `${prose(row('fit'))} fit` : '',
    sizes ? `sizes ${sizes}` : '',
  ].filter(Boolean);

  // Nothing specified and no sizes declared: say what is true of every object
  // rather than composing a sentence out of the gaps.
  if (!parts.length) return 'Every object is printed full front.';

  return `Garments are ${parts.join(', ')}, printed full front.`;
}
