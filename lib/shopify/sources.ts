import 'server-only';

import { SERIES_REVALIDATE, SHOPIFY_TOKEN, isLive, storefrontEndpoint } from './config';

/**
 * Every source record the archive holds, read straight from the metaobjects
 * rather than through the products that happen to use them.
 *
 * This is the whole point of the change: a source becomes visible when it is
 * recorded, not when it is sold. One record can be referenced by several
 * objects — the tee and the tote of the same poster — and some are referenced
 * by none yet.
 */

export type SourceRecord = {
  handle: string;
  originalTitle: string;
  artist: string;
  year: string;
  origin: string;
  purpose: string;
  note: string;
  rights: string;
  risk: string;
};

const SOURCES_QUERY = /* GraphQL */ `
  query Sources {
    metaobjects(type: "source", first: 100) {
      nodes {
        handle
        originalTitle: field(key: "original_title") {
          value
        }
        artist: field(key: "artist") {
          value
        }
        year: field(key: "year") {
          value
        }
        origin: field(key: "origin") {
          value
        }
        purpose: field(key: "purpose") {
          value
        }
        note: field(key: "source_note") {
          value
        }
        rights: field(key: "rights_status") {
          value
        }
        risk: field(key: "enforcement_risk") {
          value
        }
      }
    }
  }
`;

type Field = { value: string | null } | null;

type RawSources = {
  metaobjects?: {
    nodes: {
      handle: string;
      originalTitle: Field;
      artist: Field;
      year: Field;
      origin: Field;
      purpose: Field;
      note: Field;
      rights: Field;
      risk: Field;
    }[];
  };
};

const text = (field: Field): string => (field?.value ?? '').trim();

export async function getSources(): Promise<SourceRecord[]> {
  if (!isLive()) return [];

  try {
    const res = await fetch(storefrontEndpoint(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': SHOPIFY_TOKEN,
      },
      body: JSON.stringify({ query: SOURCES_QUERY }),
      next: { revalidate: SERIES_REVALIDATE, tags: ['sources'] },
    });
    if (!res.ok) return [];

    const json = (await res.json()) as { data?: RawSources };

    return (json.data?.metaobjects?.nodes ?? [])
      .map((node) => ({
        handle: node.handle,
        originalTitle: text(node.originalTitle),
        artist: text(node.artist) || 'Unknown',
        year: text(node.year),
        origin: text(node.origin),
        purpose: text(node.purpose),
        note: text(node.note),
        rights: text(node.rights),
        risk: text(node.risk),
      }))
      /* A record with no title is not a record. Nothing is invented to fill it. */
      .filter((source) => source.originalTitle);
  } catch (err) {
    console.warn('[mockba] source register unreachable', err);
    return [];
  }
}
