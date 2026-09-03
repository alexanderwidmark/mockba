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
  });

  it('does not mount Vercel Analytics after this device is disabled', async () => {
    history.replaceState({}, '', '/?mockba_analytics=off&utm_source=founder');
    render(React.createElement(WebAnalytics));

    await waitFor(() => expect(localStorage.getItem('va-disable')).toBe('1'));
    expect(injectAnalytics).not.toHaveBeenCalled();
    expect(analyticsComponent).not.toHaveBeenCalled();
    expect(location.search).toBe('?utm_source=founder');
  });
});
