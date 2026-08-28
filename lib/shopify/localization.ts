import 'server-only';

import { headers } from 'next/headers';

import { SHOPIFY_TOKEN, isLive, storefrontEndpoint } from './config';

/**
 * Which country's market a request is priced in.
 *
 * Shopify Markets localises price and currency; the site has to ask for the
 * same market or a visitor is quoted one currency and charged another at
 * checkout. A country Shopify knows but does not sell into falls back to the
 * primary market on its own, so only malformed codes need guarding — and Vercel
 * does send one: `XX` when it cannot place the request.
 */

const DEFAULT_COUNTRY = 'SE';

const COUNTRIES_QUERY = /* GraphQL */ `
  query Countries {
    localization {
      availableCountries {
        isoCode
      }
    }
  }
`;

/** The shop's markets. Changes rarely, so it is held for a day. */
async function availableCountries(): Promise<string[]> {
  if (!isLive()) return [];
  try {
    const res = await fetch(storefrontEndpoint(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': SHOPIFY_TOKEN,
      },
      body: JSON.stringify({ query: COUNTRIES_QUERY }),
      next: { revalidate: 86400, tags: ['localization'] },
    });
    if (!res.ok) return [];
    const json = (await res.json()) as {
      data?: { localization?: { availableCountries: { isoCode: string }[] } };
    };
    return json.data?.localization?.availableCountries.map((c) => c.isoCode) ?? [];
  } catch {
    return [];
  }
}

/**
 * The market to price this request in, from Vercel's geolocation header.
 * Reading a header opts the route into dynamic rendering; the Storefront
 * response is still cached per country, so no request waits on Shopify.
 */
export async function buyerCountry(): Promise<string> {
  const store = await headers();
  const raw = (store.get('x-vercel-ip-country') ?? '').toUpperCase();
  if (!/^[A-Z]{2}$/.test(raw) || raw === 'XX') return DEFAULT_COUNTRY;

  const countries = await availableCountries();
  // An empty list means the lookup failed, not that nothing is sold.
  if (countries.length && !countries.includes(raw)) return DEFAULT_COUNTRY;
  return raw;
}
