import 'server-only';

import { SERIES_REVALIDATE, SHOPIFY_TOKEN, isLive, storefrontEndpoint } from './config';

/**
 * The specification table for each product category.
 *
 * The rows used to be literals in the item record, which meant a tote bag
 * inherited a boxy relaxed fit and a combed cotton weave. They now live in
 * Shopify as one `spec_template` metaobject per category — 'T-Shirts',
 * 'Tote Bags' — so a medium is described once rather than on every product.
 * A product may still override its own table through `mockba.spec`.
 */

export type SpecRow = { k: string; v: string };

const TEMPLATES_QUERY = /* GraphQL */ `
  query SpecTemplates {
    metaobjects(type: "spec_template", first: 25) {
      nodes {
        category: field(key: "category") {
          value
        }
        spec: field(key: "spec") {
          value
        }
      }
    }
  }
`;

type RawTemplates = {
  metaobjects?: {
    nodes: {
      category: { value: string | null } | null;
      spec: { value: string | null } | null;
    }[];
  };
};

function parseRows(raw: string | null | undefined): SpecRow[] {
  try {
    const parsed = JSON.parse(raw ?? '[]');
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((r) => r && typeof r.k === 'string' && typeof r.v === 'string')
      .map((r) => ({ k: r.k, v: r.v }));
  } catch {
    return [];
  }
}

/** Keyed by category name, lowercased, as Shopify's taxonomy spells it. */
export async function getSpecTemplates(): Promise<Record<string, SpecRow[]>> {
  if (!isLive()) return {};
  try {
    const res = await fetch(storefrontEndpoint(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': SHOPIFY_TOKEN,
      },
      body: JSON.stringify({ query: TEMPLATES_QUERY }),
      next: { revalidate: SERIES_REVALIDATE, tags: ['spec-templates'] },
    });
    if (!res.ok) return {};
    const json = (await res.json()) as { data?: RawTemplates };
    const out: Record<string, SpecRow[]> = {};
    for (const node of json.data?.metaobjects?.nodes ?? []) {
      const category = node.category?.value?.trim();
      const rows = parseRows(node.spec?.value);
      if (category && rows.length) out[category.toLowerCase()] = rows;
    }
    return out;
  } catch (err) {
    console.warn('[mockba] spec templates unreachable', err);
    return {};
  }
}
