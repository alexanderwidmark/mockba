# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Politically and historically engaged buyers: people drawn in by the propaganda-archive
angle itself, not streetwear shoppers. They come for the history, the rights framing,
and the contemporary parallel the garment draws — and read the item record as evidence
before they read it as a product page.

## Product Purpose

MOCKBA Art Collective sells a t-shirt series ("drop") whose graphics are reproductions
of real state-archive propaganda posters with a contemporary English intervention
printed underneath. The site presents itself as an institutional document — an archive
catalogue issued by an "Office of Public Information" — not a streetwear webshop.
Success is a visitor understanding the mechanism each piece exposes and, if they choose,
buying it through registers that read as evidentiary rather than promotional.

## Positioning

"This is an institution publishing evidence, not a brand selling merch." The mechanism
a neighboring shop could not truthfully copy: real archive sourcing paired with a
documented contemporary intervention, with rights status and enforcement risk disclosed
per item rather than hidden — which is also the reason the project can legally publish
this material at all.

## Operating Context

Live and sellable now: the Shopify Storefront API is configured, checkout runs through
the cart-permalink shortcut to Shopify's hosted checkout, and real orders happen today
(not an "interest only" pre-launch state). Fulfilment is via **Airventory**, store handle
`ebupet-y0.myshopify.com`, domain `mockba.org`, office mail `hello@mockba.org`.
Editorial content (series, items, sourcing, rights) lives entirely in Shopify
collection/product metafields and the `source` metaobject; the front end holds layout
and fixed section copy only. Rights are territorial (`_us` / `_eu` suffixed fields),
resolved by buyer country through the same function on both the page and the sale gate
in `app/actions.ts`, so published status and cart can never disagree.

Commercial settings, as configured in Shopify:

- Shop currency SEK, prices tax-inclusive, **VAT charged on shipping**. Shop is
  registered in Sweden.
- Catalogue price 470 SEK. The United States is priced exactly, not converted: the
  `United States — USD 49` price list holds a fixed **$49.00** on every live variant.
  A price list is per-variant, so **new variants are not covered until they are added
  to it** — this is the step most likely to be forgotten when a product is replaced.
- Shipping profile `MOCKBA: free in the US, flat elsewhere` — free to the US, flat
  99 SEK everywhere else. A fulfilment profile only ships from the locations in its
  own location group; a variant stocked elsewhere is unbuyable everywhere, which has
  caused a silent store-wide sell-out twice. Check the profile after any supplier change.
- Refund, shipping, privacy, legal and terms policies are all published.
- The blank and print method are settled: heavyweight 300g 100% cotton jersey, boxy
  fit, DTG, full front, S–2XL. Production is stated by the supplier as dispatching
  from Germany; the Shopify fulfilment location record carries the merchant's own
  Swedish address and is **not** evidence of where printing happens.

## Capabilities and Constraints

- Garment plates are **finished product photography from Shopify**, not composited on
  the front end. The site does not draw the silhouette or simulate print/ink — the
  supplier provides a finished garment photograph per product, and the site shows it
  as-is. This supersedes the design prototype's luminance-driven ink-simulation spec
  in `README.md`.
- Airventory supplies **flat garment photography only, recto and verso — no on-model
  mockups**. Which blank a plate shows and which face it is are read out of its alt
  text ("Public servant, Black, verso"); Shopify exposes no other per-image field, so
  the alt text is load-bearing, not decoration. An image whose alt text names no blank
  is treated as neutral. On-model imagery is an open item (Kive or similar).
- Variant SKUs are **Airventory identifiers** (`20261014190324-177819658`) and must not
  be changed or treated as the displayed accession number; the shown accession number
  is composed from the `mockba.sku_base` metafield plus blank and size.
- The live variant option is spelled **`Color`**; earlier suppliers used `Colour`. The
  normalisation layer matches either spelling on purpose — don't "fix" it to one.
- Series = Collection, Item = Product, Variant = Colour × Size, per the metafield
  contract in `README.md`. In use on the live catalogue: `command`, `contradiction`,
  `mechanism`, `role`, `colour_map`, `sku_base`, `source`. `garment_color` and
  `substrate` are read only as fallbacks and no live product sets them. `print_ink` and
  `print_aspect` are **read by nothing** — `print_aspect` in particular, despite the
  cropping rule in `README.md`, because the site shows supplied photography rather than
  composing a print area.
- The garment specification is not on the product. It comes from the `spec_template`
  metaobject for the product's Shopify category, so a medium is described once;
  `mockba.spec` overrides it per product. `lib/shopify/snapshot.ts` inlines the
  T-Shirts template because the template is fetched from the same API the snapshot
  exists to survive.
- Rights fields (`rights_status`, `enforcement_risk`, territorial variants) must stay
  visible in the item record and color-coded as specified — they are load-bearing for
  the right to publish archive material, not decoration.
- The Gelato app stays installed deliberately, for tote bags, even though no live
  product is fulfilled by it. Its draft products and delivery profiles are still in the
  store; don't read them as the current arrangement.
- Undecided, explicitly open: on-model imagery; EU OSS VAT treatment across member
  rates now that VAT applies to shipping as well as goods; confirmation that the VAT
  line on shipping appears correctly at checkout (the Cart API does not break out tax);
  and the hoodie, which is drafted and priced but not issued.

## Brand Commitments

- **IBM Plex Mono only.** No second family, no serif, no italics anywhere — both were
  tried and explicitly rejected.
- **`border-radius: 0` everywhere.** No gradients, no glows, no card shadows; the only
  shadow in the system is the garment drop-shadow pair.
- **Institutional register, not streetwear**: "catalogue of items", "item record",
  "accession", "register interest", "Office of Public Information" — never "drop" (as
  user-facing copy), "shop now", "notify me", "artifacts".
- **The site never explains what a work means** — only how it's made and why. A copy
  change that interprets the artwork for the reader is out of bounds.
- **The archive source and the MOCKBA intervention are recorded separately** everywhere
  they appear — never merged into one credit line.
- Name: MOCKBA Art Collective. Domain: mockba.org. Repo:
  https://github.com/alexanderwidmark/mockba.

## Evidence on Hand

- `README.md` — the full, literal design and content specification (screens, copy,
  tokens, state, Shopify content model). Treat as canonical except where this file
  records a superseding implementation fact (garment plates, above).
- `design/MOCKBA Drop 001.dc.html` — the original design reference prototype (not
  production code; its runtime must not be ported).
- `design/shopify.js` — the data-layer spec (GraphQL query, metafield contract,
  normalisation, snapshot fallback) that was ported into `lib/shopify`.
- `public/archive/src_*.jpg` — archive poster scans, including entries held in the
  register for series not yet published.
- `lib/shopify/snapshot.ts` + `public/snapshot/` — the offline fallback: a mirror of the
  live collection, plates included. It is what a build without Storefront credentials
  renders, so a Vercel preview without them shows this rather than the store. It must be
  brought back in line whenever the catalogue changes.
- No testimonials, press, or case studies exist or should be fabricated; the item
  record's evidentiary weight comes from the sourcing/rights metadata itself.

## Product Principles

1. Evidence over promotion — every register (copy, layout, rights disclosure) reads as
   an institution publishing findings, never as a brand pitching merch.
2. Method and sourcing are always in scope; meaning is never explained to the reader.
3. Provenance stays split — archive source credit and MOCKBA's intervention are always
   two separate lines, never one.
4. Rights transparency is a publishing precondition, not an afterthought — territorial
   rights/enforcement status must be visible and must gate the sale, not just describe it.
5. The front end is a layout and copy shell; Shopify (content) and Airventory
   (fulfilment, imagery) own the facts it renders.
