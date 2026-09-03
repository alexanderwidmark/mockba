import { describe, expect, it } from 'vitest';

import {
  applyAnalyticsControl,
  buildEventData,
  classifyTrafficSource,
  resolveTrafficSource,
  sendAnalyticsEvent,
} from './analytics';

function memoryStorage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => void values.set(key, value),
    removeItem: (key: string) => void values.delete(key),
  };
}

describe('classifyTrafficSource', () => {
  it('keeps the Instagram post id in the source bucket', () => {
    expect(
      classifyTrafficSource(
        'https://mockba.org/?utm_source=ig&utm_medium=bio&utm_content=A01',
        '',
        'https://mockba.org',
      ),
    ).toBe('instagram:A01');
  });

  it('does not include invalid Instagram content in the source bucket', () => {
    expect(
      classifyTrafficSource(
        'https://mockba.org/?utm_source=instagram&utm_content=%3Cscript%3Ealert(1)%3C%2Fscript%3E',
        '',
        'https://mockba.org',
      ),
    ).toBe('instagram');
  });
});

describe('resolveTrafficSource', () => {
  it('persists the landing source for later internal pages', () => {
    const storage = memoryStorage();
    expect(
      resolveTrafficSource(
        'https://mockba.org/?utm_source=ig&utm_medium=bio&utm_content=A01',
        '',
        'https://mockba.org',
        storage,
      ),
    ).toBe('instagram:A01');

    expect(
      resolveTrafficSource(
        'https://mockba.org/series/validation-drop-001/item',
        'https://mockba.org/',
        'https://mockba.org',
        storage,
      ),
    ).toBe('instagram:A01');
  });
});

describe('applyAnalyticsControl', () => {
  it('disables analytics on this device and removes the control parameter', () => {
    const storage = memoryStorage();
    const result = applyAnalyticsControl(
      'https://mockba.org/?mockba_analytics=off&utm_source=founder',
      storage,
    );

    expect(result.disabled).toBe(true);
    expect(storage.getItem('va-disable')).toBe('1');
    expect(result.cleanHref).toBe('https://mockba.org/?utm_source=founder');
  });

  it('re-enables analytics on this device', () => {
    const storage = memoryStorage();
    storage.setItem('va-disable', '1');

    const result = applyAnalyticsControl('https://mockba.org/?mockba_analytics=on', storage);

    expect(result.disabled).toBe(false);
    expect(storage.getItem('va-disable')).toBeNull();
  });
});

describe('buildEventData', () => {
  it('uses at most two queryable properties', () => {
    const data = buildEventData('instagram:A01', {
      selection: 'MAC-12|Black|M',
    });

    expect(data).toEqual({ source: 'instagram:A01', selection: 'MAC-12|Black|M' });
    expect(Object.keys(data)).toHaveLength(2);
  });
});

describe('sendAnalyticsEvent', () => {
  it('sends nothing when analytics is disabled on the device', () => {
    const local = memoryStorage();
    const session = memoryStorage();
    local.setItem('va-disable', '1');
    const calls: unknown[] = [];

    const sent = sendAnalyticsEvent(
      'item_record_view',
      { item: 'MAC-12' },
      {
        href: 'https://mockba.org/series/001/history-has-been-updated',
        referrer: '',
        origin: 'https://mockba.org',
        localStorage: local,
        sessionStorage: session,
      },
      (...args: unknown[]) => void calls.push(args),
    );

    expect(sent).toBe(false);
    expect(calls).toEqual([]);
  });

  it('sends an attributed event when analytics is enabled', () => {
    const local = memoryStorage();
    const session = memoryStorage();
    const calls: unknown[] = [];

    const sent = sendAnalyticsEvent(
      'item_record_view',
      { item: 'MAC-12' },
      {
        href: 'https://mockba.org/?utm_source=founder',
        referrer: '',
        origin: 'https://mockba.org',
        localStorage: local,
        sessionStorage: session,
      },
      (...args: unknown[]) => void calls.push(args),
    );

    expect(sent).toBe(true);
    expect(calls).toEqual([
      ['item_record_view', { source: 'founder', item: 'MAC-12' }],
    ]);
  });
});
