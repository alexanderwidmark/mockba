'use client';

import { useEffect } from 'react';

import { trackMockbaEvent } from '../lib/analytics-client';
import type { EventDetail, MockbaEventName } from '../lib/analytics';

export default function AnalyticsEvent({
  name,
  detail,
}: {
  name: MockbaEventName;
  detail?: EventDetail;
}) {
  useEffect(() => {
    trackMockbaEvent(name, detail);
    // A page-level event belongs to this mount, not to later rerenders.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
