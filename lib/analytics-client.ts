'use client';

import { track } from '@vercel/analytics';

import {
  sendAnalyticsEvent,
  type EventDetail,
  type MockbaEventName,
} from './analytics';

export function trackMockbaEvent(name: MockbaEventName, detail?: EventDetail) {
  if (typeof window === 'undefined') return false;

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
}
