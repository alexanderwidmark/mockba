import 'server-only';

import { SERIES_REVALIDATE, SHOPIFY_TOKEN, isLive, storefrontEndpoint } from './config';
import { resolveRights, territoryOf } from '../rights';

/**
 * Whether a variant may be sold into one territory, asked of Shopify rather
 * than of the page.
 *
 * The item record already hides the cart for a restricted work, but that is a
 * convention in the browser and the server action is reachable without it. The
 * rights status is the one rule on this site that must hold even when the
 * request did not come from our own interface.
 *
 * Copyright is territorial, so this asks the same question the page asked: not
 * "is this work restricted" but "is it restricted where this buyer is". The
 * whole source record is fetched and resolved with `resolveRights`, the same
 * function the page uses, so the gate and the published field can never
 * disagree about one item.
 */

const RIGHTS_QUERY = /* GraphQL */ `
  query VariantRights($id: ID!) {
    node(id: $id) {
      ... on ProductVariant {
        product {
          source: metafield(namespace: "mockba", key: "source") {
            reference {
              ... on Metaobject {
                fields {
                  key
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
      source?: {
        reference?: { fields: { key: string; value: string | null }[] } | null;
      } | null;
    } | null;
  } | null;
};

/**
 * Fails closed on a restricted work and open on an unreachable API: a rights
 * lookup that cannot complete must not silently turn the shop off, but a work
 * known to be restricted must never be sellable in a territory that restricts
 * it. `null` means the question could not be answered, not that the answer was
 * "cleared".
 */
export async function variantRightsStatus(
  variantId: string,
  country = '',
): Promise<string | null> {
  if (!isLive()) return null;
  try {
    const res = await fetch(storefrontEndpoint(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': SHOPIFY_TOKEN,
      },
      body: JSON.stringify({ query: RIGHTS_QUERY, variables: { id: variantId } }),
      // The territory is resolved from the response, so one cache entry serves
      // every market: the same source record answers for all of them.
      next: { revalidate: SERIES_REVALIDATE, tags: ['rights'] },
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { data?: RightsResponse };

    const fields = json.data?.node?.product?.source?.reference?.fields;
    if (!fields) return null;

    const read = (key: string) => fields.find((f) => f.key === key)?.value ?? null;
    return resolveRights(read, territoryOf(country)).status || null;
  } catch (err) {
    console.warn('[mockba] rights lookup failed', err);
    return null;
  }
}
