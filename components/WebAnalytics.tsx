'use client';

import { inject } from '@vercel/analytics';
import { Analytics, type BeforeSendEvent } from '@vercel/analytics/next';
import { createElement, useLayoutEffect, useState } from 'react';

import { applyAnalyticsControl } from '../lib/analytics';

const blockDisabledEvent = (event: BeforeSendEvent) =>
  window.localStorage.getItem('va-disable') ? null : event;

export default function WebAnalytics() {
  const [enabled, setEnabled] = useState(false);

  useLayoutEffect(() => {
    const result = applyAnalyticsControl(window.location.href, window.localStorage);
    if (result.cleanHref !== window.location.href) {
      window.history.replaceState(window.history.state, '', result.cleanHref);
    }
    if (result.disabled) return;

    inject({
      beforeSend: blockDisabledEvent,
      disableAutoTrack: true,
      framework: 'next',
    });
    setEnabled(true);
  }, []);

  if (!enabled) return null;

  return createElement(Analytics, { beforeSend: blockDisabledEvent });
}
