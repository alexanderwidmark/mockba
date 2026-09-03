'use client';

import { createElement, useEffect, useRef } from 'react';

import { trackMockbaEvent } from '../lib/analytics-client';
import type { EventDetail, MockbaEventName } from '../lib/analytics';

export default function AnalyticsVisibilityEvent({
  name,
  detail,
}: {
  name: MockbaEventName;
  detail?: EventDetail;
}) {
  const marker = useRef<HTMLSpanElement>(null);
  const sent = useRef(false);

  useEffect(() => {
    const node = marker.current;
    if (!node || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver((entries) => {
      if (!sent.current && entries.some((entry) => entry.isIntersecting)) {
        sent.current = true;
        trackMockbaEvent(name, detail);
        observer.disconnect();
      }
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [detail, name]);

  return createElement('span', {
    ref: marker,
    'aria-hidden': true,
    style: { display: 'block', height: 1 },
  });
}
