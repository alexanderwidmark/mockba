'use client';

import { track } from '@vercel/analytics';

import {
  sendAnalyticsEvent,
  type EventDetail,
  type MockbaEventName,
} from './analytics';
import { hasConsent } from './consent';

export function trackMockbaEvent(name: MockbaEventName, detail?: EventDetail) {
  if (typeof window === 'undefined') return false;

  try {
    /* Measurement is permitted or it does not happen. The check sits before
       the send because resolving a traffic source writes to the device, and
       that write is itself the thing consent is about. */
    if (!hasConsent('measurement', window.localStorage)) return false;

    return sendAnalyticsEvent(
      name,
      detail,
      {
        href: window.location.href,
        referrer: document.referrer,
        origin: window.location.origin,
        localStorage: window.localStorage,
        sessionStorage: window.sessionStorage,
      },
      (eventName, data) => track(eventName, data),
    );
  } catch {
    return false;
  }
}
