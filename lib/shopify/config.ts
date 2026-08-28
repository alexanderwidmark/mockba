/**
 * MOCKBA — Shopify Storefront configuration.
 *
 * The public Storefront token is read-only and safe in a client bundle, but the
 * query runs server-side anyway (see fetch.ts). Nothing here is exposed with a
 * NEXT_PUBLIC_ prefix: the browser never talks to Shopify directly.
 */

export const SHOPIFY_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN ?? 'ebupet-y0.myshopify.com';
export const SHOPIFY_TOKEN = process.env.SHOPIFY_STOREFRONT_TOKEN ?? '';
export const SHOPIFY_API_VERSION = process.env.SHOPIFY_API_VERSION ?? '2026-07';

/**
 * An explicit series list, newest first. Normally empty: the series are
 * discovered from Shopify by their `mockba.series_no` metafield. Set this only
 * to pin the site to particular collections — to stage a drop before it is
 * meant to appear, or to hold a series back without unpublishing it.
 */
export const SERIES_HANDLES_OVERRIDE = (process.env.SHOPIFY_SERIES_HANDLES ?? '')
  .split(',')
  .map((h) => h.trim())
  .filter(Boolean);

/** The handles the snapshot can serve when Shopify is unreachable. */
export const SNAPSHOT_HANDLES = ['validation-drop-001'];

/** Seconds before a cached series payload is revalidated in the background. */
export const SERIES_REVALIDATE = 300;

/**
 * With a domain and a token the site is sellable: the item record offers a real
 * cart. Without them it renders identically but registers interest instead.
 */
export const isLive = (): boolean => Boolean(SHOPIFY_DOMAIN && SHOPIFY_TOKEN);

export const storefrontEndpoint = (): string =>
  `https://${SHOPIFY_DOMAIN}/api/${SHOPIFY_API_VERSION}/graphql.json`;
