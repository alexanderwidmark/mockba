import 'server-only';

import { SERIES_REVALIDATE, SHOPIFY_TOKEN, isLive, storefrontEndpoint } from './config';

/**
 * Which series are published, asked of Shopify rather than of the environment.
 *
 * A series is any collection carrying `mockba.series_no`. Creating the
 * collection and setting that field is enough to publish it — no environment
 * change, no deploy — which is the premise the rest of the content model runs
 * on. They are ordered by series number, newest first, so a new drop takes the
 * front page by being numbered higher rather than by being listed first.
 */

const INDEX_QUERY = /* GraphQL */ `
  query SeriesIndex {
    collections(first: 50) {
      nodes {
        handle
        seriesNo: metafield(namespace: "mockba", key: "series_no") {
          value
        }
      }
    }
  }
`;

type RawIndex = {
  collections?: { nodes: { handle: string; seriesNo: { value: string | null } | null }[] };
};

export async function publishedSeriesHandles(): Promise<string[]> {
  if (!isLive()) return [];
  try {
    const res = await fetch(storefrontEndpoint(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': SHOPIFY_TOKEN,
      },
      body: JSON.stringify({ query: INDEX_QUERY }),
      next: { revalidate: SERIES_REVALIDATE, tags: ['series-index'] },
    });
    if (!res.ok) return [];
    const json = (await res.json()) as { data?: RawIndex };

    return (json.data?.collections?.nodes ?? [])
      .filter((c) => c.seriesNo?.value)
      .sort((a, b) =>
        // '010' must sort above '009', so compare numerically rather than as text.
        (b.seriesNo?.value ?? '').localeCompare(a.seriesNo?.value ?? '', undefined, {
          numeric: true,
        }),
      )
      .map((c) => c.handle);
  } catch (err) {
    console.warn('[mockba] series index unreachable', err);
    return [];
  }
}
