/**
 * Build-time snapshot of the series, shaped exactly like the Storefront
 * response and assembled from a compact spec so a full colour × size variant
 * matrix does not have to be written out by hand.
 *
 * This is the per-series fallback: one dead collection handle must not blank
 * the page. It is also what renders before Shopify is configured at all.
 * Edit items in Shopify, not here.
 */

import type { RawCollection, RawProduct } from './types';
import { SIZES } from './normalize';

type SpecColour = { name: string; garment: string; ink: string };

type SpecSource = {
  id: string;
  original_title: string;
  artist: string;
  year: string;
  origin: string;
  purpose: string;
  rights_status: string;
  enforcement_risk: string;
  source_note: string;
};

type SpecItem = {
  handle: string;
  title: string;
  skuBase: string;
  price: string;
  poster: string;
  command: string;
  contradiction: string;
  mechanism: string;
  printAspect: string;
  colours: SpecColour[];
  soldOut: string[];
  source: SpecSource;
};

type SpecEntry = {
  series: { handle: string; title: string; no: string; status: string; issued: string };
  items: SpecItem[];
};

const SPEC: SpecEntry[] = [
  { series: { handle: 'validation-drop-001', title: 'Validation Drop 001', no: '001', status: 'release candidate', issued: '2026.01' },
    items: [
      { handle: 'drain-the-swamp', title: 'Drain the Swamp', skuBase: 'MCK-001-SWP', price: '54.00', poster: 'src_lenin_sweep.jpg',
        command: 'Drain the Swamp', contradiction: 'Every revolution starts here.',
        mechanism: 'The promise of a clean sweep never specifies who is swept.',
        printAspect: '3/4',
        colours: [ { name: 'Black', garment: '#1A1A18', ink: '#F1EDE3' }, { name: 'Bone', garment: '#E8E3D6', ink: '#171512' } ],
        soldOut: ['XS', '3XL'],
        source: { id: '3001',
          original_title: '"Comrade Lenin cleanses the earth of filth"',
          artist: 'V. Lenin & Nikolai Cheremnykh', year: '1920', origin: 'Soviet Russia',
          purpose: 'Celebrate the revolutionary purge', rights_status: 'cleared', enforcement_risk: 'low',
          source_note: 'A lithograph issued in the first years of Soviet rule, showing Lenin sweeping crowned heads, priests and capitalists off the surface of the globe. It was distributed as celebration: the old order removed, the ground cleared for something better. The image is included here because the promise it makes has proven completely portable. Every political movement that has since promised to clear out a corrupt establishment has reused the same structure — a sweep, a clean surface, an unnamed category of filth. What the poster never contains is a definition of who qualifies. That vacancy is the mechanism, and it is refilled every election cycle.' } },

      { handle: 'public-servant', title: 'Public Servant', skuBase: 'MCK-002-PSV', price: '54.00', poster: 'src_functionary.jpg',
        command: 'Public Servant', contradiction: 'Private interests.',
        mechanism: 'The apparatus outlives every official inside it.',
        printAspect: '3/4',
        colours: [ { name: 'Black', garment: '#1A1A18', ink: '#F1EDE3' } ],
        soldOut: ['XS'],
        source: { id: '3002',
          original_title: '"State Functionary"',
          artist: 'Dmitry Kordysh', year: '1930', origin: 'Soviet Union',
          purpose: 'Satirise the obstructive bureaucrat', rights_status: 'research required', enforcement_risk: 'medium',
          source_note: 'A film poster for a Soviet satire about officialdom, built from documents, stamps and a magnifying glass in place of a face. The state was, briefly, willing to mock its own paperwork — provided the joke stopped at the individual clerk and never reached the system issuing the forms. That limit is what makes the image useful now. Modern institutions run the same manoeuvre: a named official is disciplined, the process that produced them is described as sound. The poster shows a man who is entirely procedure, which is a more accurate portrait of public office than any of the heroic ones produced in the same decade.' } },

      { handle: 'productivity-is-patriotism', title: 'Productivity Is Patriotism', skuBase: 'MCK-003-PRD', price: '54.00', poster: 'src_hammeranvil.jpg',
        command: 'Productivity Is Patriotism', contradiction: 'Output targets have been revised.',
        mechanism: 'Labour reframed as combat. The enemy stays unnamed.',
        printAspect: '3/2',
        colours: [ { name: 'Bone', garment: '#E8E3D6', ink: '#171512' }, { name: 'Black', garment: '#1A1A18', ink: '#F1EDE3' } ],
        soldOut: ['XXL', '3XL'],
        source: { id: '3003',
          original_title: '"Every blow of the hammer — a blow at the enemy!"',
          artist: 'Viktor Deni', year: '1920', origin: 'Soviet Russia',
          purpose: 'Mobilise industrial labour as warfare', rights_status: 'cleared', enforcement_risk: 'low',
          source_note: 'Deni recast factory work as a military act: each hammer strike lands on a caricatured enemy rather than on metal. The poster was aimed at workers who had no direct stake in the fighting, and it solved that problem by making the workplace itself a front. The construction survives intact in contemporary economic language, where output becomes a patriotic duty, competitiveness becomes a national security question, and a shortfall becomes something close to betrayal. The enemy in Deni\u2019s image is drawn but never identified, which is precisely why the poster kept working after every specific enemy it referred to was gone.' } },

      { handle: 'freedom-requires-loyalty', title: 'Freedom Requires Loyalty', skuBase: 'MCK-004-LYL', price: '54.00', poster: 'src_army.jpg',
        command: 'Freedom Requires Loyalty', contradiction: 'Non-compliance indicates disloyalty.',
        mechanism: 'Unity asserted as fact so that dissent reads as defect.',
        printAspect: '3/4',
        colours: [ { name: 'Black', garment: '#1A1A18', ink: '#F1EDE3' } ],
        soldOut: [],
        source: { id: '3004',
          original_title: '"The People and the Army Are One"',
          artist: 'Unknown', year: '1988', origin: 'Soviet Union',
          purpose: 'Assert unity between citizen and military', rights_status: 'research required', enforcement_risk: 'low',
          source_note: 'Issued three years before the state that printed it ceased to exist, this poster declares an identity between the population and its armed forces. The claim is not argued, it is stated — and that grammatical choice is the whole device. If the people and the army are already one, then disagreeing with the army is not a political position but a malfunction in the people. The formulation reappears wherever criticism of a military, a police force or a security service is answered as an insult to the nation itself. The date matters: the unity was announced most loudly at the point it was least true.' } },
    ] },
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
        const colourMap: Record<string, { garment: string; ink: string }> = {};
        for (const c of it.colours) colourMap[c.name] = { garment: c.garment, ink: c.ink };

        const variants = it.colours.flatMap((c) =>
          SIZES.map((sz) => {
            const available = !(it.soldOut || []).includes(sz);
            return {
              node: {
                id: `gid://shopify/ProductVariant/${++vid}`,
                title: `${c.name} / ${sz}`,
                sku: `${it.skuBase}-${c.name.slice(0, 2).toUpperCase()}-${sz}`,
                availableForSale: available,
                quantityAvailable: available ? 12 : 0,
                currentlyNotInStock: !available,
                price: { amount: it.price, currencyCode: 'USD' },
                selectedOptions: [
                  { name: 'Colour', value: c.name },
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
          priceRange: { minVariantPrice: { amount: it.price, currencyCode: 'USD' } },
          images: { edges: [{ node: { url: `/archive/${it.poster}`, altText: it.source.original_title } }] },
          options: [
            { name: 'Colour', optionValues: it.colours.map((c) => ({ name: c.name })) },
            { name: 'Size', optionValues: SIZES.map((name) => ({ name })) },
          ],
          variants: { edges: variants },
          metafields: [
            { key: 'command', value: it.command, reference: null },
            { key: 'contradiction', value: it.contradiction, reference: null },
            { key: 'mechanism', value: it.mechanism, reference: null },
            { key: 'role', value: 'hero graphic', reference: null },
            { key: 'colour_map', value: JSON.stringify(colourMap), reference: null },
            { key: 'garment_color', value: it.colours[0]?.garment ?? '#1A1A18', reference: null },
            { key: 'sku_base', value: it.skuBase, reference: null },
            { key: 'spec', value: JSON.stringify([
                { k: 'garment', v: 'Heavyweight 220g' },
                { k: 'fabric', v: '100% combed cotton' },
                { k: 'fit', v: 'Boxy / relaxed' },
                { k: 'print', v: 'DTG' },
                { k: 'placement', v: 'Full front' },
              ]), reference: null },
            {
              key: 'source',
              value: `gid://shopify/Metaobject/${it.source.id}`,
              reference: {
                type: 'source',
                fields: (Object.keys(it.source) as (keyof SpecSource)[])
                  .filter((k) => k !== 'id')
                  .map((k) => ({ key: k as string, value: it.source[k] })),
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
