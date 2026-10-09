'use client';

import { inject } from '@vercel/analytics';
import type { BeforeSendEvent } from '@vercel/analytics/next';
import { useLayoutEffect } from 'react';

import { applyAnalyticsControl } from '../lib/analytics';
import { CONSENT_CHANGED, hasConsent } from '../lib/consent';

const blockDisabledEvent = (event: BeforeSendEvent) => {
  try {
    if (window.localStorage.getItem('va-disable')) return null;
    return hasConsent('measurement', window.localStorage) ? event : null;
  } catch {
    return null;
  }
};

/**
 * Measurement runs only once it has been permitted.
 *
 * The device control is read on every page regardless, because stripping
 * `mockba_analytics` from the URL is housekeeping rather than measurement and
 * must happen whether or not the SDK is ever loaded.
 *
 * Permission can arrive after this has already run — a reader decides at the
 * notice, not at page load — so the decision is listened for rather than read
 * once. The guard is at the injection, not at the listener, so the SDK is
 * never loaded twice.
 */
export default function WebAnalytics() {
  useLayoutEffect(() => {
    let injected = false;

    const start = () => {
      if (injected) return;

      try {
        if (!hasConsent('measurement', window.localStorage)) return;
        if (window.localStorage.getItem('va-disable')) return;

        inject({
          beforeSend: blockDisabledEvent,
          framework: 'next',
        });
        injected = true;
      } catch {
        return;
      }
    };

    try {
      const result = applyAnalyticsControl(window.location.href, window.localStorage);
      if (result.cleanHref !== window.location.href) {
        window.history.replaceState(window.history.state, '', result.cleanHref);
      }
      if (result.disabled) return;
    } catch {
      return;
    }

    start();
    window.addEventListener(CONSENT_CHANGED, start);
    return () => window.removeEventListener(CONSENT_CHANGED, start);
  }, []);

  return null;
}
