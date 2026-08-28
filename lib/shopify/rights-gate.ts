import 'server-only';

import { SERIES_REVALIDATE, SHOPIFY_TOKEN, isLive, storefrontEndpoint } from './config';

/**
 * Whether a variant may be sold, asked of Shopify rather than of the page.
 *
 * The item record already hides the cart for a restricted work, but that is a
 * convention in the browser and the server action is reachable without it. The
 * rights status is the one rule on this site that must hold even when the
 * request did not come from our own interface.
 */

const RIGHTS_QUERY = /* GraphQL */ `
  query VariantRights($id: ID!) {
    node(id: $id) {
      ... on ProductVariant {
        product {
          source: metafield(namespace: "mockba", key: "source") {
            reference {
              ... on Metaobject {
                rights: field(key: "rights_status") {
                  value
                }
              }
            }
          }
        }
      }
    }
  }
`;

type RightsResponse = {
  node?: {
    product?: {
      source?: { reference?: { rights?: { value: string | null } | null } | null } | null;
    } | null;
  } | null;
};

/**
 * Fails closed on a restricted work and open on an unreachable API: a rights
 * lookup that cannot complete must not silently turn the shop off, but a work
 * known to be restricted must never be sellable.
 */
export async function variantRightsStatus(variantId: string): Promise<string | null> {
  if (!isLive()) return null;
  try {
    const res = await fetch(storefrontEndpoint(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': SHOPIFY_TOKEN,
      },
      body: JSON.stringify({ query: RIGHTS_QUERY, variables: { id: variantId } }),
      next: { revalidate: SERIES_REVALIDATE, tags: ['rights'] },
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { data?: RightsResponse };
    return json.data?.node?.product?.source?.reference?.rights?.value ?? null;
  } catch (err) {
    console.warn('[mockba] rights lookup failed', err);
    return null;
  }
}
