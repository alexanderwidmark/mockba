/**
 * Storefront response -> the models the pages render.
 *
 * Ported from the design prototype's data layer. The rules that matter:
 *  - `colour_map` carries a garment + ink pair per blank, so one work ships on
 *    several blanks with no deploy. `garment_color` / `print_ink` are the
 *    fallbacks when the map is absent.
 *  - `print_aspect` carries the source poster's own orientation, so a 3/2
 *    poster is never cropped into a 3/4 frame.
 *  - The archive source and the MOCKBA intervention stay separate fields
 *    throughout; nothing here merges them into one credit line.
 */

import type {
  Colour,
  EnforcementRisk,
  Item,
  RawCollection,
  RawMetafield,
  RawProduct,
  RawVariant,
  RightsStatus,
  Series,
  Variant,
} from './types';

export const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'];

const RIGHTS: RightsStatus[] = ['cleared', 'research required', 'restricted'];
const RISKS: EnforcementRisk[] = ['low', 'medium', 'high'];

const mf = (metafields: RawMetafield[], key: string): RawMetafield =>
  (metafields || []).find((m) => m && m.key === key) ?? null;

const mfv = (metafields: RawMetafield[], key: string, fallback = ''): string => {
  const m = mf(metafields, key);
  return m && m.value != null ? m.value : fallback;
};

/** The `source` metaobject, flattened to a key/value record. */
function readSource(node: RawProduct): Record<string, string> {
  const ref = mf(node.metafields, 'source');
  const fields = ref?.reference?.fields ?? [];
  const out: Record<string, string> = {};
  for (const f of fields) if (f.value != null) out[f.key] = f.value;
  return out;
}

function readColourMap(node: RawProduct, fallbackGarment: string, fallbackInk: string): Colour[] {
  let map: Record<string, { garment?: string; ink?: string }> = {};
  try {
    map = JSON.parse(mfv(node.metafields, 'colour_map', '{}')) || {};
  } catch {
    map = {};
  }
  const opt = (node.options || []).find((o) => /colour|color/i.test(o.name));
  const declared = optionNames(opt);
  const names = declared.length ? declared : Object.keys(map);
  const resolved = names.length ? names : ['Black'];
  return resolved.map((name) => {
    const rec = map[name] || {};
    return { name, garment: rec.garment || fallbackGarment, ink: rec.ink || fallbackInk };
  });
}

/** The values of one product option, in the order Shopify holds them. */
const optionNames = (opt: { optionValues: { name: string }[] } | undefined): string[] =>
  (opt?.optionValues ?? []).map((v) => v.name).filter(Boolean);

const optValue = (variant: RawVariant, re: RegExp): string =>
  (variant.selectedOptions || []).find((x) => re.test(x.name))?.value ?? '';

export function formatMoney(amount: string | number, currency: string): string {
  const n = Number(amount);
  const sym = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : '';
  const body = Number.isInteger(n) ? String(n) : n.toFixed(2);
  return sym ? sym + body : `${body} ${currency}`;
}

const asRights = (v: string): RightsStatus =>
  (RIGHTS as string[]).includes(v) ? (v as RightsStatus) : 'research required';

const asRisk = (v: string): EnforcementRisk =>
  (RISKS as string[]).includes(v) ? (v as EnforcementRisk) : 'low';

/** Flatten one Storefront product node into what the page renders. */
export function normalizeProduct(node: RawProduct, i: number): Item {
  const src = readSource(node);
  const price = node.priceRange?.minVariantPrice ?? null;
  const img = node.images?.edges?.[0] ?? null;
  const fallbackGarment = mfv(node.metafields, 'garment_color', '#1A1A18');
  const fallbackInk = mfv(node.metafields, 'print_ink', '#F1EDE3');
  const colours = readColourMap(node, fallbackGarment, fallbackInk);
  const sizeOpt = (node.options || []).find((o) => /size/i.test(o.name));
  const declaredSizes = optionNames(sizeOpt);
  const sizeValues = declaredSizes.length ? declaredSizes : SIZES;
  const artist = src.artist || 'Unknown';

  const variants: Variant[] = (node.variants?.edges ?? []).map((e) => {
    const v = e.node;
    const colourName = optValue(v, /colour|color/i) || colours[0].name;
    const colour = colours.find((c) => c.name === colourName) || colours[0];
    return {
      id: v.id,
      numericId: String(v.id).split('/').pop() ?? '',
      title: v.title,
      sku: v.sku || '',
      size: optValue(v, /size/i),
      colourName,
      garmentColor: colour.garment,
      printInk: colour.ink,
      available: Boolean(v.availableForSale),
      qty: v.quantityAvailable ?? null,
      priceAmount: v.price ? v.price.amount : (price?.amount ?? '0'),
      currency: v.price ? v.price.currencyCode : 'USD',
      price: v.price ? formatMoney(v.price.amount, v.price.currencyCode) : '',
    };
  });

  const first = variants.find((v) => v.available) ?? variants[0] ?? null;

  return {
    no: String(i + 1).padStart(2, '0'),
    id: node.id,
    handle: node.handle,
    productTitle: node.title,
    title: mfv(node.metafields, 'command', node.title),
    secondary: mfv(node.metafields, 'contradiction'),
    mechanismLine: mfv(node.metafields, 'mechanism'),
    role: mfv(node.metafields, 'role', 'hero graphic'),
    price: price ? formatMoney(price.amount, price.currencyCode) : '',
    currency: price ? price.currencyCode : 'USD',
    availableForSale: Boolean(node.availableForSale),
    poster: img ? img.node.url : '',
    posterAlt: img?.node.altText || node.title,
    // First-paint / card mockup values: the default variant's colour.
    garmentColor: first ? first.garmentColor : fallbackGarment,
    printInk: first ? first.printInk : fallbackInk,
    garmentName: first ? first.colourName : colours[0].name,
    printAspect: mfv(node.metafields, 'print_aspect', '3/4'),
    colours,
    sizeValues,
    sizes: sizeValues.length
      ? `${sizeValues[0]}–${sizeValues[sizeValues.length - 1]}`
      : 'XS–3XL',
    variants,
    defaultVariantId: first ? first.id : null,
    sku: first && first.sku ? first.sku : (String(node.id).split('/').pop() ?? ''),
    sourceTitle: src.original_title || '',
    artist,
    sourceShort: artist.split('&')[0].trim().split(' ').pop() ?? artist,
    year: src.year || '',
    origin: src.origin || '',
    purpose: src.purpose || '',
    sourceNote: src.source_note || '',
    rights: asRights(src.rights_status || ''),
    risk: asRisk(src.enforcement_risk || ''),
  };
}

export function normalizeSeries(collection: RawCollection): Series {
  const meta = (k: string) => mfv(collection.metafields, k);
  const edges = collection.products?.edges ?? [];
  return {
    handle: collection.handle,
    title: collection.title,
    seriesNo: meta('series_no'),
    status: meta('status') || 'release candidate',
    issued: meta('issued'),
    products: edges.map((e, i) => normalizeProduct(e.node, i)),
  };
}
