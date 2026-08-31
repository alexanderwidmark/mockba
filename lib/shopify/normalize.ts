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
 *  - Sizes, like blanks, come from the product's own option. An item that
 *    declares none has none; the size register is not rendered rather than
 *    filled with a default range the store never offered.
 *  - The specification table comes from the `spec_template` for the product's
 *    Shopify category, so a medium is described once. `mockba.spec` overrides
 *    it for one product. Nothing is stated that is not in the data: an item
 *    whose category has no template shows no table at all.
 *  - Product image 1 is the garment plate as photographed. A variant may carry
 *    its own image; when it does, choosing a blank changes the plate.
 *  - Which blank a plate shows, and which face it is, are read out of its alt
 *    text: "Public Servant, Natural, verso". Shopify links one image to a
 *    variant and exposes no other per-image field, so the alt text is the only
 *    place this can live — and it has to be written anyway. An image naming no
 *    blank is neutral and shown for every one. Where no alt text names a blank
 *    the convention is simply not in use, and a multi-blank object falls back
 *    to its variant image alone rather than pairing a colour with a photograph
 *    of a different one.
 *  - The archive source and the MOCKBA intervention stay separate fields
 *    throughout; nothing here merges them into one credit line.
 */

import { resolveRights, territoryOf } from '../rights';
import type {
  Colour,
  Plate,
  EnforcementRisk,
  Item,
  RawCollection,
  RawMetafield,
  RawProduct,
  RawVariant,
  RightsStatus,
  Series,
  Territory,
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

/** The face named in an alt text, if any. */
function readView(alt: string): 'recto' | 'verso' | null {
  if (/\b(verso|back|reverse)\b/i.test(alt)) return 'verso';
  if (/\b(recto|front)\b/i.test(alt)) return 'recto';
  return null;
}

/** The blank named in an alt text, matched against the blanks the store declares. */
function readPlateColour(alt: string, colours: Colour[]): string | null {
  const found = colours.find((c) =>
    new RegExp(`(^|[^\\p{L}])${c.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^\\p{L}]|$)`, 'iu').test(alt),
  );
  return found ? found.name : null;
}

/**
 * The item's own specification table, ordered. Anything malformed is ignored
 * rather than half-rendered, so the item record falls back to the garment
 * defaults instead of printing a broken row.
 */
function readSpec(node: RawProduct): { k: string; v: string }[] {
  try {
    const raw = JSON.parse(mfv(node.metafields, 'spec', '[]'));
    if (!Array.isArray(raw)) return [];
    return raw
      .filter((r) => r && typeof r.k === 'string' && typeof r.v === 'string')
      .map((r) => ({ k: r.k, v: r.v }));
  } catch {
    return [];
  }
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
  const sym = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : '';
  const body = Number.isInteger(n) ? String(n) : n.toFixed(2);
  return sym ? sym + body : `${body} ${currency}`;
}

const asRights = (v: string): RightsStatus =>
  (RIGHTS as string[]).includes(v) ? (v as RightsStatus) : 'research required';

/**
 * Shopify fills alt text with the upload's filename when none is written, which
 * a screen reader announces as a UUID. Anything that is only a filename or a
 * bare identifier is treated as absent so a composed description is used.
 */
const usableAlt = (alt: string | null | undefined): string => {
  const text = (alt ?? '').trim();
  if (!text) return '';
  if (/^[0-9a-f-]{16,}$/i.test(text)) return '';
  if (/^[\w-]+\.(png|jpe?g|webp|gif|avif)$/i.test(text)) return '';
  return text;
};

const asRisk = (v: string): EnforcementRisk =>
  (RISKS as string[]).includes(v) ? (v as EnforcementRisk) : 'low';

/** Flatten one Storefront product node into what the page renders. */
export function normalizeProduct(
  node: RawProduct,
  i: number,
  specTemplates: Record<string, { k: string; v: string }[]> = {},
  territory: Territory = 'row',
): Item {
  const src = readSource(node);
  const price = node.priceRange?.minVariantPrice ?? null;
  const img = node.images?.edges?.[0] ?? null;
  const fallbackGarment = mfv(node.metafields, 'garment_color', '#1A1A18');
  const colours = readColourMap(node, fallbackGarment);
  const colourOption = (node.options || []).find((o) => /colour|color/i.test(o.name));
  const hasBlankOption = optionNames(colourOption).length > 0;
  const skuBase = mfv(node.metafields, 'sku_base');
  const category = node.category?.name ?? '';
  const sizeOpt = (node.options || []).find((o) => /size/i.test(o.name));
  const sizeValues = optionNames(sizeOpt);
  const hasSizeOption = sizeValues.length > 0;
  const artist = src.artist || 'Unknown';

  const image = img ? img.node.url : '';
  const display = mfv(node.metafields, 'command', node.title);
  const imageAlt = usableAlt(img?.node.altText) || display;

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
      imageAlt: usableAlt(v.image?.altText) || (colourName ? `${display}, ${colourName}` : display),
      accession: accessionFor(skuBase, colourName, size, v.sku || ''),
    };
  });

  const first = variants.find((v) => v.available) ?? variants[0] ?? null;

  return {
    no: String(i + 1).padStart(2, '0'),
    id: node.id,
    handle: node.handle,
    productTitle: node.title,
    title: display,
    secondary: mfv(node.metafields, 'contradiction'),
    mechanismLine: mfv(node.metafields, 'mechanism'),
    role: mfv(node.metafields, 'role', 'hero graphic'),
    price: price ? formatMoney(price.amount, price.currencyCode) : '',
    currency: price ? price.currencyCode : 'USD',
    availableForSale: Boolean(node.availableForSale),
    image,
    imageAlt,
    plates: (() => {
      const owned = new Set(
        (node.variants?.edges ?? []).map((e) => e.node.image?.url).filter(Boolean) as string[],
      );
      return (node.images?.edges ?? []).map((e, i): Plate => {
        const alt = usableAlt(e.node.altText);
        return {
          url: e.node.url,
          alt: alt || `${display}, plate ${i + 1}`,
          colour: alt ? readPlateColour(alt, colours) : null,
          view: alt ? readView(alt) : null,
          variantOwned: owned.has(e.node.url),
        };
      });
    })(),
    // First-paint / card mockup values: the default variant's colour.
    garmentColor: first ? first.garmentColor : fallbackGarment,
    garmentName: first ? first.colourName : (colours[0]?.name ?? ''),
    hasBlankOption,
    colours,
    sizeValues,
    sizes: hasSizeOption ? `${sizeValues[0]}–${sizeValues[sizeValues.length - 1]}` : '',
    hasSizeOption,
    category,
    specs: (() => {
      const own = readSpec(node);
      const rows = own.length ? own : (specTemplates[category.toLowerCase()] ?? []);
      if (!rows.length) return [];
      // The size range is derived per product, so it is never in a template.
      const sizes = hasSizeOption
        ? `${sizeValues[0]}–${sizeValues[sizeValues.length - 1]}`
        : '';
      return sizes && !rows.some((r) => r.k.toLowerCase() === 'sizes')
        ? [...rows, { k: 'sizes', v: sizes }]
        : rows;
    })(),
    substrate: mfv(node.metafields, 'substrate', 'cotton'),
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
    ...(() => {
      const r = resolveRights((k) => src[k], territory);
      return {
        rights: asRights(r.status),
        risk: asRisk(r.risk),
        rightsTerritory: r.territory,
        rightsScoped: r.scoped,
      };
    })(),
  };
}

export function normalizeSeries(
  collection: RawCollection,
  specTemplates: Record<string, { k: string; v: string }[]> = {},
  country = '',
): Series {
  const territory = territoryOf(country);
  const meta = (k: string) => mfv(collection.metafields, k);
  const edges = collection.products?.edges ?? [];
  return {
    handle: collection.handle,
    title: collection.title,
    seriesNo: meta('series_no'),
    status: meta('status') || 'release candidate',
    issued: meta('issued'),
    products: edges.map((e, i) => normalizeProduct(e.node, i, specTemplates, territory)),
  };
}
