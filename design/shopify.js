/* eslint-disable */
(function () {
if (window.MOCKBA_SHOPIFY) return; // already evaluated
/**
 * MOCKBA — Shopify Storefront data layer
 * Loaded as a classic script so the snapshot is available synchronously on
 * first paint. The page seeds from the snapshot, then revalidates via the API.
 * ----------------------------------------------------------------------------
 * Shopify owns: series (collections), items (products), variants (colour ×
 * size, price, SKU, stock), source records (metaobjects) and rights status.
 * The page owns layout and editorial copy only.
 *
 * TO GO LIVE: fill in CONFIG. Nothing else changes.
 * The public Storefront token is read-only and safe to ship in the client.
 *
 * ── Shopify model ───────────────────────────────────────────────────────────
 * Series          = Collection, handle listed in CONFIG.seriesHandles
 *                   (newest first; the page shows a series index).
 * Item            = Product in that collection.
 * Variant         = Colour × Size. Colour drives the mockup, size is stock.
 * Source          = Metaobject `source`, referenced by one or more items.
 *
 * Collection metafields, namespace `mockba`:
 *   series_no        single_line_text   '001'
 *   status           single_line_text   'release candidate' | 'issued' | 'closed'
 *   issued           single_line_text   free text, e.g. '2026.01'
 *
 * Product metafields, namespace `mockba`:
 *   command          single_line_text   Layer 1 — the command
 *   contradiction    single_line_text   Layer 2 — the contradiction
 *   mechanism        single_line_text   one-line mechanism/context
 *   role             single_line_text   'hero graphic' | 'editorial'
 *   colour_map       json               { "Black": {"garment":"#1A1A18","ink":"#F1EDE3"} , … }
 *                                       per-colour garment + ink, so one item can
 *                                       ship on several blanks without a redeploy
 *   garment_color    single_line_text   hex fallback when colour_map is absent
 *   print_ink        single_line_text   hex fallback
 *   print_aspect     single_line_text   'w/h' of the print area, e.g. '3/4' or
 *                                       '3/2' — carries the SOURCE poster's own
 *                                       orientation so no artwork is cropped
 *   source           metaobject_reference -> type `source`
 *
 * Metaobject `source`:
 *   original_title, artist, year, origin, purpose, source_note,
 *   rights_status     'cleared' | 'research required' | 'restricted'
 *   enforcement_risk  'low' | 'medium' | 'high'
 *
 * rights_status and enforcement_risk stay separate so a restricted item can be
 * unpublished or region-gated without touching the artwork or the page.
 */

const CONFIG = {
  domain: '',                        // e.g. 'mockba.myshopify.com'
  token: '',                         // Storefront API public access token
  apiVersion: '2025-01',
  // Newest series first. Add a handle here when a new drop is created.
  seriesHandles: ['validation-drop-001'],
  cacheTtlMs: 5 * 60 * 1000,
};

const SERIES_QUERY = `
query Series($handle: String!) {
  collection(handle: $handle) {
    handle
    title
    descriptionHtml
    metafields(identifiers: [
      {namespace: "mockba", key: "series_no"},
      {namespace: "mockba", key: "status"},
      {namespace: "mockba", key: "issued"}
    ]) { key value }
    products(first: 24) {
      edges { node {
        id
        handle
        title
        availableForSale
        priceRange { minVariantPrice { amount currencyCode } }
        images(first: 3) { edges { node { url altText } } }
        options { name values }
        variants(first: 100) { edges { node {
          id
          title
          sku
          availableForSale
          quantityAvailable
          currentlyNotInStock
          price { amount currencyCode }
          selectedOptions { name value }
        } } }
        metafields(identifiers: [
          {namespace: "mockba", key: "command"},
          {namespace: "mockba", key: "contradiction"},
          {namespace: "mockba", key: "mechanism"},
          {namespace: "mockba", key: "role"},
          {namespace: "mockba", key: "colour_map"},
          {namespace: "mockba", key: "garment_color"},
          {namespace: "mockba", key: "print_ink"},
          {namespace: "mockba", key: "print_aspect"},
          {namespace: "mockba", key: "source"}
        ]) {
          key
          value
          reference { ... on Metaobject { type fields { key value } } }
        }
      } }
    }
  }
}`;

/* ── Cached snapshot ────────────────────────────────────────────────────────
 * Shaped exactly like the Storefront API response, but assembled from a compact
 * spec so a full colour × size variant matrix does not have to be written out
 * by hand. This is what the page renders from until CONFIG is filled in, and
 * what an edge cache holds afterwards. Edit items in Shopify, not here.
 */
const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'];

const SPEC = [
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

function specToCollection(entry) {
  return {
    handle: entry.series.handle,
    title: entry.series.title,
    descriptionHtml: '',
    metafields: [
      { key: 'series_no', value: entry.series.no },
      { key: 'status', value: entry.series.status },
      { key: 'issued', value: entry.series.issued },
    ],
    products: { edges: entry.items.map((it, i) => {
      const colourMap = {};
      it.colours.forEach(c => { colourMap[c.name] = { garment: c.garment, ink: c.ink }; });
      const variants = [];
      it.colours.forEach(c => SIZES.forEach(sz => {
        const available = !(it.soldOut || []).includes(sz);
        variants.push({ node: {
          id: 'gid://shopify/ProductVariant/' + (++vid),
          title: c.name + ' / ' + sz,
          sku: it.skuBase + '-' + c.name.slice(0, 2).toUpperCase() + '-' + sz,
          availableForSale: available,
          quantityAvailable: available ? 12 : 0,
          currentlyNotInStock: !available,
          price: { amount: it.price, currencyCode: 'USD' },
          selectedOptions: [ { name: 'Colour', value: c.name }, { name: 'Size', value: sz } ],
        } });
      }));
      return { node: {
        id: 'gid://shopify/Product/' + (1001 + i),
        handle: it.handle,
        title: it.title,
        availableForSale: variants.some(v => v.node.availableForSale),
        priceRange: { minVariantPrice: { amount: it.price, currencyCode: 'USD' } },
        images: { edges: [ { node: { url: it.poster, altText: it.source.original_title } } ] },
        options: [ { name: 'Colour', values: it.colours.map(c => c.name) }, { name: 'Size', values: SIZES } ],
        variants: { edges: variants },
        metafields: [
          { key: 'command', value: it.command, reference: null },
          { key: 'contradiction', value: it.contradiction, reference: null },
          { key: 'mechanism', value: it.mechanism, reference: null },
          { key: 'role', value: 'hero graphic', reference: null },
          { key: 'colour_map', value: JSON.stringify(colourMap), reference: null },
          { key: 'garment_color', value: it.colours[0].garment, reference: null },
          { key: 'print_ink', value: it.colours[0].ink, reference: null },
          { key: 'print_aspect', value: it.printAspect, reference: null },
          { key: 'source', value: 'gid://shopify/Metaobject/' + it.source.id, reference: { type: 'source', fields:
            Object.keys(it.source).filter(k => k !== 'id').map(k => ({ key: k, value: it.source[k] })) } },
        ],
      } };
    }) },
  };
}

const SNAPSHOT = {};
SPEC.forEach(e => { SNAPSHOT[e.series.handle] = { data: { collection: specToCollection(e) } }; });

/* ── Normalisation ─────────────────────────────────────────────────────────── */

const mf = (node, key) => (node.metafields || []).find(m => m && m.key === key) || null;
const mfv = (node, key, fallback = '') => { const m = mf(node, key); return m && m.value != null ? m.value : fallback; };

function readSource(node) {
  const ref = mf(node, 'source');
  const fields = ref && ref.reference && ref.reference.fields ? ref.reference.fields : [];
  const out = {};
  fields.forEach(f => { out[f.key] = f.value; });
  return out;
}

function readColourMap(node, fallbackGarment, fallbackInk) {
  let map = {};
  try { map = JSON.parse(mfv(node, 'colour_map', '{}')) || {}; } catch (e) { map = {}; }
  const opt = (node.options || []).find(o => /colour|color/i.test(o.name));
  const names = opt && opt.values.length ? opt.values : Object.keys(map);
  return (names.length ? names : ['Black']).map(name => {
    const rec = map[name] || {};
    return { name, garment: rec.garment || fallbackGarment, ink: rec.ink || fallbackInk };
  });
}

function optValue(variant, re) {
  const o = (variant.selectedOptions || []).find(x => re.test(x.name));
  return o ? o.value : '';
}

function formatMoney(amount, currency) {
  const n = Number(amount);
  const sym = currency === 'USD' ? '$' : currency === 'EUR' ? '\u20ac' : '';
  const body = Number.isInteger(n) ? String(n) : n.toFixed(2);
  return sym ? sym + body : body + ' ' + currency;
}

/** Flatten one Storefront product node into what the page renders. */
function normalizeProduct(node, i) {
  const src = readSource(node);
  const price = node.priceRange && node.priceRange.minVariantPrice;
  const img = node.images && node.images.edges && node.images.edges[0];
  const fallbackGarment = mfv(node, 'garment_color', '#1A1A18');
  const fallbackInk = mfv(node, 'print_ink', '#F1EDE3');
  const colours = readColourMap(node, fallbackGarment, fallbackInk);
  const sizeOpt = (node.options || []).find(o => /size/i.test(o.name));
  const sizeValues = sizeOpt && sizeOpt.values.length ? sizeOpt.values : SIZES;
  const artist = src.artist || 'Unknown';

  const variants = ((node.variants && node.variants.edges) || []).map(e => {
    const v = e.node;
    const colourName = optValue(v, /colour|color/i) || colours[0].name;
    const colour = colours.find(c => c.name === colourName) || colours[0];
    return {
      id: v.id,
      numericId: String(v.id).split('/').pop(),
      title: v.title,
      sku: v.sku || '',
      size: optValue(v, /size/i),
      colourName: colourName,
      garmentColor: colour.garment,
      printInk: colour.ink,
      available: !!v.availableForSale,
      qty: v.quantityAvailable == null ? null : v.quantityAvailable,
      priceAmount: v.price ? v.price.amount : (price ? price.amount : '0'),
      currency: v.price ? v.price.currencyCode : 'USD',
      price: v.price ? formatMoney(v.price.amount, v.price.currencyCode) : '',
    };
  });

  const first = variants.find(v => v.available) || variants[0] || null;

  return {
    no: String(i + 1).padStart(2, '0'),
    id: node.id,
    handle: node.handle,
    productTitle: node.title,
    title: mfv(node, 'command', node.title),
    secondary: mfv(node, 'contradiction'),
    mechanismLine: mfv(node, 'mechanism'),
    role: mfv(node, 'role', 'hero graphic'),
    price: price ? formatMoney(price.amount, price.currencyCode) : '',
    currency: price ? price.currencyCode : 'USD',
    availableForSale: !!node.availableForSale,
    poster: img ? img.node.url : '',
    posterAlt: img ? img.node.altText : node.title,
    // First-paint / card mockup values: the default variant's colour.
    garmentColor: first ? first.garmentColor : fallbackGarment,
    printInk: first ? first.printInk : fallbackInk,
    garmentName: first ? first.colourName : colours[0].name,
    printAspect: mfv(node, 'print_aspect', '3/4'),
    colours,
    sizeValues,
    sizes: sizeValues.length ? sizeValues[0] + '\u2013' + sizeValues[sizeValues.length - 1] : 'XS\u20133XL',
    variants,
    defaultVariantId: first ? first.id : null,
    sku: first && first.sku ? first.sku : String(node.id).split('/').pop(),
    sourceTitle: src.original_title || '',
    artist,
    sourceShort: artist.split('&')[0].trim().split(' ').pop(),
    year: src.year || '',
    origin: src.origin || '',
    purpose: src.purpose || '',
    sourceNote: src.source_note || '',
    rights: src.rights_status || 'research required',
    risk: src.enforcement_risk || 'low',
  };
}

function normalizeSeries(collection) {
  const meta = k => { const m = (collection.metafields || []).find(x => x && x.key === k); return m ? m.value : ''; };
  const edges = (collection.products && collection.products.edges) || [];
  return {
    handle: collection.handle,
    title: collection.title,
    seriesNo: meta('series_no'),
    status: meta('status') || 'release candidate',
    issued: meta('issued'),
    products: edges.map((e, i) => normalizeProduct(e.node, i)),
  };
}

/* ── Fetching ──────────────────────────────────────────────────────────────── */

async function fetchSeries(handle) {
  let payload = SNAPSHOT[handle] || SNAPSHOT[CONFIG.seriesHandles[0]];

  if (CONFIG.domain && CONFIG.token) {
    try {
      const res = await fetch(`https://${CONFIG.domain}/api/${CONFIG.apiVersion}/graphql.json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Storefront-Access-Token': CONFIG.token,
        },
        body: JSON.stringify({ query: SERIES_QUERY, variables: { handle } }),
      });
      const json = await res.json();
      if (json && json.data && json.data.collection) payload = json;
    } catch (e) {
      console.warn('[mockba] Storefront API unreachable, using cached snapshot.', e);
    }
  }
  return normalizeSeries(payload.data.collection);
}

/** Every series listed in CONFIG, newest first. Failures fall back per series. */
async function fetchAllSeries() {
  const out = [];
  for (const handle of CONFIG.seriesHandles) {
    try { out.push(await fetchSeries(handle)); } catch (e) { /* skip a dead handle */ }
  }
  return out.length ? out : snapshotSeries();
}

function snapshotSeries() {
  return CONFIG.seriesHandles
    .filter(h => SNAPSHOT[h])
    .map(h => normalizeSeries(SNAPSHOT[h].data.collection));
}

/** Back-compat: the first configured series only. */
async function fetchCatalog() {
  const s = await fetchSeries(CONFIG.seriesHandles[0]);
  return { title: s.title, products: s.products };
}

/**
 * Checkout without a Shopify theme: a cart permalink sends the buyer straight
 * to Shopify's hosted checkout. Flip an item from notify to sellable by
 * enabling the variant in Shopify — no deploy.
 */
function checkoutUrl(variantId, qty = 1) {
  if (!CONFIG.domain || !variantId) return null;
  return `https://${CONFIG.domain}/cart/${String(variantId).split('/').pop()}:${qty}`;
}
const isLive = () => !!(CONFIG.domain && CONFIG.token);

/* Exposed synchronously — the page seeds first paint from the snapshot. */
window.MOCKBA_SHOPIFY = {
  CONFIG, SERIES_QUERY, SNAPSHOT, SIZES,
  normalizeProduct, normalizeSeries, formatMoney,
  fetchSeries, fetchAllSeries, fetchCatalog, snapshotSeries, checkoutUrl, isLive,
  /** Normalize the cached snapshot without touching the network. */
  snapshotProducts() {
    const all = snapshotSeries();
    const s = all[0] || { title: '', products: [] };
    return { title: s.title, products: s.products };
  },
};

})();
