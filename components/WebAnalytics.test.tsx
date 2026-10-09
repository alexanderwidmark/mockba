// @vitest-environment jsdom

import React from 'react';
import { cleanup, render, waitFor } from '@testing-library/react';
import { act } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { analyticsComponent, injectAnalytics, order } = vi.hoisted(() => ({
  analyticsComponent: vi.fn(() => null),
  injectAnalytics: vi.fn(),
  order: [] as string[],
}));

vi.mock('@vercel/analytics', () => ({ inject: injectAnalytics }));
vi.mock('@vercel/analytics/next', () => ({ Analytics: analyticsComponent }));

import { CONSENT_CHANGED, writeConsent } from '../lib/consent';
import WebAnalytics from './WebAnalytics';

/** A reader who has permitted measurement. */
const permit = () => writeConsent(localStorage, { measurement: true, marketing: false });

function PassivePageEvent() {
  React.useEffect(() => {
    order.push('page-event');
  }, []);
  return null;
}

describe('WebAnalytics', () => {
  beforeEach(() => {
    /* No vitest config means no auto cleanup: without this, every mounted
       WebAnalytics from an earlier test keeps its consent listener attached. */
    cleanup();
    analyticsComponent.mockClear();
    injectAnalytics.mockClear();
    injectAnalytics.mockImplementation(() => void order.push('analytics-init'));
    order.length = 0;
    localStorage.clear();
    sessionStorage.clear();
    history.replaceState({}, '', '/');
  });

  /* The whole point of the gate: an undecided reader is not measured. */
  it('does not load the SDK before a decision is recorded', async () => {
    render(React.createElement(WebAnalytics));

    await Promise.resolve();
    expect(injectAnalytics).not.toHaveBeenCalled();
    expect(analyticsComponent).not.toHaveBeenCalled();
  });

  it('does not load the SDK after measurement is refused', async () => {
    writeConsent(localStorage, { measurement: false, marketing: false });
    render(React.createElement(WebAnalytics));

    await Promise.resolve();
    expect(injectAnalytics).not.toHaveBeenCalled();
  });

  it('initializes analytics before passive page events run', async () => {
    permit();

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

  /* Permission arrives at the notice, which is after this component mounted. */
  it('loads the SDK when permission arrives after mount', async () => {
    render(React.createElement(WebAnalytics));
    expect(injectAnalytics).not.toHaveBeenCalled();

    permit();
    act(() => void window.dispatchEvent(new CustomEvent(CONSENT_CHANGED)));

    await waitFor(() => expect(injectAnalytics).toHaveBeenCalledTimes(1));
  });

  it('loads the SDK once however often the decision is re-announced', async () => {
    permit();
    render(React.createElement(WebAnalytics));
    await waitFor(() => expect(injectAnalytics).toHaveBeenCalledTimes(1));

    act(() => void window.dispatchEvent(new CustomEvent(CONSENT_CHANGED)));
    act(() => void window.dispatchEvent(new CustomEvent(CONSENT_CHANGED)));

    expect(injectAnalytics).toHaveBeenCalledTimes(1);
  });

  it('does not mount Vercel Analytics after this device is disabled', async () => {
    permit();
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
    permit();
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

  /* The SDK keeps its own queue, so a decision withdrawn mid-session has to be
     caught on the way out as well as on the way in. */
  it('drops an event once the decision is withdrawn', async () => {
    permit();
    render(React.createElement(WebAnalytics));
    await waitFor(() => expect(injectAnalytics).toHaveBeenCalled());

    const props = injectAnalytics.mock.calls[0]?.[0] as unknown as {
      beforeSend: (event: unknown) => unknown;
    };
    expect(props.beforeSend({ type: 'pageview' })).not.toBeNull();

    localStorage.clear();
    expect(props.beforeSend({ type: 'pageview' })).toBeNull();
  });

  it('keeps surrounding product UI mounted when SDK initialization throws', () => {
    permit();
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
