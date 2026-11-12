import { describe, expect, it } from 'vitest';

import { sizeChartFor, toInches } from './size-chart';

describe('sizeChartFor', () => {
  it('states the chart for a T-shirt in the sizes it is offered in', () => {
    const rows = sizeChartFor('T-Shirts', ['S', 'M', 'L', 'XL', '2XL']);
    expect(rows?.map((r) => r.size)).toEqual(['S', 'M', 'L', 'XL', '2XL']);
    expect(rows?.[1]).toMatchObject({ chest: 59, length: 75, sleeve: 22.5 });
  });

  it('states nothing for an object that is not a T-shirt', () => {
    expect(sizeChartFor('Tote Bags', ['S'])).toBeNull();
  });

  it('states nothing when a size is not measured', () => {
    expect(sizeChartFor('T-Shirts', ['S', '3XL'])).toBeNull();
  });
});

describe('toInches', () => {
  it('matches the partner’s published inches', () => {
    expect([73, 57, 21.5, 81, 65, 25.5].map(toInches)).toEqual([
      '28.7', '22.4', '8.5', '31.9', '25.6', '10.0',
    ]);
  });
});
