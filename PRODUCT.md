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
(not an "interest only" pre-launch state). Fulfilment is via Gelato, store handle
`ebupet-y0.myshopify.com`, domain `mockba.org`, office mail `hello@mockba.org`.
Editorial content (series, items, sourcing, rights) lives entirely in Shopify
collection/product metafields and the `source` metaobject; the front end holds layout
and fixed section copy only. Rights are territorial (`_us` / `_eu` suffixed fields),
resolved by buyer country through the same function on both the page and the sale gate
in `app/actions.ts`, so published status and cart can never disagree.

## Capabilities and Constraints

- Garment plates are **finished product photography from Shopify**, not composited on
  the front end. The site does not draw the silhouette or simulate print/ink — Gelato
  supplies a finished garment mockup per product (and per variant, when a blank needs
  its own plate), and the site shows it as-is. This supersedes the design prototype's
  luminance-driven ink-simulation spec in `README.md`.
- Variant SKUs are Gelato UUIDs and must not be changed or treated as the displayed
  accession number; the shown accession number is composed from the `mockba.sku_base`
  metafield plus blank and size.
- Gelato may rename the `Colour` variant option to `Color`; the normalisation layer
  matches either spelling on purpose — don't "fix" it to one spelling.
- Series = Collection, Item = Product, Variant = Colour × Size, per the metafield
  contract in `README.md` (`command`, `contradiction`, `mechanism`, `role`,
  `colour_map`/`garment_color`, `print_ink`, `print_aspect`, `source`).
- Rights fields (`rights_status`, `enforcement_risk`, territorial variants) must stay
  visible in the item record and color-coded as specified — they are load-bearing for
  the right to publish archive material, not decoration.
- Undecided, explicitly open: print method and blank supplier (`TBD after sample`),
  production location (confirmed alongside the blank), return policy (must be published
  before any payment is taken — currently taking payment, so this is an open gap, not a
  future one), and catalogue price (`$49`/`$54`/`$59` under validation — the catalogue
  price note was deliberately dropped from the UI, per recent history, while this stays
  unresolved).

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
- `design/src_*.jpg` — archive poster scans for items 01–04, plus additional scans
  held for future series not yet published.
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
5. The front end is a layout and copy shell; Shopify (content) and Gelato (fulfilment,
   imagery) own the facts it renders.
