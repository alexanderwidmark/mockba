// @vitest-environment jsdom

import React from 'react';
import { act, render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { trackMockbaEvent } = vi.hoisted(() => ({
  trackMockbaEvent: vi.fn(),
}));

vi.mock('../lib/analytics-client', () => ({ trackMockbaEvent }));

import AnalyticsVisibilityEvent from './AnalyticsVisibilityEvent';

describe('AnalyticsVisibilityEvent', () => {
  let callback: IntersectionObserverCallback;

  beforeEach(() => {
    trackMockbaEvent.mockClear();
    class Observer {
      constructor(cb: IntersectionObserverCallback) {
        callback = cb;
      }
      observe() {}
      disconnect() {}
      unobserve() {}
      takeRecords() { return []; }
      root = null;
      rootMargin = '';
      thresholds = [];
    }
    vi.stubGlobal('IntersectionObserver', Observer);
  });

  it('tracks once when the marker becomes visible', () => {
    render(
      React.createElement(AnalyticsVisibilityEvent, {
        name: 'source_note_read',
        detail: { item: 'MAC-12' },
      }),
    );
    expect(trackMockbaEvent).not.toHaveBeenCalled();

    act(() => callback([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver));
    act(() => callback([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver));

    expect(trackMockbaEvent).toHaveBeenCalledTimes(1);
    expect(trackMockbaEvent).toHaveBeenCalledWith('source_note_read', { item: 'MAC-12' });
  });
});
