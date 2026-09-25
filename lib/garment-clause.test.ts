import { describe, expect, it } from 'vitest';

import { garmentClause } from './garment-clause';

const TSHIRT = [
  { k: 'garment', v: 'Midweight 180g' },
  { k: 'fabric', v: '100% cotton (preshrunk jersey knit)' },
  { k: 'fit', v: 'relaxed' },
  { k: 'print', v: 'DTG' },
  { k: 'placement', v: 'Full front' },
  { k: 'sizes', v: 'S–XL' },
];

describe('garmentClause', () => {
  it('states the specification the object actually carries', () => {
    expect(garmentClause(TSHIRT, 'S–XL')).toBe(
      'Garments are midweight 180g, 100% cotton, relaxed fit, sizes S–XL, printed full front.',
    );
  });

  /* The whole point of the extraction: the sentence follows the template and
     holds no weight, weave or fit of its own. */
  it('follows the template rather than any value of its own', () => {
    const heavier = TSHIRT.map((r) => (r.k === 'garment' ? { ...r, v: 'Heavyweight 206g' } : r));

    const clause = garmentClause(heavier, 'S–XL');
    expect(clause).toContain('heavyweight 206g');
    expect(clause).not.toContain('180g');
  });

  it('leaves the parenthesised qualification to the table', () => {
    expect(garmentClause(TSHIRT, 'S–XL')).not.toContain('preshrunk');
  });

  it('states the size range once, not twice', () => {
    expect(garmentClause(TSHIRT, 'S–XL').match(/S–XL/g)).toHaveLength(1);
  });

  it('drops a row the template does not carry rather than inventing one', () => {
    const noFit = TSHIRT.filter((r) => r.k !== 'fit');

    const clause = garmentClause(noFit, 'S–XL');
    expect(clause).toBe('Garments are midweight 180g, 100% cotton, sizes S–XL, printed full front.');
    expect(clause).not.toContain('fit');
  });

  it('reads a template that capitalises its keys', () => {
    const shouty = TSHIRT.map((r) => ({ ...r, k: r.k.toUpperCase() }));

    expect(garmentClause(shouty, 'S–XL')).toContain('midweight 180g');
  });

  it('says only what is true of every object when nothing is specified', () => {
    expect(garmentClause([], '')).toBe('Every object is printed full front.');
  });

  it('still describes an object that has no sizes', () => {
    const tote = [
      { k: 'material', v: '100% cotton 100 - 170 g/m²' },
      { k: 'print', v: 'DTG' },
    ];

    expect(garmentClause(tote, '')).toBe('Every object is printed full front.');
  });
});
