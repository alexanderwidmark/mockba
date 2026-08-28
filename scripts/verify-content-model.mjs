#!/usr/bin/env node
/**
 * Check the Shopify content model against the contract in README.md.
 *
 * Runs the site's own query against the store and reports, key by key, what is
 * present and what is missing. A missing metaobject reference or a colour_map
 * that does not cover every Colour option is a silent failure in the browser —
 * the page renders and the field is simply blank — so it is checked here.
 *
 *   node scripts/verify-content-model.mjs
 *
 * Reads SHOPIFY_STOREFRONT_TOKEN from the environment or .env.local.
 */

import { readFileSync } from 'node:fs';

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
const TOKEN = fromEnv('SHOPIFY_STOREFRONT_TOKEN');
const VERSION = fromEnv('SHOPIFY_API_VERSION') || '2026-07';
const HANDLES = (fromEnv('SHOPIFY_SERIES_HANDLES') || 'validation-drop-001')
  .split(',')
  .map((h) => h.trim())
  .filter(Boolean);

if (!TOKEN) {
  console.error('SHOPIFY_STOREFRONT_TOKEN is not set. Put it in .env.local and run again.');
  process.exit(1);
}

/* The query is read from the site's own module so the two can never drift.
   Anchored on the /* GraphQL *\/ marker: the file's doc comment contains
   backticks of its own, so the first backtick in the file is not the query. */
const querySource = readFileSync(new URL('../lib/shopify/query.ts', import.meta.url), 'utf8');
const marker = querySource.indexOf('/* GraphQL */');
if (marker === -1) {
  console.error('Could not locate the query in lib/shopify/query.ts.');
  process.exit(1);
}
const open = querySource.indexOf('`', marker);
const SERIES_QUERY = querySource.slice(open + 1, querySource.lastIndexOf('`'));
if (!SERIES_QUERY.trimStart().startsWith('query Series')) {
  console.error('Extracted text is not the series query:\n' + SERIES_QUERY.slice(0, 120));
  process.exit(1);
}

const PRODUCT_METAFIELDS = [
  'command',
  'contradiction',
  'mechanism',
  'role',
  'sku_base',
  'source',
];

/* Only meaningful on a product whose variants declare a colour option. */
const BLANK_METAFIELDS = ['colour_map', 'garment_color'];

/* Optional: a garment inherits the default specification table and substrate. */
const OPTIONAL_METAFIELDS = ['spec', 'substrate'];

const SOURCE_FIELDS = [
  'original_title',
  'artist',
  'year',
  'origin',
  'purpose',
  'source_note',
  'rights_status',
  'enforcement_risk',
];

const problems = [];
const note = (scope, msg) => problems.push(`${scope}: ${msg}`);
const tick = (ok) => (ok ? '  ok  ' : ' MISS ');

async function run(handle) {
  const res = await fetch(`https://${DOMAIN}/api/${VERSION}/graphql.json`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Shopify-Storefront-Access-Token': TOKEN },
    body: JSON.stringify({ query: SERIES_QUERY, variables: { handle } }),
  });

  const text = await res.text();
  if (!res.ok) {
    console.error(`\nHTTP ${res.status} for "${handle}"\n${text.slice(0, 800)}`);
    note(handle, `request failed with ${res.status}`);
    return;
  }

  let json;
  try {
    json = JSON.parse(text);
  } catch {
    console.error(`\nNon-JSON response:\n${text.slice(0, 400)}`);
    note(handle, 'non-JSON response');
    return;
  }

  if (json.errors?.length) {
    console.log(`\nGraphQL errors for "${handle}":`);
    for (const e of json.errors) console.log(`  ${e.message}`);
    note(handle, 'GraphQL errors');
  }

  const c = json.data?.collection;
  if (!c) {
    console.log(`\nCollection "${handle}" not found, or not published to this sales channel.`);
    note(handle, 'collection not found');
    return;
  }

  console.log(`\n${'='.repeat(72)}`);
  console.log(`SERIES  ${c.title}  (${c.handle})`);
  console.log('='.repeat(72));

  const cmf = (k) => (c.metafields || []).find((m) => m && m.key === k)?.value;
  for (const k of ['series_no', 'status', 'issued']) {
    const v = cmf(k);
    console.log(`[${tick(Boolean(v))}] collection metafield ${k.padEnd(12)} ${v ?? ''}`);
    if (!v) note(c.handle, `collection metafield "${k}" is empty`);
  }

  const products = (c.products?.edges ?? []).map((e) => e.node);
  console.log(`\n${products.length} products in the collection.`);
  if (!products.length) note(c.handle, 'no products');

  for (const [i, p] of products.entries()) {
    console.log(`\n--- ${String(i + 1).padStart(2, '0')}  ${p.title}  (${p.handle})`);
    const scope = p.handle;
    const mf = (k) => (p.metafields || []).find((m) => m && m.key === k);

    for (const k of PRODUCT_METAFIELDS) {
      const m = mf(k);
      const has = Boolean(m && m.value);
      console.log(`  [${tick(has)}] mockba.${k}`);
      if (!has) note(scope, `metafield "${k}" is missing or empty`);
    }

    /* The source metaobject: present, resolved, and complete. */
    const srcRef = mf('source')?.reference;
    if (!srcRef) {
      console.log('  [ MISS ] source metaobject did not resolve');
      note(
        scope,
        'source reference is null — either the metafield is unset or the token lacks unauthenticated_read_metaobjects',
      );
    } else {
      const fields = Object.fromEntries((srcRef.fields ?? []).map((f) => [f.key, f.value]));
      for (const k of SOURCE_FIELDS) {
        const has = Boolean(fields[k]);
        console.log(`    [${tick(has)}] source.${k}`);
        if (!has) note(scope, `source field "${k}" is empty`);
      }
      const rights = fields.rights_status;
      if (rights && !['cleared', 'research required', 'restricted'].includes(rights)) {
        note(scope, `rights_status "${rights}" is not one of the three documented values`);
      }
      const risk = fields.enforcement_risk;
      if (risk && !['low', 'medium', 'high'].includes(risk)) {
        note(scope, `enforcement_risk "${risk}" is not low/medium/high`);
      }
    }

    /* Variant options must be Colour x Size, and colour_map must cover them. */
    const names = (p.options ?? []).map((o) => o.name);
    const colourOpt = (p.options ?? []).find((o) => /colour|color/i.test(o.name));
    const sizeOpt = (p.options ?? []).find((o) => /size/i.test(o.name));
    console.log(`  [${colourOpt ? '  ok  ' : ' none '}] colour option   (options: ${names.join(', ')})`);
    console.log(`  [${tick(Boolean(sizeOpt))}] a size option exists`);
    if (!sizeOpt) note(scope, 'no Size option on the product');
    if (colourOpt && colourOpt.name !== 'Colour') {
      // Cosmetic: the site matches either spelling, and the fulfilment
      // integration may own this field and rewrite it.
      console.log(`  [ note  ] colour option is named "${colourOpt.name}"; the contract says "Colour"`);
    }

    const colourValues = (colourOpt?.optionValues ?? []).map((v) => v.name);
    let map = {};
    try {
      map = JSON.parse(mf('colour_map')?.value ?? '{}') || {};
    } catch {
      note(scope, 'colour_map is not valid JSON');
    }
    for (const k of BLANK_METAFIELDS) {
      const m = mf(k);
      const has = Boolean(m && m.value);
      if (!colourOpt) {
        console.log(`  [ n/a  ] mockba.${k}   (no colour option, so no swatch to draw)`);
        continue;
      }
      console.log(`  [${tick(has)}] mockba.${k}`);
      if (!has && k === 'colour_map') {
        note(scope, 'colour_map is empty although the product declares blanks');
      }
    }

    for (const name of colourValues) {
      const rec = map[name];
      const ok = Boolean(rec?.garment && rec?.ink);
      console.log(`    [${tick(ok)}] colour_map covers "${name}"`);
      if (!ok) {
        note(scope, `colour_map has no garment/ink pair for the blank "${name}" — it will fall back`);
      }
    }


    const img = p.images?.edges?.[0]?.node;
    console.log(`  [${tick(Boolean(img?.url))}] product image 1 (the archive scan)`);
    if (!img?.url) note(scope, 'no product image — the garment plate will print nothing');
    else if (!img.altText) note(scope, 'image 1 has no alt text; it should carry the original title');

    for (const k of OPTIONAL_METAFIELDS) {
      const m = mf(k);
      console.log(`  [${m?.value ? '  ok  ' : ' n/a  '}] mockba.${k}${m?.value ? '' : '   (inherits the garment default)'}`);
    }

    const base = mf('sku_base')?.value;
    console.log(`  [${tick(Boolean(base))}] accession stem${base ? `   ${base}` : ''}`);
    if (!base) {
      note(scope, 'sku_base is empty — the accession falls back to the fulfilment SKU');
    }

    const variants = (p.variants?.edges ?? []).map((e) => e.node);
    const withSku = variants.filter((v) => v.sku).length;
    console.log(`  [${tick(variants.length > 0)}] ${variants.length} variants, ${withSku} with a SKU`);
    if (!variants.length) note(scope, 'no variants');
    if (variants.length && withSku < variants.length) {
      note(scope, `${variants.length - withSku} variants have no fulfilment SKU`);
    }
    if (variants.length && variants.every((v) => v.quantityAvailable === null)) {
      note(scope, 'quantityAvailable is null on every variant — inventory scope missing, or inventory is untracked');
    }
  }
}

for (const h of HANDLES) await run(h);

console.log(`\n${'='.repeat(72)}`);
if (!problems.length) {
  console.log('The content model matches the contract. Nothing to fix.');
} else {
  console.log(`${problems.length} thing(s) to fix:\n`);
  for (const p of problems) console.log(`  - ${p}`);
  process.exitCode = 1;
}
