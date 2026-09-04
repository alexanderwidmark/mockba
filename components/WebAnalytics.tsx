'use client';

import { inject } from '@vercel/analytics';
import type { BeforeSendEvent } from '@vercel/analytics/next';
import { useLayoutEffect } from 'react';

import { applyAnalyticsControl } from '../lib/analytics';

const blockDisabledEvent = (event: BeforeSendEvent) => {
  try {
    return window.localStorage.getItem('va-disable') ? null : event;
  } catch {
    return null;
  }
};

export default function WebAnalytics() {
  useLayoutEffect(() => {
    try {
      const result = applyAnalyticsControl(window.location.href, window.localStorage);
      if (result.cleanHref !== window.location.href) {
        window.history.replaceState(window.history.state, '', result.cleanHref);
      }
      if (result.disabled) return;

      inject({
        beforeSend: blockDisabledEvent,
        framework: 'next',
      });
    } catch {
      return;
    }
  }, []);

  return null;
}
