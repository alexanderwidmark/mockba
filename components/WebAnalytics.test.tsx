// @vitest-environment jsdom

import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { analyticsComponent, injectAnalytics, order } = vi.hoisted(() => ({
  analyticsComponent: vi.fn(() => null),
  injectAnalytics: vi.fn(),
  order: [] as string[],
}));

vi.mock('@vercel/analytics', () => ({ inject: injectAnalytics }));
vi.mock('@vercel/analytics/next', () => ({ Analytics: analyticsComponent }));

import WebAnalytics from './WebAnalytics';

function PassivePageEvent() {
  React.useEffect(() => {
    order.push('page-event');
  }, []);
  return null;
}

describe('WebAnalytics', () => {
  beforeEach(() => {
    analyticsComponent.mockClear();
    injectAnalytics.mockClear();
    injectAnalytics.mockImplementation(() => void order.push('analytics-init'));
    order.length = 0;
    localStorage.clear();
    history.replaceState({}, '', '/');
  });

  it('initializes analytics before passive page events run', async () => {
    render(
      React.createElement(
        React.Fragment,
        null,
        React.createElement(PassivePageEvent),
        React.createElement(WebAnalytics),
      ),
    );

    await waitFor(() => expect(order).toEqual(['analytics-init', 'page-event']));
    expect(injectAnalytics.mock.calls[0]?.[0]).not.toHaveProperty('disableAutoTrack');
    expect(analyticsComponent).not.toHaveBeenCalled();
  });

  it('does not mount Vercel Analytics after this device is disabled', async () => {
    history.replaceState({}, '', '/?mockba_analytics=off&utm_source=founder');
    render(React.createElement(WebAnalytics));

    await waitFor(() => expect(localStorage.getItem('va-disable')).toBe('1'));
    expect(injectAnalytics).not.toHaveBeenCalled();
    expect(analyticsComponent).not.toHaveBeenCalled();
    expect(location.search).toBe('?utm_source=founder');
  });

  it('fails closed when browser storage is unavailable during initialization', () => {
    const original = Object.getOwnPropertyDescriptor(window, 'localStorage');
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      get: () => {
        throw new Error('storage access denied');
      },
    });

    try {
      expect(() => render(React.createElement(WebAnalytics))).not.toThrow();
      expect(injectAnalytics).not.toHaveBeenCalled();
      expect(analyticsComponent).not.toHaveBeenCalled();
    } finally {
      if (original) Object.defineProperty(window, 'localStorage', original);
    }
  });

  it('drops an event when the beforeSend storage check throws', async () => {
    render(React.createElement(WebAnalytics));
    await waitFor(() => expect(injectAnalytics).toHaveBeenCalled());

    const props = injectAnalytics.mock.calls[0]?.[0] as unknown as {
      beforeSend: (event: unknown) => unknown;
    };

    const getItem = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('storage access denied');
    });

    try {
      expect(props.beforeSend({ type: 'pageview' })).toBeNull();
    } finally {
      getItem.mockRestore();
    }
  });

  it('keeps surrounding product UI mounted when SDK initialization throws', () => {
    injectAnalytics.mockImplementation(() => {
      throw new Error('analytics SDK unavailable');
    });

    expect(() =>
      render(
        React.createElement(
          React.Fragment,
          null,
          React.createElement('button', null, 'Add to cart'),
          React.createElement(WebAnalytics),
        ),
      ),
    ).not.toThrow();

    expect(document.body.textContent).toContain('Add to cart');
    expect(analyticsComponent).not.toHaveBeenCalled();
  });
});
