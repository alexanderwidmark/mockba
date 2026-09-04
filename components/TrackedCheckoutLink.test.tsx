// @vitest-environment jsdom

import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const { trackMockbaEvent } = vi.hoisted(() => ({
  trackMockbaEvent: vi.fn(),
}));

vi.mock('../lib/analytics-client', () => ({ trackMockbaEvent }));

import TrackedCheckoutLink from './TrackedCheckoutLink';

describe('TrackedCheckoutLink', () => {
  it('tracks checkout start on click', () => {
    render(
      React.createElement(TrackedCheckoutLink, {
        href: 'https://shop.mockba.org/cart/c/checkout',
        children: 'Proceed to checkout',
      }),
    );

    const link = screen.getByRole('link', { name: 'Proceed to checkout' });
    link.addEventListener('click', (event) => event.preventDefault());
    fireEvent.click(link);
    expect(trackMockbaEvent).toHaveBeenCalledWith('checkout_start');
  });
});
