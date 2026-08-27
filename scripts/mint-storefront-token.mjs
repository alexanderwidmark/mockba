#!/usr/bin/env node
/**
 * Mint a Storefront API access token from the app's client credentials.
 *
 * Apps created in the Dev Dashboard expose no static Storefront token in the
 * admin. They do expose a client id and secret, which exchange for a 24-hour
 * Admin API token — and one Admin call turns that into a Storefront token that
 * does NOT expire. That is the token the site runs on.
 *
 * The site cannot run on the Admin token itself: the Cart API exists only in
 * the Storefront API, so checkout would be impossible.
 *
 *   SHOPIFY_CLIENT_ID=... SHOPIFY_CLIENT_SECRET=... node scripts/mint-storefront-token.mjs
 *
 * Reads .env.local when the variables are not already in the environment.
 * Prints the token; it is never written to disk by this script.
 */

import { readFileSync } from 'node:fs';

const ADMIN_API_VERSION = process.env.SHOPIFY_API_VERSION ?? '2026-07';
const DOMAIN = process.env.SHOPIFY_STORE_DOMAIN ?? 'ebupet-y0.myshopify.com';

function fromEnvFile(key) {
  try {
    const line = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
      .split('\n')
      .find((l) => l.trim().startsWith(`${key}=`));
    if (!line) return '';
    return line.slice(line.indexOf('=') + 1).trim().replace(/^["']|["']$/g, '');
  } catch {
    return '';
  }
}

const clientId = process.env.SHOPIFY_CLIENT_ID || fromEnvFile('SHOPIFY_CLIENT_ID');
const clientSecret = process.env.SHOPIFY_CLIENT_SECRET || fromEnvFile('SHOPIFY_CLIENT_SECRET');

if (!clientId || !clientSecret) {
  console.error(
    'Set SHOPIFY_CLIENT_ID and SHOPIFY_CLIENT_SECRET in the environment or in .env.local.',
  );
  process.exit(1);
}

/** Step 1 — client credentials to a 24-hour Admin API token. */
async function adminToken() {
  const res = await fetch(`https://${DOMAIN}/admin/oauth/access_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });
  const body = await res.text();
  if (!res.ok) throw new Error(`Token exchange failed (${res.status}): ${body}`);
  const json = JSON.parse(body);
  if (!json.access_token) throw new Error(`No access_token in response: ${body}`);
  return json.access_token;
}

/**
 * Step 2 — one Admin mutation for a Storefront token. Its scopes are inherited
 * from the app's configured unauthenticated_* access scopes, so the printed
 * scope list is the real check on whether the app is set up correctly.
 */
const MUTATION = `
mutation CreateStorefrontAccessToken($input: StorefrontAccessTokenInput!) {
  storefrontAccessTokenCreate(input: $input) {
    storefrontAccessToken {
      id
      title
      accessToken
      accessScopes {
        handle
      }
    }
    userErrors {
      field
      message
    }
  }
}`;

async function storefrontToken(admin) {
  const res = await fetch(`https://${DOMAIN}/admin/api/${ADMIN_API_VERSION}/graphql.json`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': admin },
    body: JSON.stringify({
      query: MUTATION,
      variables: { input: { title: 'MOCKBA storefront' } },
    }),
  });
  const json = await res.json();
  if (json.errors?.length) {
    throw new Error(json.errors.map((e) => e.message).join('; '));
  }
  const payload = json.data?.storefrontAccessTokenCreate;
  if (payload?.userErrors?.length) {
    throw new Error(payload.userErrors.map((e) => `${e.field}: ${e.message}`).join('; '));
  }
  if (!payload?.storefrontAccessToken) throw new Error('No token returned.');
  return payload.storefrontAccessToken;
}

const REQUIRED = [
  'unauthenticated_read_product_listings',
  'unauthenticated_read_product_inventory',
  'unauthenticated_read_metaobjects',
];

const token = await storefrontToken(await adminToken());
const granted = token.accessScopes.map((s) => s.handle);

console.log(`\nSHOPIFY_STOREFRONT_TOKEN=${token.accessToken}\n`);
console.log('Scopes granted:');
for (const s of granted) console.log(`  ${s}`);

const missing = REQUIRED.filter((s) => !granted.includes(s));
if (missing.length) {
  console.log('\nMissing, and the site needs them:');
  for (const s of missing) console.log(`  ${s}`);
  console.log(
    '\nAdd them to the app\'s access scopes, reinstall it on the store, and run this again.',
  );
  console.log(
    'Without unauthenticated_read_metaobjects the source records, rights fields and',
  );
  console.log('artist credits all come back empty while the rest of the page still renders.');
}
if (!granted.some((s) => s.includes('checkout') || s.includes('cart'))) {
  console.log('\nNo checkout scope: the cart will not open. Add unauthenticated_write_checkouts.');
}
