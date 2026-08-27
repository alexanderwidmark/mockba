#!/usr/bin/env node
/**
 * Seed the store with the editorial content from the design specification.
 *
 * The text is read straight out of lib/shopify/snapshot.ts, so what lands in
 * Shopify is exactly what the specification carries — no retyping, no drift.
 *
 * Two things this deliberately does NOT do:
 *
 *  - It does not assert a rights assessment. `rights_status` and
 *    `enforcement_risk` are required by the metaobject definition, so a value
 *    must be written; every item gets the same placeholder pair, "research
 *    required" / "medium", which reads as an outstanding assessment rather than
 *    a finding. The specification's own per-item values are NOT copied: varied
 *    values would look researched. Review these by hand.
 *
 *  - It does not write colour_map for a product whose variants declare no
 *    colour option. Inventing a blank the store never declared is the same
 *    error as inventing a rights status.
 *
 *   node scripts/seed-content.mjs --dry-run
 *   node scripts/seed-content.mjs
 *
 * Safe to run again: values are overwritten with the same content.
 */

import { readFileSync } from 'node:fs';

const DRY = process.argv.includes('--dry-run');
const NAMESPACE = 'mockba';

const envFile = (() => {
  try {
    return readFileSync(new URL('../.env.local', import.meta.url), 'utf8');
  } catch {
    return '';
  }
})();

const fromEnv = (key) => {
  if (process.env[key]) return process.env[key];
  const line = envFile.split('\n').find((l) => l.trim().startsWith(`${key}=`));
  return line ? line.slice(line.indexOf('=') + 1).trim().replace(/^["']|["']$/g, '') : '';
};

const DOMAIN = fromEnv('SHOPIFY_STORE_DOMAIN') || 'ebupet-y0.myshopify.com';
const VERSION = fromEnv('SHOPIFY_API_VERSION') || '2026-07';

/* ── The specification's content, read from the snapshot ───────────────────*/

const snapshotSource = readFileSync(new URL('../lib/shopify/snapshot.ts', import.meta.url), 'utf8');
const specStart = snapshotSource.indexOf('const SPEC: SpecEntry[] = [');
const specOpen = snapshotSource.indexOf('[', specStart);
const specEnd = snapshotSource.indexOf('\n];', specOpen);
if (specStart === -1 || specEnd === -1) {
  console.error('Could not read SPEC out of lib/shopify/snapshot.ts.');
  process.exit(1);
}
const SPEC = eval(snapshotSource.slice(specOpen, specEnd + 2));
const ITEMS = Object.fromEntries(SPEC[0].items.map((i) => [i.handle, i]));

/**
 * The store's handles against the specification's. The third product is titled
 * after its archive source rather than its command, which is why the two names
 * do not look alike.
 */
const MAPPING = [
  { store: 'drain-the-swamp-1', spec: 'drain-the-swamp', handle: 'drain-the-swamp' },
  { store: 'public-servant-1', spec: 'public-servant', handle: 'public-servant' },
  { store: 'every-blow-1', spec: 'productivity-is-patriotism', handle: 'productivity-is-patriotism' },
  { store: 'freedom-requires-loyalty-1', spec: 'freedom-requires-loyalty', handle: 'freedom-requires-loyalty' },
];

/** Not read from the specification. See the note at the top of this file. */
const RIGHTS_PLACEHOLDER = { rights_status: 'research required', enforcement_risk: 'medium' };

/* ── Admin API ─────────────────────────────────────────────────────────────*/

let TOKEN = '';

async function adminToken() {
  const clientId = fromEnv('SHOPIFY_CLIENT_ID');
  const clientSecret = fromEnv('SHOPIFY_CLIENT_SECRET');
  if (!clientId || !clientSecret) {
    console.error('Set SHOPIFY_CLIENT_ID and SHOPIFY_CLIENT_SECRET in .env.local.');
    process.exit(1);
  }
  const res = await fetch(`https://${DOMAIN}/admin/oauth/access_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ grant_type: 'client_credentials', client_id: clientId, client_secret: clientSecret }),
  });
  const json = await res.json();
  if (!json.access_token) throw new Error(`Token exchange failed: ${JSON.stringify(json)}`);
  return json.access_token;
}

async function gql(query, variables) {
  const res = await fetch(`https://${DOMAIN}/admin/api/${VERSION}/graphql.json`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': TOKEN },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (json.errors?.length) throw new Error(json.errors.map((e) => e.message).join('; '));
  return json.data;
}

const PRODUCTS = `
query Products {
  products(first: 30) {
    nodes {
      id
      handle
      title
      options {
        name
        optionValues {
          name
        }
      }
    }
  }
}`;

const RENAME = `
mutation RenameProduct($product: ProductUpdateInput!) {
  productUpdate(product: $product) {
    product {
      id
      handle
    }
    userErrors {
      field
      message
    }
  }
}`;

const UPSERT_SOURCE = `
mutation UpsertSource($handle: MetaobjectHandleInput!, $metaobject: MetaobjectUpsertInput!) {
  metaobjectUpsert(handle: $handle, metaobject: $metaobject) {
    metaobject {
      id
      handle
    }
    userErrors {
      field
      message
      code
    }
  }
}`;

const SET_METAFIELDS = `
mutation SetMetafields($metafields: [MetafieldsSetInput!]!) {
  metafieldsSet(metafields: $metafields) {
    metafields {
      key
    }
    userErrors {
      field
      message
      code
    }
  }
}`;

const problems = [];
const say = (state, what, detail = '') =>
  console.log(`  [${state.padEnd(7)}] ${what}${detail ? `  — ${detail}` : ''}`);

/* ── Run ───────────────────────────────────────────────────────────────────*/

if (DRY) {
  console.log(`Would write to ${DOMAIN}:\n`);
  for (const m of MAPPING) {
    const it = ITEMS[m.spec];
    console.log(`${m.store}  ->  handle "${m.handle}"`);
    console.log(`  command        ${it.command}`);
    console.log(`  contradiction  ${it.contradiction}`);
    console.log(`  mechanism      ${it.mechanism}`);
    console.log(`  print_aspect   ${it.printAspect}`);
    console.log(`  source         ${it.source.original_title}`);
    console.log(`                 ${it.source.artist}, ${it.source.year}, ${it.source.origin}`);
    console.log(`                 source_note ${it.source.source_note.length} characters`);
    console.log(`                 rights ${RIGHTS_PLACEHOLDER.rights_status} / ${RIGHTS_PLACEHOLDER.enforcement_risk}  (placeholder)`);
    console.log('');
  }
  process.exit(0);
}

TOKEN = await adminToken();

/* Fail early and precisely rather than half way through. */
const scopeRes = await fetch(`https://${DOMAIN}/admin/oauth/access_scopes.json`, {
  headers: { 'X-Shopify-Access-Token': TOKEN },
});
const scopes = ((await scopeRes.json()).access_scopes || []).map((s) => s.handle);
const missing = ['write_products', 'write_metaobjects', 'read_metaobjects'].filter(
  (s) => !scopes.includes(s),
);

console.log(`\nStore ${DOMAIN}, API ${VERSION}\n`);

const products = Object.fromEntries(
  (await gql(PRODUCTS)).products.nodes.map((p) => [p.handle, p]),
);

console.log('Handles');
for (const m of MAPPING) {
  const p = products[m.store] ?? products[m.handle];
  if (!p) {
    say('MISSING', m.store, 'no such product');
    problems.push(`${m.store}: not found`);
    continue;
  }
  if (p.handle === m.handle) {
    say('ok', `${m.handle}`);
    continue;
  }
  const out = await gql(RENAME, { product: { id: p.id, handle: m.handle } });
  const errs = out.productUpdate.userErrors;
  if (errs?.length) {
    say('FAILED', `${p.handle} -> ${m.handle}`, errs.map((e) => e.message).join('; '));
    problems.push(`${p.handle}: ${errs.map((e) => e.message).join('; ')}`);
  } else {
    say('renamed', `${p.handle} -> ${out.productUpdate.product.handle}`);
    products[m.handle] = { ...p, handle: m.handle };
  }
}

if (missing.length) {
  console.log(`\nStopping before the content: the app is missing ${missing.join(', ')}.`);
  console.log('Add them to the app, release, then run this again. Handles above are done.');
  process.exit(1);
}

console.log('\nSource records');
const sourceIds = {};
for (const m of MAPPING) {
  const it = ITEMS[m.spec];
  const fields = [
    { key: 'original_title', value: it.source.original_title },
    { key: 'artist', value: it.source.artist },
    { key: 'year', value: it.source.year },
    { key: 'origin', value: it.source.origin },
    { key: 'purpose', value: it.source.purpose },
    { key: 'source_note', value: it.source.source_note },
    { key: 'rights_status', value: RIGHTS_PLACEHOLDER.rights_status },
    { key: 'enforcement_risk', value: RIGHTS_PLACEHOLDER.enforcement_risk },
  ];
  const out = await gql(UPSERT_SOURCE, {
    handle: { type: 'source', handle: m.handle },
    metaobject: { fields },
  });
  const payload = out.metaobjectUpsert;
  if (payload.userErrors?.length) {
    say('FAILED', m.handle, payload.userErrors.map((e) => e.message).join('; '));
    problems.push(`source ${m.handle}: ${payload.userErrors.map((e) => e.message).join('; ')}`);
    continue;
  }
  sourceIds[m.handle] = payload.metaobject.id;
  say('written', `source "${m.handle}"`, it.source.original_title);
}

console.log('\nProduct metafields');
for (const m of MAPPING) {
  const p = products[m.handle];
  const it = ITEMS[m.spec];
  if (!p) continue;

  const metafields = [
    { key: 'command', type: 'single_line_text_field', value: it.command },
    { key: 'contradiction', type: 'single_line_text_field', value: it.contradiction },
    { key: 'mechanism', type: 'single_line_text_field', value: it.mechanism },
    { key: 'role', type: 'single_line_text_field', value: 'hero graphic' },
    { key: 'print_aspect', type: 'single_line_text_field', value: it.printAspect },
  ];

  /* Only where the store itself declares blanks. */
  const colourOption = (p.options || []).find((o) => /colour|color/i.test(o.name));
  const declared = (colourOption?.optionValues ?? []).map((v) => v.name);
  if (declared.length) {
    const map = {};
    for (const name of declared) {
      const spec = it.colours.find((c) => c.name.toLowerCase() === name.toLowerCase());
      map[name] = spec
        ? { garment: spec.garment, ink: spec.ink }
        : { garment: '#E8E3D6', ink: '#171512' };
    }
    metafields.push({ key: 'colour_map', type: 'json', value: JSON.stringify(map) });
  }

  if (sourceIds[m.handle]) {
    metafields.push({
      key: 'source',
      type: 'metaobject_reference',
      value: sourceIds[m.handle],
    });
  }

  const out = await gql(SET_METAFIELDS, {
    metafields: metafields.map((f) => ({ ...f, namespace: NAMESPACE, ownerId: p.id })),
  });
  const errs = out.metafieldsSet.userErrors;
  if (errs?.length) {
    say('FAILED', m.handle, errs.map((e) => `${e.field}: ${e.message}`).join('; '));
    problems.push(`metafields ${m.handle}: ${errs.map((e) => e.message).join('; ')}`);
  } else {
    say('written', m.handle, `${metafields.length} fields${declared.length ? '' : ' (no colour option, colour_map skipped)'}`);
  }
}

console.log(`\n${'='.repeat(72)}`);
if (problems.length) {
  console.log(`${problems.length} problem(s):`);
  for (const p of problems) console.log(`  - ${p}`);
  process.exitCode = 1;
} else {
  console.log('Content written.\n');
  console.log('Review by hand before launch:');
  console.log('  - rights_status and enforcement_risk are placeholders on all four items,');
  console.log('    written as "research required" / "medium". They are not an assessment.');
  console.log('  - the collection metafields series_no, status and issued are still empty.');
}
