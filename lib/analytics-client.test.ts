// @vitest-environment jsdom

import { describe, expect, it, vi } from 'vitest';

const { track } = vi.hoisted(() => ({ track: vi.fn() }));

vi.mock('@vercel/analytics', () => ({ track }));

import { trackMockbaEvent } from './analytics-client';

describe('trackMockbaEvent', () => {
  it('fails closed when the browser storage getter throws', () => {
    const original = Object.getOwnPropertyDescriptor(window, 'localStorage');
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      get: () => {
        throw new Error('storage access denied');
      },
    });

    try {
      expect(trackMockbaEvent('add_to_cart', { item: 'MAC-12' })).toBe(false);
      expect(track).not.toHaveBeenCalled();
    } finally {
      if (original) Object.defineProperty(window, 'localStorage', original);
    }
  });
});