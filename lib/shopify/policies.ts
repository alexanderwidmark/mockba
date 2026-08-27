import 'server-only';

import { SERIES_REVALIDATE, SHOPIFY_TOKEN, isLive, storefrontEndpoint } from './config';

/**
 * The shop's written policies, as Shopify holds them.
 *
 * The text is authored once, in the Shopify admin, and read from there. It is
 * also what the hosted checkout links to, so the page and the checkout can
 * never drift into saying different things — which for a return policy is the
 * whole point.
 */

export type Policy = {
  handle: string;
  title: string;
  /** Policy text as HTML, authored in the Shopify admin. */
  body: string;
};

/** Order is the order they appear in the footer. */
const POLICY_FIELDS = [
  'refundPolicy',
  'shippingPolicy',
  'termsOfService',
  'termsOfSale',
  'privacyPolicy',
  'legalNotice',
  'contactInformation',
] as const;

const POLICIES_QUERY = /* GraphQL */ `
  query Policies {
    shop {
      ${POLICY_FIELDS.map(
        (f) => `${f} { handle title body }`,
      ).join('\n      ')}
    }
  }
`;

type RawShop = Record<(typeof POLICY_FIELDS)[number], Policy | null>;

/** Every policy the merchant has actually written. Unset ones are absent. */
export async function getPolicies(): Promise<Policy[]> {
  if (!isLive()) return [];
  try {
    const res = await fetch(storefrontEndpoint(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': SHOPIFY_TOKEN,
      },
      body: JSON.stringify({ query: POLICIES_QUERY }),
      next: { revalidate: SERIES_REVALIDATE, tags: ['policies'] },
    });
    if (!res.ok) return [];
    const json = (await res.json()) as { data?: { shop?: RawShop } };
    const shop = json.data?.shop;
    if (!shop) return [];
    return POLICY_FIELDS.map((f) => shop[f]).filter((p): p is Policy => Boolean(p?.handle));
  } catch (err) {
    console.warn('[mockba] policies unreachable', err);
    return [];
  }
}

export async function getPolicy(handle: string): Promise<Policy | null> {
  return (await getPolicies()).find((p) => p.handle === handle) ?? null;
}
