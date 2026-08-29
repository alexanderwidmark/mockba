#!/usr/bin/env node
/**
 * Compose each product's Shopify description from the content model.
 *
 * The site does not read the description, but Google Shopping, marketplaces and
 * Shopify's own search do. Filling it from the print partner would put generic
 * commerce copy in front of everyone who meets the work through an
 * advertisement. Composing it from the fields already maintained keeps the
 * voice, states the object's facts that a product feed needs, and means the
 * text is never written twice.
 *
 *   node scripts/compose-descriptions.mjs --dry-run
 *   node scripts/compose-descriptions.mjs
 *   node scripts/compose-descriptions.mjs --force
 *
 * A description this script wrote carries a marker and is overwritten freely. A
 * description written by hand is left alone unless --force is passed.
 */

import { readFileSync } from 'node:fs';

const DRY = process.argv.includes('--dry-run');
const FORCE = process.argv.includes('--force');
const MARKER = '<!-- composed from the content model -->';

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

let TOKEN = '';

async function adminToken() {
  const id = fromEnv('SHOPIFY_CLIENT_ID');
  const secret = fromEnv('SHOPIFY_CLIENT_SECRET');
  if (!id || !secret) {
    console.error('Set SHOPIFY_CLIENT_ID and SHOPIFY_CLIENT_SECRET in .env.local.');
    process.exit(1);
  }
  const res = await fetch(`https://${DOMAIN}/admin/oauth/access_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ grant_type: 'client_credentials', client_id: id, client_secret: secret }),
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

const PRODUCTS = /* GraphQL */ `
  query Products {
    products(first: 50) {
      nodes {
        id
        handle
        title
        descriptionHtml
        category {
          name
        }
        options {
          name
          optionValues {
            name
          }
        }
        metafields(first: 30, namespace: "mockba") {
          nodes {
            key
            value
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

const TEMPLATES = /* GraphQL */ `
  query SpecTemplates {
    metaobjects(type: "spec_template", first: 25) {
      nodes {
        fields {
          key
          value
        }
      }
    }
  }
`;

const UPDATE = /* GraphQL */ `
  mutation SetDescription($product: ProductUpdateInput!) {
    productUpdate(product: $product) {
      product {
        handle
      }
      userErrors {
        field
        message
      }
    }
  }
`;

/** Shopify's description is HTML, and these strings are merchant-authored. */
const esc = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

const parseRows = (raw) => {
  try {
    const v = JSON.parse(raw ?? '[]');
    return Array.isArray(v) ? v.filter((r) => r?.k && r?.v) : [];
  } catch {
    return [];
  }
};

/**
 * The archive source and the MOCKBA intervention are stated separately here
 * exactly as they are on the site. A feed description that merged them would be
 * the one place the project claims the headline is part of the original work.
 */
function compose(product, templates) {
  const mf = Object.fromEntries(product.metafields.nodes.map((m) => [m.key, m]));
  const val = (k) => mf[k]?.value?.trim() ?? '';
  const src = Object.fromEntries(
    (mf.source?.reference?.fields ?? []).map((f) => [f.key, (f.value ?? '').trim()]),
  );

  const title = val('command') || product.title;
  const paragraphs = [];

  const contradiction = val('contradiction');
  paragraphs.push(esc(contradiction ? `${title} — ${contradiction}` : title));

  const mechanism = val('mechanism');
  if (mechanism) paragraphs.push(esc(mechanism));

  if (src.original_title) {
    const credit = [src.artist, src.year, src.origin].filter(Boolean).join(', ');
    paragraphs.push(
      `${esc(`Reproduced from ${src.original_title}${credit ? `, ${credit}` : ''}.`)} ` +
        'The English headline is the MOCKBA intervention, recorded separately from the archive source.',
    );
  }

  /* The object's own facts, which is what a product feed is actually for. */
  const rows = parseRows(val('spec')).length
    ? parseRows(val('spec'))
    : (templates[(product.category?.name ?? '').toLowerCase()] ?? []);

  const sizeOpt = (product.options ?? []).find((o) => /size/i.test(o.name));
  const sizes = (sizeOpt?.optionValues ?? []).map((v) => v.name);
  const colourOpt = (product.options ?? []).find((o) => /colour|color/i.test(o.name));
  const blanks = (colourOpt?.optionValues ?? []).map((v) => v.name);

  const facts = rows.map((r) => `${r.k} ${r.v}`);
  if (sizes.length) facts.push(`sizes ${sizes[0]}–${sizes[sizes.length - 1]}`);
  if (blanks.length) facts.push(`on ${blanks.join(' and ')}`);

  /* No closing line: the fulfilment method is stated in the shipping policy,
     and repeating it on every product is the kind of filler a feed rewards and
     a reader does not. */
  if (facts.length) paragraphs.push(`${esc(facts.join(' · '))}.`);

  return `${MARKER}\n${paragraphs.map((p) => `<p>${p}</p>`).join('\n')}`;
}

/* ── Run ───────────────────────────────────────────────────────────────────*/

TOKEN = await adminToken();

const templates = Object.fromEntries(
  (await gql(TEMPLATES)).metaobjects.nodes
    .map((n) => Object.fromEntries(n.fields.map((f) => [f.key, f.value])))
    .filter((t) => t.category)
    .map((t) => [t.category.trim().toLowerCase(), parseRows(t.spec)]),
);

const products = (await gql(PRODUCTS)).products.nodes;
console.log(`\n${DOMAIN} — ${products.length} products, ${Object.keys(templates).length} spec templates\n`);

let written = 0;
let skipped = 0;

for (const p of products) {
  const existing = (p.descriptionHtml ?? '').trim();
  const ours = existing.includes(MARKER);

  if (existing && !ours && !FORCE) {
    console.log(`  [ kept  ] ${p.handle}   has a description this script did not write`);
    skipped += 1;
    continue;
  }

  const body = compose(p, templates);

  if (DRY) {
    console.log(`  ${p.handle}${ours ? '   (rewriting its own)' : ''}`);
    /* Unescape for the preview only; the stored HTML keeps its entities. */
    const readable = (s) =>
      s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
    console.log(
      readable(body)
        .replace(MARKER, '')
        .replace(/<\/p>/g, '')
        .split('<p>')
        .filter((s) => s.trim())
        .map((s) => `      ${s.trim()}`)
        .join('\n'),
    );
    console.log('');
    continue;
  }

  const out = await gql(UPDATE, { product: { id: p.id, descriptionHtml: body } });
  const errs = out.productUpdate.userErrors;
  if (errs?.length) {
    console.log(`  [FAILED ] ${p.handle}   ${errs.map((e) => e.message).join('; ')}`);
  } else {
    console.log(`  [written] ${p.handle}`);
    written += 1;
  }
}

if (!DRY) {
  console.log(`\n${written} written, ${skipped} kept.`);
  if (skipped) console.log('Pass --force to overwrite descriptions written by hand.');
}
