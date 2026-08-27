/**
 * Storefront response -> the models the pages render.
 *
 * Ported from the design prototype's data layer. The rules that matter:
 *  - `colour_map` carries a garment hex per blank, so one work ships on several
 *    blanks with no deploy. `garment_color` is the fallback when the map is
 *    absent.
 *  - Blanks come from the product's own colour option. A product that declares
 *    none has none: the site does not invent a blank, and the item record shows
 *    no blank selector.
 *  - The accession number is composed from `sku_base`, the blank and the size.
 *    The variant SKU belongs to the fulfilment integration and is not shown.
 *  - Product image 1 is the garment plate as photographed. A variant may carry
 *    its own image; when it does, choosing a blank changes the plate.
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

/**
 * The blanks this item actually ships on. The product's colour option is the
 * authority; `colour_map` only supplies each blank's hex. When the store
 * declares no colour option and carries no map, the answer is none — an empty
 * list, never an invented default.
 */
function readColourMap(node: RawProduct, fallbackGarment: string): Colour[] {
  let map: Record<string, { garment?: string }> = {};
  try {
    map = JSON.parse(mfv(node.metafields, 'colour_map', '{}')) || {};
  } catch {
    map = {};
  }
  const opt = (node.options || []).find((o) => /colour|color/i.test(o.name));
  const declared = optionNames(opt);
  const names = declared.length ? declared : Object.keys(map);
  return names.map((name) => {
    const rec = map[name] || {};
    return { name, garment: rec.garment || fallbackGarment };
  });
}

/**
 * The accession number: the stem from the content model, then the blank and the
 * size. 'MAC-4' + Black + S -> 'MAC-4-BL-S'; with no blank, 'MAC-4-S'. Falls
 * back to the fulfilment SKU so the field is never blank.
 */
function accessionFor(base: string, colourName: string, size: string, sku: string): string {
  if (!base) return sku;
  const parts = [base];
  if (colourName) parts.push(colourName.slice(0, 2).toUpperCase());
  if (size) parts.push(size);
  return parts.join('-');
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
  const colours = readColourMap(node, fallbackGarment);
  const colourOption = (node.options || []).find((o) => /colour|color/i.test(o.name));
  const hasBlankOption = optionNames(colourOption).length > 0;
  const skuBase = mfv(node.metafields, 'sku_base');
  const sizeOpt = (node.options || []).find((o) => /size/i.test(o.name));
  const declaredSizes = optionNames(sizeOpt);
  const sizeValues = declaredSizes.length ? declaredSizes : SIZES;
  const artist = src.artist || 'Unknown';

  const image = img ? img.node.url : '';
  const imageAlt = img?.node.altText || node.title;

  const variants: Variant[] = (node.variants?.edges ?? []).map((e) => {
    const v = e.node;
    const colourName = optValue(v, /colour|color/i) || colours[0]?.name || '';
    const colour = colours.find((c) => c.name === colourName) ?? colours[0] ?? null;
    const size = optValue(v, /size/i);
    return {
      id: v.id,
      numericId: String(v.id).split('/').pop() ?? '',
      title: v.title,
      sku: v.sku || '',
      size,
      colourName,
      garmentColor: colour?.garment ?? fallbackGarment,
      available: Boolean(v.availableForSale),
      qty: v.quantityAvailable ?? null,
      priceAmount: v.price ? v.price.amount : (price?.amount ?? '0'),
      currency: v.price ? v.price.currencyCode : 'USD',
      price: v.price ? formatMoney(v.price.amount, v.price.currencyCode) : '',
      image: v.image?.url || image,
      imageAlt: v.image?.altText || imageAlt,
      accession: accessionFor(skuBase, colourName, size, v.sku || ''),
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
    image,
    imageAlt,
    // First-paint / card mockup values: the default variant's colour.
    garmentColor: first ? first.garmentColor : fallbackGarment,
    garmentName: first ? first.colourName : (colours[0]?.name ?? ''),
    hasBlankOption,
    colours,
    sizeValues,
    sizes: sizeValues.length
      ? `${sizeValues[0]}–${sizeValues[sizeValues.length - 1]}`
      : 'XS–3XL',
    variants,
    defaultVariantId: first ? first.id : null,
    sku: first?.sku ?? '',
    skuBase,
    accession: first?.accession ?? skuBase,
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
