// @vitest-environment jsdom

import React from 'react';
import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { trackMockbaEvent } = vi.hoisted(() => ({
  trackMockbaEvent: vi.fn(),
}));

vi.mock('../lib/analytics-client', () => ({ trackMockbaEvent }));

import AnalyticsEvent from './AnalyticsEvent';

describe('AnalyticsEvent', () => {
  beforeEach(() => trackMockbaEvent.mockClear());

  it('tracks once when mounted', () => {
    const view = render(React.createElement(AnalyticsEvent, { name: 'catalogue_view' }));
    view.rerender(React.createElement(AnalyticsEvent, { name: 'catalogue_view' }));

    expect(trackMockbaEvent).toHaveBeenCalledTimes(1);
    expect(trackMockbaEvent).toHaveBeenCalledWith('catalogue_view', undefined);
  });
});
