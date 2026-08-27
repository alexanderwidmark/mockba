import 'server-only';

import {
  SERIES_HANDLES,
  SERIES_REVALIDATE,
  SHOPIFY_TOKEN,
  isLive,
  storefrontEndpoint,
} from './config';
import { normalizeSeries } from './normalize';
import { SERIES_QUERY } from './query';
import { snapshotCollection } from './snapshot';
import type { RawCollection, Series } from './types';

/**
 * One Storefront query per collection handle, cached and revalidated in the
 * background. There is no loading state anywhere in this design: a page paints
 * from cached data — or from the snapshot — and the network is never on the
 * critical path.
 */
async function fetchCollection(handle: string): Promise<RawCollection | null> {
  if (!isLive()) return null;

  try {
    const res = await fetch(storefrontEndpoint(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': SHOPIFY_TOKEN,
      },
      body: JSON.stringify({ query: SERIES_QUERY, variables: { handle } }),
      next: { revalidate: SERIES_REVALIDATE, tags: [`series:${handle}`] },
    });

    if (!res.ok) {
      console.warn(`[mockba] Storefront ${res.status} for "${handle}", using snapshot.`);
      return null;
    }

    const json = (await res.json()) as {
      data?: { collection?: RawCollection | null };
      errors?: { message: string }[];
    };

    if (json.errors?.length) {
      console.warn(`[mockba] Storefront errors for "${handle}":`, json.errors.map((e) => e.message).join('; '));
    }
    return json.data?.collection ?? null;
  } catch (err) {
    console.warn(`[mockba] Storefront unreachable for "${handle}", using snapshot.`, err);
    return null;
  }
}

/** One series, live if possible and from the snapshot otherwise. */
export async function getSeries(handle: string): Promise<Series | null> {
  const collection = (await fetchCollection(handle)) ?? snapshotCollection(handle);
  return collection ? normalizeSeries(collection) : null;
}

/**
 * Every configured series, newest first. The fallback is per series, so one
 * dead handle costs that series' freshness and nothing else.
 */
export async function getAllSeries(): Promise<Series[]> {
  const all = await Promise.all(SERIES_HANDLES.map((h) => getSeries(h)));
  return all.filter((s): s is Series => s !== null && s.products.length > 0);
}

/** The active series for a route, plus the full list for the series index. */
export async function getSeriesContext(handle?: string): Promise<{
  series: Series | null;
  all: Series[];
}> {
  const all = await getAllSeries();
  const series = handle ? (all.find((s) => s.handle === handle) ?? null) : (all[0] ?? null);
  return { series, all };
}
