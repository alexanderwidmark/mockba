/**
 * The Storefront response shapes this site reads, and the flattened models the
 * pages render. The raw types are deliberately partial — they describe exactly
 * the fields SERIES_QUERY asks for, so a missing field is a type error rather
 * than an undefined at runtime.
 */

export type RawMetafield = {
  key: string;
  value: string | null;
  reference?: { type: string; fields: { key: string; value: string | null }[] } | null;
} | null;

export type RawVariant = {
  id: string;
  title: string;
  sku: string | null;
  availableForSale: boolean;
  quantityAvailable: number | null;
  currentlyNotInStock: boolean;
  price: { amount: string; currencyCode: string } | null;
  selectedOptions: { name: string; value: string }[];
};

export type RawProduct = {
  id: string;
  handle: string;
  title: string;
  availableForSale: boolean;
  priceRange: { minVariantPrice: { amount: string; currencyCode: string } } | null;
  images: { edges: { node: { url: string; altText: string | null } }[] } | null;
  /** ProductOption.values was removed from the Storefront schema; read optionValues. */
  options: { name: string; optionValues: { name: string }[] }[];
  variants: { edges: { node: RawVariant }[] } | null;
  metafields: RawMetafield[];
};

export type RawCollection = {
  handle: string;
  title: string;
  descriptionHtml: string;
  metafields: RawMetafield[];
  products: { edges: { node: RawProduct }[] } | null;
};

/* ── Flattened models ─────────────────────────────────────────────────────── */

export type Colour = {
  name: string;
  /** Blank colour, hex. Drives the silhouette and the ink simulation. */
  garment: string;
  /** Print ink colour, hex. */
  ink: string;
};

export type Variant = {
  id: string;
  numericId: string;
  title: string;
  sku: string;
  size: string;
  colourName: string;
  garmentColor: string;
  printInk: string;
  available: boolean;
  qty: number | null;
  priceAmount: string;
  currency: string;
  price: string;
};

export type RightsStatus = 'cleared' | 'research required' | 'restricted';
export type EnforcementRisk = 'low' | 'medium' | 'high';

export type Item = {
  /** Position in the series, zero-padded: '01'. */
  no: string;
  id: string;
  handle: string;
  productTitle: string;
  /** Layer 1 — the command. The display title. */
  title: string;
  /** Layer 2 — the contradiction. */
  secondary: string;
  mechanismLine: string;
  role: string;
  price: string;
  currency: string;
  availableForSale: boolean;
  poster: string;
  posterAlt: string;
  garmentColor: string;
  printInk: string;
  garmentName: string;
  /** 'w/h' of the print area, carrying the source poster's own orientation. */
  printAspect: string;
  colours: Colour[];
  sizeValues: string[];
  sizes: string;
  variants: Variant[];
  defaultVariantId: string | null;
  sku: string;
  /* Archive source — recorded separately from the MOCKBA intervention. */
  sourceTitle: string;
  artist: string;
  sourceShort: string;
  year: string;
  origin: string;
  purpose: string;
  sourceNote: string;
  rights: RightsStatus;
  risk: EnforcementRisk;
};

export type Series = {
  handle: string;
  title: string;
  seriesNo: string;
  status: string;
  issued: string;
  products: Item[];
};
