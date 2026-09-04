export type TrafficSource =
  | `instagram${string}`
  | 'founder'
  | 'search'
  | 'referral'
  | 'direct';

const TRAFFIC_SOURCE_KEY = 'mockba:traffic-source';

const isTrafficSource = (value: string | null): value is TrafficSource =>
  value === 'founder' ||
  value === 'search' ||
  value === 'referral' ||
  value === 'direct' ||
  value === 'instagram' ||
  Boolean(value && /^instagram:[AP]\d{2}$/.test(value));

type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

export type MockbaEventName =
  | 'catalogue_view'
  | 'item_record_view'
  | 'source_note_read'
  | 'variant_select'
  | 'add_to_cart'
  | 'checkout_start'
  | 'register_interest'
  | 'policy_view'
  | 'contact_submit';

export type EventDetail =
  | { item: string }
  | { selection: string }
  | { policy: string };

type AnalyticsEnvironment = {
  href: string;
  referrer: string;
  origin: string;
  localStorage: StorageLike;
  sessionStorage: StorageLike;
};

type AnalyticsSender = (name: string, data: ReturnType<typeof buildEventData>) => void;

const SEARCH_HOSTS = [
  'google.',
  'bing.com',
  'duckduckgo.com',
  'search.brave.com',
  'ecosia.org',
  'search.yahoo.',
  'yandex.',
];

export function classifyTrafficSource(href: string, referrer: string, origin: string): TrafficSource {
  const url = new URL(href);
  const utmSource = url.searchParams.get('utm_source')?.trim().toLowerCase();
  const content = url.searchParams.get('utm_content')?.trim();

  if (utmSource === 'ig' || utmSource === 'instagram') {
    return content && /^[AP]\d{2}$/.test(content) ? `instagram:${content}` : 'instagram';
  }
  if (utmSource === 'founder') return 'founder';

  if (!referrer) return 'direct';
  const referrerUrl = new URL(referrer);
  if (referrerUrl.origin === origin) return 'direct';
  if (SEARCH_HOSTS.some((host) => referrerUrl.hostname.includes(host))) return 'search';
  return 'referral';
}

export function resolveTrafficSource(
  href: string,
  referrer: string,
  origin: string,
  storage: StorageLike,
): TrafficSource {
  const hasExplicitSource = new URL(href).searchParams.has('utm_source');
  const stored = storage.getItem(TRAFFIC_SOURCE_KEY);
  if (!hasExplicitSource && isTrafficSource(stored)) return stored;

  const source = classifyTrafficSource(href, referrer, origin);
  storage.setItem(TRAFFIC_SOURCE_KEY, source);
  return source;
}

export function applyAnalyticsControl(href: string, storage: StorageLike) {
  const url = new URL(href);
  const control = url.searchParams.get('mockba_analytics');
  if (control) url.searchParams.delete('mockba_analytics');

  try {
    if (control === 'off') storage.setItem('va-disable', '1');
    if (control === 'on') storage.removeItem('va-disable');

    return {
      disabled: Boolean(storage.getItem('va-disable')),
      cleanHref: url.toString(),
    };
  } catch {
    return { disabled: true, cleanHref: url.toString() };
  }
}

export function buildEventData(source: TrafficSource, detail?: EventDetail) {
  return detail ? { source, ...detail } : { source };
}

export function sendAnalyticsEvent(
  name: string,
  detail: EventDetail | undefined,
  environment: AnalyticsEnvironment,
  send: AnalyticsSender,
) {
  try {
    if (environment.localStorage.getItem('va-disable')) return false;
    const source = resolveTrafficSource(
      environment.href,
      environment.referrer,
      environment.origin,
      environment.sessionStorage,
    );
    send(name, buildEventData(source, detail));
    return true;
  } catch {
    return false;
  }
}
