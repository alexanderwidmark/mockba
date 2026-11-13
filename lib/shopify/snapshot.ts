/**
 * Build-time snapshot of the series, shaped exactly like the Storefront
 * response and assembled from a compact spec so a full colour × size variant
 * matrix does not have to be written out by hand.
 *
 * This is the per-series fallback: one dead collection handle must not blank
 * the page. It is also what renders before Shopify is configured at all, which
 * is why a Vercel preview without the Storefront credentials shows this file
 * rather than the store.
 *
 * It therefore has one job: mirror the live record. A fallback that lags the
 * catalogue is tolerable; one that contradicts it is worse than none, because
 * it states a price, a garment and a size range the store will not honour.
 * Edit items in Shopify, then bring this file back in line.
 *
 * Mirrored from VALIDATION DROP 001 on 2026-11-13.
 */

import type { RawCollection, RawProduct } from './types';

/** A blank the product's Color option actually declares. */
type SpecColour = { name: string; garment: string; ink?: string };

type SpecSource = {
  id: string;
  original_title: string;
  artist: string;
  year: string;
  origin: string;
  purpose: string;
  /**
   * The status that applies everywhere: `row` reads it, and so does any
   * territory with no value of its own, so it must hold the most restrictive
   * position that applies anywhere.
   */
  rights_status: string;
  enforcement_risk: string;
  /**
   * Optional per-territory overrides. Set these only to mirror what the source
   * metaobject in Shopify says — this file is the fallback, and a fallback that
   * contradicts the live record is worse than one that merely lags it.
   */
  rights_status_us?: string;
  enforcement_risk_us?: string;
  rights_status_eu?: string;
  enforcement_risk_eu?: string;
  source_note: string;
};

type SpecItem = {
  handle: string;
  /** The product title as Shopify holds it; the register displays `command`. */
  title: string;
  skuBase: string;
  price: string;
  command: string;
  contradiction: string;
  mechanism: string;
  printAspect: string;
  /**
   * The blanks the Color option declares, in Shopify's order. This is the
   * authority for what ships: `colourMap` may name more.
   */
  blanks: SpecColour[];
  /**
   * The `colour_map` metafield verbatim. It can carry blanks the option no
   * longer declares — normalisation ignores those, and so should this file,
   * but it mirrors them rather than quietly tidying the record.
   */
  colourMap: Record<string, { garment: string; ink?: string }>;
  /** The Size option's values, in Shopify's order. */
  sizes: string[];
  /** Sizes the store is out of, by name. Print-on-demand: normally none. */
  soldOut: string[];
  /** Product media in order. Image 1 is the plate the card and record show. */
  plates: { file: string; alt: string }[];
  source: SpecSource;
};

type SpecEntry = {
  series: { handle: string; title: string; no: string; status: string; issued: string };
  items: SpecItem[];
};

/**
 * The garment specification.
 *
 * Live products carry no `spec` metafield: they inherit the `spec_template`
 * metaobject for the 'T-Shirts' category. That template is fetched from the
 * same Storefront API as the collection, so in the fallback path it is just as
 * unreachable and resolves to nothing. The template is therefore inlined here,
 * and this is the one place the snapshot deliberately holds data the live
 * product does not — without it the item record shows no table at all.
 */
const TSHIRT_SPEC = [
  { k: 'garment', v: 'Heavyweight 300g' },
  { k: 'fabric', v: '100% cotton jersey' },
  { k: 'fit', v: 'boxy' },
  { k: 'print', v: 'DTG' },
  { k: 'placement', v: 'Full front' },
];

const BLACK: SpecColour = { name: 'Black', garment: '#1A1A18' };
const SIZES_TS = ['S', 'M', 'L', 'XL', '2XL'];

/**
 * The shop's own currency. The live store prices per market through a price
 * list — $49 in the US, 470 SEK elsewhere — but a snapshot has no market to
 * resolve against, so it states the currency the catalogue is denominated in
 * rather than guessing at the reader's.
 */
const CURRENCY = 'SEK';
const PRICE = '470.00';

const SPEC: SpecEntry[] = [
  {
    series: {
      handle: 'validation-drop-001',
      title: 'VALIDATION DROP 001',
      no: '001',
      status: 'issued',
      issued: '2026.08',
    },
    items: [
      {
        handle: 'history-has-been-updated',
        title: 'HISTORY HAS BEEN UPDATED',
        skuBase: 'MAC-12-TS',
        price: PRICE,
        command: 'History has been updated.',
        contradiction: 'Previous versions are no longer supported.',
        mechanism:
          'Censorship presented not as an argument against the past, but as routine maintenance of the official version.',
        printAspect: '3/4',
        blanks: [BLACK],
        colourMap: { Black: { garment: '#1A1A18' } },
        sizes: SIZES_TS,
        soldOut: [],
        plates: [
          { file: 'history-recto.webp', alt: 'History has been updated, Black, recto' },
          { file: 'history-verso.webp', alt: 'History has been updated, Black, verso' },
        ],
        source: {
          id: '529847157076',
          original_title: '"October - the withdrawn poster"',
          artist: 'Leonid Voronov & Mikhail Evstafiev',
          year: '1927',
          origin: 'USSR',
          purpose: 'Promote the Revolution’s anniversary film',
          rights_status: 'cleared',
          enforcement_risk: 'low',
          rights_status_us: 'cleared',
          enforcement_risk_us: 'low',
          rights_status_eu: 'cleared',
          enforcement_risk_eu: 'low',
          source_note:
            'this two-sheet poster advertised a film commissioned for the Revolution’s tenth anniversary. It was withdrawn from circulation after the political record changed around it. The date matters. The image was not corrected because its composition failed, but because the face of Leon Trotsky had become politically unacceptable.That is the mechanism: censorship presented not as an argument against the past, but as routine maintenance of the official version. The event remains. The authorised cast is revised. Modern institutions rarely announce that they are rewriting a record. They update it, replace it, or quietly withdraw the previous version. History does not disappear. It becomes unsupported.',
        },
      },

      {
        handle: 'drain-the-swamp',
        title: 'DRAIN THE SWAMP',
        skuBase: 'MAC-4-TS',
        price: PRICE,
        command: 'Drain the Swamp',
        contradiction: 'Every revolution starts here.',
        mechanism: 'The promise of a clean sweep never specifies who is swept.',
        printAspect: '3/4',
        blanks: [BLACK],
        colourMap: { Black: { garment: '#1A1A18' } },
        sizes: SIZES_TS,
        soldOut: [],
        plates: [
          { file: 'drain-recto.webp', alt: 'Drain the swamp, Black, recto' },
          { file: 'drain-verso.webp', alt: 'Drain the swamp, Black, verso' },
        ],
        source: {
          id: '527271493972',
          original_title: '"Comrade Lenin cleanses the earth of filth"',
          artist: 'Viktor Deni & Mikhail Cheremnykh',
          year: '1920',
          origin: 'Soviet Russia',
          purpose: 'Legitimise revolutionary cleansing',
          rights_status: 'restricted',
          enforcement_risk: 'medium',
          rights_status_us: 'cleared',
          enforcement_risk_us: 'low',
          rights_status_eu: 'restricted',
          enforcement_risk_eu: 'medium',
          source_note:
            'A lithograph issued in the first years of Soviet rule, showing Lenin sweeping crowned heads, priests and capitalists off the surface of the globe. It was distributed as celebration: the old order removed, the ground cleared for something better. The image is included here because the promise it makes has proven completely portable. Every political movement that has since promised to clear out a corrupt establishment has reused the same structure — a sweep, a clean surface, an unnamed category of filth. What the poster never contains is a definition of who qualifies. That vacancy is the mechanism, and it is refilled every election cycle.',
        },
      },

      {
        handle: 'public-servant',
        title: 'PUBLIC SERVANT',
        skuBase: 'MAC-1-TS',
        price: PRICE,
        command: 'Public Servant',
        contradiction: 'Private interests.',
        mechanism: 'The apparatus outlives every official inside it.',
        printAspect: '3/4',
        blanks: [BLACK],
        // The record still maps a Natural blank the Color option no longer
        // offers. Mirrored, not tidied: normalisation reads the option.
        colourMap: {
          Natural: { garment: '#E8E3D6', ink: '#171512' },
          Black: { garment: '#1A1A18', ink: '#F1EDE3' },
        },
        sizes: SIZES_TS,
        soldOut: [],
        plates: [
          { file: 'servant-recto.webp', alt: 'Public servant, Black, recto' },
          { file: 'servant-verso.webp', alt: 'Public servant, Black, verso' },
        ],
        source: {
          id: '527271526740',
          original_title: '"State Functionary"',
          artist: 'Yukhym Kordysh',
          year: '1930',
          origin: 'Soviet Union',
          purpose: 'Satirise bureaucratic obstruction',
          rights_status: 'restricted',
          enforcement_risk: 'low',
          rights_status_us: 'cleared',
          enforcement_risk_us: 'low',
          rights_status_eu: 'restricted',
          enforcement_risk_eu: 'low',
          source_note:
            'A film poster for a Soviet satire about officialdom, built from documents, stamps and a magnifying glass in place of a face. The state was, briefly, willing to mock its own paperwork — provided the joke stopped at the individual clerk and never reached the system issuing the forms. That limit is what makes the image useful now. Modern institutions run the same manoeuvre: a named official is disciplined, the process that produced them is described as sound. The poster shows a man who is entirely procedure, which is a more accurate portrait of public office than any of the heroic ones produced in the same decade.',
        },
      },

      {
        handle: 'productivity-is-patriotism',
        title: 'PRODUCTIVITY IS PATRIOTISM',
        skuBase: 'MAC-14-TS',
        price: PRICE,
        command: 'Productivity Is Patriotism',
        contradiction: 'Output targets have been revised.',
        mechanism: 'Labour reframed as combat. The enemy stays unnamed.',
        printAspect: '3/2',
        blanks: [BLACK],
        colourMap: { Black: { garment: '#1A1A18' } },
        sizes: SIZES_TS,
        soldOut: [],
        plates: [
          { file: 'productivity-recto.webp', alt: 'Productivity is patriotism, Black, recto' },
          { file: 'productivity-verso.webp', alt: 'Productivity is patriotism, Black, verso' },
        ],
        source: {
          id: '527271559508',
          original_title: '"Every blow of the hammer — a blow at the enemy!"',
          artist: 'Viktor Deni',
          year: '1920',
          origin: 'Soviet Russia',
          purpose: 'Militarise industrial labour',
          // No per-territory overrides on the live record: cleared everywhere.
          rights_status: 'cleared',
          enforcement_risk: 'low',
          source_note:
            'Deni recast factory work as a military act: each hammer strike lands on a caricatured enemy rather than on metal. The poster was aimed at workers who had no direct stake in the fighting, and it solved that problem by making the workplace itself a front. The construction survives intact in contemporary economic language, where output becomes a patriotic duty, competitiveness becomes a national security question, and a shortfall becomes something close to betrayal. The enemy in Deni’s image is drawn but never identified, which is precisely why the poster kept working after every specific enemy it referred to was gone.',
        },
      },
    ],
  },
];

let vid = 20000;

function specToCollection(entry: SpecEntry): RawCollection {
  return {
    handle: entry.series.handle,
    title: entry.series.title,
    descriptionHtml: '',
    metafields: [
      { key: 'series_no', value: entry.series.no },
      { key: 'status', value: entry.series.status },
      { key: 'issued', value: entry.series.issued },
    ],
    products: {
      edges: entry.items.map((it, i) => {
        const variants = it.blanks.flatMap((c) =>
          it.sizes.map((sz) => {
            const available = !it.soldOut.includes(sz);
            return {
              node: {
                id: `gid://shopify/ProductVariant/${++vid}`,
                title: `${c.name} / ${sz}`,
                /*
                 * The fulfilment SKU is issued by the supplier and is never
                 * rendered — the register shows the accession number, composed
                 * from `sku_base`. It is derived here rather than mirrored so
                 * this file never implies a supplier identifier it cannot keep
                 * current.
                 */
                sku: `${it.skuBase}-${c.name.slice(0, 2).toUpperCase()}-${sz}`,
                availableForSale: available,
                // Print-on-demand: stock is not counted, only offered.
                quantityAvailable: null,
                currentlyNotInStock: !available,
                price: { amount: it.price, currencyCode: CURRENCY },
                selectedOptions: [
                  { name: 'Color', value: c.name },
                  { name: 'Size', value: sz },
                ],
                image: null,
              },
            };
          }),
        );

        const node: RawProduct = {
          id: `gid://shopify/Product/${1001 + i}`,
          handle: it.handle,
          title: it.title,
          availableForSale: variants.some((v) => v.node.availableForSale),
          category: { name: 'T-Shirts' },
          priceRange: { minVariantPrice: { amount: it.price, currencyCode: CURRENCY } },
          images: {
            edges: it.plates.map((p) => ({
              node: { url: `/snapshot/${p.file}`, altText: p.alt },
            })),
          },
          options: [
            { name: 'Color', optionValues: it.blanks.map((c) => ({ name: c.name })) },
            { name: 'Size', optionValues: it.sizes.map((name) => ({ name })) },
          ],
          variants: { edges: variants },
          metafields: [
            { key: 'command', value: it.command, reference: null },
            { key: 'contradiction', value: it.contradiction, reference: null },
            { key: 'mechanism', value: it.mechanism, reference: null },
            { key: 'role', value: 'hero graphic', reference: null },
            { key: 'print_aspect', value: it.printAspect, reference: null },
            { key: 'colour_map', value: JSON.stringify(it.colourMap), reference: null },
            { key: 'sku_base', value: it.skuBase, reference: null },
            { key: 'spec', value: JSON.stringify(TSHIRT_SPEC), reference: null },
            {
              key: 'source',
              value: `gid://shopify/Metaobject/${it.source.id}`,
              reference: {
                type: 'source',
                fields: (Object.keys(it.source) as (keyof SpecSource)[])
                  .filter((k) => k !== 'id' && it.source[k] != null)
                  .map((k) => ({ key: k as string, value: it.source[k] as string })),
              },
            },
          ],
        };
        return { node };
      }),
    },
  };
}

/** Keyed by collection handle, so the fallback is per series. */
export const SNAPSHOT: Record<string, RawCollection> = Object.fromEntries(
  SPEC.map((e) => [e.series.handle, specToCollection(e)]),
);

export const snapshotCollection = (handle: string): RawCollection | null =>
  SNAPSHOT[handle] ?? null;
