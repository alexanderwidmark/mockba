#!/usr/bin/env node
/**
 * Create the Shopify content model from the contract in README.md.
 *
 * Definitions only — no values. Once this has run, every field exists in the
 * admin with the exact namespace, key and type the site reads, and the content
 * is filled in by hand in Shopify.
 *
 * The definitions are merchant-owned (namespace `mockba`, not the app-reserved
 * namespace) because the merchant edits the values in the admin and a separate
 * front end reads them. Each one is exposed to the Storefront API explicitly:
 * a definition that exists but is not exposed returns null through the
 * Storefront API, which is indistinguishable from a field nobody filled in.
 *
 *   SHOPIFY_CLIENT_ID=... SHOPIFY_CLIENT_SECRET=... node scripts/create-content-model.mjs
 *
 * Safe to run again: anything that already exists is reported and skipped.
 * Pass --dry-run to print what would be created without touching the store.
 */

import { readFileSync } from 'node:fs';

const DRY = process.argv.includes('--dry-run');

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
const NAMESPACE = 'mockba';

const choices = (values) => [{ name: 'choices', value: JSON.stringify(values) }];

/* ── The contract ──────────────────────────────────────────────────────────
 * Mirrors the tables in README.md. Key names are what lib/shopify/query.ts
 * asks for; they must match exactly or the field reads back empty.
 */

const SPEC_TEMPLATE_FIELDS = [
  {
    key: 'category',
    name: 'Shopify category',
    type: 'single_line_text_field',
    required: true,
    description: "The product category this table applies to, exactly as Shopify names it: 'T-Shirts', 'Tote Bags'.",
  },
  {
    key: 'spec',
    name: 'Specification table',
    type: 'json',
    required: true,
    description: 'Ordered rows: [{"k":"garment","v":"Heavyweight 220g"}]',
  },
];

const SOURCE_FIELDS = [
  { key: 'original_title', name: 'Original title', type: 'single_line_text_field', required: true },
  { key: 'artist', name: 'Artist', type: 'single_line_text_field' },
  { key: 'year', name: 'Year', type: 'single_line_text_field' },
  { key: 'origin', name: 'Origin', type: 'single_line_text_field' },
  { key: 'purpose', name: 'Purpose', type: 'single_line_text_field' },
  { key: 'source_note', name: 'Source note', type: 'multi_line_text_field' },
  {
    key: 'rights_status',
    name: 'Rights status',
    type: 'single_line_text_field',
    required: true,
    validations: choices(['cleared', 'research required', 'restricted']),
  },
  {
    key: 'enforcement_risk',
    name: 'Enforcement risk',
    type: 'single_line_text_field',
    required: true,
    validations: choices(['low', 'medium', 'high']),
  },
];

const COLLECTION_FIELDS = [
  { key: 'series_no', name: 'Series number', type: 'single_line_text_field', description: "The series number, e.g. '001'." },
  {
    key: 'status',
    name: 'Status',
    type: 'single_line_text_field',
    description: 'Shown in the masthead and the document register.',
    validations: choices(['release candidate', 'issued', 'closed']),
  },
  { key: 'issued', name: 'Issued', type: 'single_line_text_field', description: "Revision, e.g. '2026.01'." },
];

const PRODUCT_FIELDS = [
  { key: 'command', name: 'Command', type: 'single_line_text_field', description: 'Layer 1 — the command. This is the display title.' },
  { key: 'contradiction', name: 'Contradiction', type: 'single_line_text_field', description: 'Layer 2 — the contradiction.' },
  { key: 'mechanism', name: 'Mechanism', type: 'single_line_text_field', description: 'One-line mechanism shown on the catalogue card.' },
  {
    key: 'role',
    name: 'Role',
    type: 'single_line_text_field',
    validations: choices(['hero graphic', 'editorial']),
  },
  {
    key: 'colour_map',
    name: 'Colour map',
    type: 'json',
    description: 'Per-blank garment and ink hex: {"Black":{"garment":"#1A1A18","ink":"#F1EDE3"}}. The garment hex draws the swatch in the blank selector.',
  },
  { key: 'garment_color', name: 'Garment colour', type: 'single_line_text_field', description: 'Hex fallback when colour_map is absent. Draws the swatch in the blank selector.' },
  {
    key: 'sku_base',
    name: 'Accession stem',
    type: 'single_line_text_field',
    description: "The item's own identifier, e.g. 'MAC-4'. The site composes the accession number from this plus the blank and the size. The variant SKU belongs to the fulfilment integration and is never shown.",
  },
  {
    key: 'spec',
    name: 'Specification',
    type: 'json',
    description: 'Overrides the specification template for this product only. Ordered rows: [{"k":"material","v":"12 oz cotton canvas"}]. Leave empty to inherit the template for the product\'s category.',
  },
  {
    key: 'substrate',
    name: 'Substrate',
    type: 'single_line_text_field',
    description: "The material word in the plate label, e.g. 'cotton' or 'canvas'. Defaults to cotton.",
  },
  /* `source` is appended once the metaobject definition id is known. */
];

/* ── Admin API ─────────────────────────────────────────────────────────────*/

const clientId = fromEnv('SHOPIFY_CLIENT_ID');
const clientSecret = fromEnv('SHOPIFY_CLIENT_SECRET');

async function adminToken() {
  if (!clientId || !clientSecret) {
    console.error('Set SHOPIFY_CLIENT_ID and SHOPIFY_CLIENT_SECRET in the environment or .env.local.');
    process.exit(1);
  }
  const res = await fetch(`https://${DOMAIN}/admin/oauth/access_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ grant_type: 'client_credentials', client_id: clientId, client_secret: clientSecret }),
  });
  const body = await res.text();
  if (!res.ok) throw new Error(`Token exchange failed (${res.status}): ${body}`);
  const json = JSON.parse(body);
  if (!json.access_token) throw new Error(`No access_token in response: ${body}`);
  return json.access_token;
}

let TOKEN = '';

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

const METAOBJECT_BY_TYPE = `
query DefinitionByType($type: String!) {
  metaobjectDefinitionByType(type: $type) {
    id
    type
  }
}`;

const CREATE_METAOBJECT = `
mutation CreateMetaobjectDefinition($definition: MetaobjectDefinitionCreateInput!) {
  metaobjectDefinitionCreate(definition: $definition) {
    metaobjectDefinition {
      id
      type
      name
    }
    userErrors {
      field
      message
      code
    }
  }
}`;

const CREATE_METAFIELD = `
mutation CreateMetafieldDefinition($definition: MetafieldDefinitionInput!) {
  metafieldDefinitionCreate(definition: $definition) {
    createdDefinition {
      id
      name
      namespace
      key
    }
    userErrors {
      field
      message
      code
    }
  }
}`;

const results = [];
const record = (what, state, detail = '') => {
  results.push({ what, state, detail });
  const mark = state === 'created' ? 'created' : state === 'exists' ? 'exists ' : 'FAILED ';
  console.log(`  [${mark}] ${what}${detail ? `  — ${detail}` : ''}`);
};

async function ensureMetaobject({ type, name, description, displayNameKey, fields }) {
  const existing = await gql(METAOBJECT_BY_TYPE, { type });
  if (existing?.metaobjectDefinitionByType?.id) {
    record(`metaobject "${type}"`, 'exists');
    return existing.metaobjectDefinitionByType.id;
  }

  const data = await gql(CREATE_METAOBJECT, {
    definition: {
      type,
      name,
      description,
      displayNameKey,
      access: { storefront: 'PUBLIC_READ' },
      fieldDefinitions: fields,
    },
  });

  const payload = data.metaobjectDefinitionCreate;
  if (payload.userErrors?.length) {
    record(`metaobject "${type}"`, 'failed', payload.userErrors.map((e) => e.message).join('; '));
    return null;
  }
  record(`metaobject "${type}"`, 'created');
  for (const f of fields) console.log(`            field ${f.key}`);
  return payload.metaobjectDefinition.id;
}

async function ensureMetafield(ownerType, field) {
  const label = `${ownerType.toLowerCase()} ${NAMESPACE}.${field.key}`;

  const base = {
    name: field.name,
    namespace: NAMESPACE,
    key: field.key,
    type: field.type,
    ownerType,
    pin: true,
    ...(field.description ? { description: field.description } : {}),
    ...(field.validations ? { validations: field.validations } : {}),
  };

  // Merchant-editable in the admin, readable by the Storefront API. If a store
  // rejects the admin setting, fall back to the default rather than losing the
  // definition — the storefront exposure is the part that must not be dropped.
  const attempts = [
    { ...base, access: { admin: 'MERCHANT_READ_WRITE', storefront: 'PUBLIC_READ' } },
    { ...base, access: { storefront: 'PUBLIC_READ' } },
  ];

  let lastError = '';
  for (const definition of attempts) {
    let payload;
    try {
      payload = (await gql(CREATE_METAFIELD, { definition })).metafieldDefinitionCreate;
    } catch (err) {
      lastError = err.message;
      continue;
    }
    if (!payload.userErrors?.length) {
      record(label, 'created');
      return;
    }
    if (payload.userErrors.some((e) => e.code === 'TAKEN')) {
      record(label, 'exists');
      return;
    }
    lastError = payload.userErrors.map((e) => `${e.code ?? ''} ${e.message}`.trim()).join('; ');
  }
  record(label, 'failed', lastError);
}

/* ── Run ───────────────────────────────────────────────────────────────────*/

if (DRY) {
  console.log(`Would create, in namespace "${NAMESPACE}" on ${DOMAIN}:\n`);
  console.log(`  metaobject "source" with ${SOURCE_FIELDS.length} fields:`);
  for (const f of SOURCE_FIELDS) console.log(`    ${f.key.padEnd(18)} ${f.type}${f.required ? '  (required)' : ''}`);
  console.log(`\n  metaobject "spec_template" with ${SPEC_TEMPLATE_FIELDS.length} fields:`);
  for (const f of SPEC_TEMPLATE_FIELDS) console.log(`    ${f.key.padEnd(18)} ${f.type}${f.required ? '  (required)' : ''}`);
  console.log(`\n  collection metafields:`);
  for (const f of COLLECTION_FIELDS) console.log(`    ${f.key.padEnd(18)} ${f.type}`);
  console.log(`\n  product metafields:`);
  for (const f of PRODUCT_FIELDS) console.log(`    ${f.key.padEnd(18)} ${f.type}`);
  console.log(`    ${'source'.padEnd(18)} metaobject_reference -> source`);
  process.exit(0);
}

TOKEN = await adminToken();
console.log(`\nStore ${DOMAIN}, API ${VERSION}, namespace "${NAMESPACE}"\n`);

console.log('Metaobject definitions');
const sourceDefinitionId = await ensureMetaobject({
  type: 'source',
  name: 'Source',
  description: 'One archive poster. The MOCKBA intervention is recorded separately on the product.',
  displayNameKey: 'original_title',
  fields: SOURCE_FIELDS,
});
await ensureMetaobject({
  type: 'spec_template',
  name: 'Specification template',
  description:
    'The item record specification table for one product category. A product may override it with mockba.spec.',
  displayNameKey: 'category',
  fields: SPEC_TEMPLATE_FIELDS,
});

console.log('\nCollection metafields');
for (const f of COLLECTION_FIELDS) await ensureMetafield('COLLECTION', f);

console.log('\nProduct metafields');
for (const f of PRODUCT_FIELDS) await ensureMetafield('PRODUCT', f);

if (sourceDefinitionId) {
  await ensureMetafield('PRODUCT', {
    key: 'source',
    name: 'Source',
    type: 'metaobject_reference',
    description: 'The archive poster this item reproduces.',
    validations: [{ name: 'metaobject_definition_id', value: sourceDefinitionId }],
  });
} else {
  record(`product ${NAMESPACE}.source`, 'failed', 'the metaobject definition is missing, so the reference cannot be typed');
}

const failed = results.filter((r) => r.state === 'failed');
const created = results.filter((r) => r.state === 'created').length;
const existed = results.filter((r) => r.state === 'exists').length;

console.log(`\n${'='.repeat(72)}`);
console.log(`${created} created, ${existed} already present, ${failed.length} failed.`);

if (failed.length) {
  console.log('\nFailures:');
  for (const f of failed) console.log(`  - ${f.what}: ${f.detail}`);
  console.log(
    '\nIf these mention access scopes, the app needs write_metafield_definitions and',
  );
  console.log('write_metaobject_definitions on the Admin API, then run this again.');
  process.exitCode = 1;
} else {
  console.log('\nThe structure exists. Fill in the values in the Shopify admin, then run');
  console.log('  node scripts/verify-content-model.mjs');
  console.log('to confirm the site reads them.');
}
