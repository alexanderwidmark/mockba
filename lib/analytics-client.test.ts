// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from 'vitest';

const { track } = vi.hoisted(() => ({ track: vi.fn() }));

vi.mock('@vercel/analytics', () => ({ track }));

import { trackMockbaEvent } from './analytics-client';
import { writeConsent } from './consent';

describe('trackMockbaEvent', () => {
  beforeEach(() => {
    track.mockClear();
    localStorage.clear();
    sessionStorage.clear();
  });

  it('sends nothing before a decision is recorded', () => {
    expect(trackMockbaEvent('add_to_cart', { item: 'MAC-12' })).toBe(false);
    expect(track).not.toHaveBeenCalled();
  });

  it('sends nothing after measurement is refused', () => {
    writeConsent(localStorage, { measurement: false, marketing: false });

    expect(trackMockbaEvent('add_to_cart', { item: 'MAC-12' })).toBe(false);
    expect(track).not.toHaveBeenCalled();
  });

  /* Resolving a traffic source writes to the device, so a refused reader must
     not reach it — the check has to sit in front of the send, not inside it. */
  it('writes no traffic source for a reader who has not permitted measurement', () => {
    trackMockbaEvent('catalogue_view');

    expect(sessionStorage.getItem('mockba:traffic-source')).toBeNull();
  });

  it('sends once measurement is permitted', () => {
    writeConsent(localStorage, { measurement: true, marketing: false });

    expect(trackMockbaEvent('add_to_cart', { item: 'MAC-12' })).toBe(true);
    expect(track).toHaveBeenCalledWith('add_to_cart', expect.objectContaining({ item: 'MAC-12' }));
  });

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
