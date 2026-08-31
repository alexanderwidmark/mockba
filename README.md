# Handoff: MOCKBA Art Collective — archive storefront (Drop 001)

## Overview

A Shopify-backed storefront for MOCKBA Art Collective: a t-shirt series ("drop")
whose graphics are reproductions of real state-archive propaganda posters with a
contemporary English intervention printed underneath. The site is deliberately
**not** a streetwear webshop. It presents itself as an institutional document —
an archive catalogue issued by an "Office of Public Information" — and commerce
is expressed in that register (a *catalogue of items*, *item records*,
*accession numbers*, *register interest*).

Two views:
1. **Document / home** — masthead, title block with a document register, catalogue
   of items, statement of purpose, register of sources, notes for the public.
2. **Item record** — one product: garment plate, variant selection (blank colour ×
   size), price, CTA, spec table, source note, metadata register.

The design brief that must survive implementation, in one line: **this is an
institution publishing evidence, not a brand selling merch.**

## About the design files

`design/MOCKBA Drop 001.dc.html` is a **design reference prototype**, not
production code. It is written for an internal HTML component runtime
(`support.js`, a template + logic-class layer) that you should **not** port. The
task is to **recreate this design in the target codebase** using its own
framework and conventions — Next.js/Hydrogen + React is the natural fit for a
Shopify front end. Read the HTML for exact markup, styling values and copy;
re-express it idiomatically.

Two things ARE worth porting nearly verbatim:

- **`design/shopify.js`** — the data layer. Its Storefront GraphQL query,
  metafield contract and normalisation functions are the real spec for how
  Shopify content maps to the page. Reuse the shape; move the fetch server-side.
- **The four JPGs** — the archive poster scans used by the mockups. In production
  these come from Shopify product images; they are included so the prototype runs
  offline.

`support.js` is included only so the prototype opens in a browser. Ignore it.

## Fidelity

**High fidelity.** Colours, typography, spacing, borders, copy and interaction
states are final and intentional. Recreate pixel-accurately. Every value below is
literal — the prototype uses inline styles only, no CSS classes, no tokens file.

## Screens / views

### 1. Masthead (persistent, both views)

`position: sticky; top: 0; z-index: 90`, background `#EFECE3`, bottom border
`1px solid #1A1A17`. A `grid` of `repeat(auto-fit, minmax(min(100%, 220px), 1fr))`
so cells stack on narrow viewports. Each cell: `padding: 12px 20px`, right border
`1px solid #CFC9BA` (last cell none). Type: IBM Plex Mono, `10px`,
`letter-spacing: 1.6px`, `text-transform: uppercase`.

Cells, left to right:
1. `MOCKBA Art Collective` — `#1A1A17`, `font-weight: 600`, clickable → home.
2. `Office of Public Information` — `#6B675C`.
3. `Series {series_no} / {status}` — `#6B675C`, from collection metafields.
4. `Revision {issued}` — `#6B675C`.

### 2. Series index (conditional)

Rendered **only when more than one series is published**. A flex row directly
under the masthead, bottom border `1px solid #1A1A17`, cells `padding: 10px 20px`
with right border `1px solid #CFC9BA`, mono `10px` / `1.6px` uppercase. Label
cell `Series index` in `#5F5A4E`. Each series cell reads
`{title} · {n} items`; the active one has background `#DCD5C4` and ink `#1A1A17`,
inactive `#EFECE3` / `#6B675C`. Clicking switches the active series and returns
to home.

### 3. Home — title block

Bottom border `1px solid #1A1A17`. Grid
`repeat(auto-fit, minmax(min(100%, 460px), 1fr))`: text column left, plate right.

**Text column** — `padding: 7vh 4vw 6vh`, right border `1px solid #CFC9BA`,
flex column centred vertically.

- Eyebrow: `Issued by MOCKBA Art Collective · Moscow archive series` — mono `10px`,
  `letter-spacing: 3px`, uppercase, `#6B675C`, `margin-bottom: 30px`.
- Thesis, two lines, `clamp(24px, 3.4vw, 50px)`, `line-height: 1.14`,
  `letter-spacing: -0.02em`, `font-weight: 500`, `margin-bottom: 26px`:
  `Historical propaganda,` / `contemporary mechanisms.`
  Each line is wrapped in an `overflow: hidden` block containing an inner block —
  that pair exists for the entry animation (see Interactions).
- Framing paragraph, `max-width: 500px`, `14px`, `line-height: 1.85`, `#45423A`,
  `margin-bottom: 38px`:
  "The archive is not used as nostalgia or as ideological merchandise. It is
  treated as evidence. The political systems change; the mechanisms are remarkably
  persistent."
- **Document register** — top border `1px solid #1A1A17`, `max-width: 560px`. Each
  row is a grid `122px 1fr`, `gap: 14px`, `padding: 11px 0`, bottom border
  `1px solid #CFC9BA`. Key: mono `9.5px`, `1.6px`, uppercase, `#6B675C`,
  `padding-top: 2px`. Value: mono `11.5px`, `#1A1A17`. Rows:
  | key | value |
  |---|---|
  | series | `{collection title} · no. {series_no}` |
  | extent | `{n} items · full-front print, printed on demand` |
  | sources | `State archive posters, 1920–1988` |
  | status | `{status} · checkout open` when the Storefront API is configured, else `{status} · interest registered only` |
- Text link, `padding-top: 22px`: `Consult the catalogue of items →` — mono `11px`,
  `letter-spacing: 2.2px`, uppercase, `#1A1A17`, `border-bottom: 1px solid #1A1A17`,
  `padding-bottom: 3px`. Hover: both colour and border → `#6B675C`. Smooth-scrolls
  to the catalogue (`target.offsetTop - 44`).

**Plate column** — background `#DCD5C4`, `padding: 6vh 3vw 4vh`, centred column.
Absolute corner label `Plate I` at `top: 18px; left: 20px`, mono `9px`,
`letter-spacing: 2px`, uppercase, `#5F5A4E`. Garment mockup at `width: 80%`,
`max-width: 470px`, `aspect-ratio: 4/5`, clickable → item record 01. Below it a
rule (`width: 80%`, top border `1px solid #CFC9BA`, `margin-top: 26px`) with
`Item {no} · {title}` left and `{sku}` right, mono `10px` / `1.4px` uppercase
`#6B675C`, `justify-content: space-between`, wrapping.

### 4. The garment mockup (used in three places)

The single most distinctive component. Structure:

- **Silhouette** — an absolutely positioned div filling the box, shaped with
  `clip-path: polygon(35% 0%, 65% 0%, 65% 7%, 88% 6%, 100% 26%, 84% 37%, 74% 29%,
  74% 100%, 26% 100%, 26% 29%, 16% 37%, 0% 26%, 12% 6%, 35% 7%)`, filled with the
  selected variant's garment colour, and lifted off the panel with
  `filter: drop-shadow(0 0 0.6px rgba(26,26,23,0.55)) drop-shadow(0 3px 7px rgba(26,26,23,0.16))`.
- **Print area** — absolutely positioned `top: 17%; left: 50%; width: 52%;
  transform: translateX(-50%)`. Inside: the poster image at
  `aspect-ratio: {print_aspect}` (from metafield — `3/4`, `3/2`, etc., so no
  artwork is cropped), `object-fit: cover`, then an overlay of
  `repeating-linear-gradient(0deg, rgba(0,0,0,0.11) 0 1px, transparent 1px 2px)`
  with `mix-blend-mode: multiply` for the halftone/screen texture.
- **Ink simulation** — depends on garment luminance, computed from the hex
  (`0.299R + 0.587G + 0.114B`, normalised; threshold `0.5`):
  - light blank: `mix-blend-mode: multiply`, `opacity: 0.95`,
    `filter: contrast(1.04)`, image background = garment colour.
  - dark blank: `mix-blend-mode: normal`, `opacity: 0.92`,
    `filter: contrast(1.06) brightness(1.12) saturate(1.04)`, image background
    `#14130F`. (Multiply on a dark blank crushes the poster to black — hence the
    split. Keep this logic.)
- **Printed caption** — centred under the print, `padding-top: 10px` (8px on cards).
  Title: `clamp(12px, 1.3vw, 16px)`, `line-height: 1.25`, `letter-spacing: 0.01em`,
  `font-weight: 600`, uppercase, in the variant's ink colour. Secondary: mono
  `clamp(9px, 0.9vw, 11px)`, `letter-spacing: 1px`, in a derived sub-ink
  (`#5C574C` when ink is the near-black `#171512`, else `#B9B4A8`),
  `margin-top: 6px` (5px on cards).

### 5. Home — catalogue of items

`padding: 8vh 4vw 10vh`, bottom border `1px solid #1A1A17`, `id="drop"`.

Header: grid `repeat(auto-fit, minmax(min(100%, 300px), 1fr))`, `gap: 12px 30px`,
`align-items: end`, `margin-bottom: 40px`, `padding-bottom: 16px`, bottom border
`1px solid #1A1A17`. Heading `Catalogue of items — {series title}`,
`clamp(18px, 2.1vw, 30px)`, `line-height: 1.2`, `letter-spacing: -0.01em`,
`font-weight: 500`. Right: price note, mono `10px` / `1.6px` uppercase `#6B675C` —
`usd test price · {price} stated · public price not yet fixed`, or
`preorder · {price} · charged on issue` in preorder mode.

Grid: `repeat(auto-fit, minmax(290px, 1fr))` with `border-top` and `border-left`
`1px solid #CFC9BA`; **each card carries `border-right` + `border-bottom`**. (Do
not fake rules with a container background — empty tracks then render as grey
blocks.)

Each card: background `#EFECE3`, flex column, clickable → item record.

- **Plate** — `aspect-ratio: 4/5`, background `#DCD5C4`, centred, `overflow: hidden`.
  Corner label `Fig. {no}` at `top: 13px; left: 14px`, mono `9px` / `2px` uppercase
  `#5F5A4E`. Garment mockup at `width: 86%`.
- **Body** — `padding: 22px 22px 24px`, top border `1px solid #CFC9BA`, `flex: 1`.
  - `Item {no} · {sku}` — mono `9.5px` / `1.8px` uppercase `#6B675C`, `mb 12px`.
  - Title `17px`, `line-height: 1.25`, `letter-spacing: -0.01em`, `font-weight: 500`.
  - Contradiction line `12.5px`, `line-height: 1.6`, `#45423A`, `mb 16px`.
  - Metadata grid `62px 1fr`, `gap: 4px 12px`, mono `10.5px` `#45423A`; keys mono
    `9px` / `1.4px` uppercase `#5F5A4E`: **source** (artist surname), **year**,
    **blanks** (colour names joined with ` · `), **stock**
    (`{k} of {n} variants available` / `all variants sold out`).
  - Mechanism paragraph `12.5px`, `line-height: 1.8`, `#45423A`, `flex: 1`, `mb 20px`.
  - Footer row: `padding-top: 14px`, top border `1px solid #CFC9BA`,
    `space-between`. Price mono `14px` `#1A1A17`. Button `Register interest` —
    mono `9.5px` / `1.8px` uppercase, `padding: 9px 15px`, `border: 1px solid #1A1A17`;
    hover inverts to background `#1A1A17` / ink `#EFECE3`.

### 6. Home — statement of purpose

`padding: 9vh 4vw`, bottom border `1px solid #1A1A17`. Grid
`repeat(auto-fit, minmax(min(100%, 320px), 1fr))`, `gap: 40px 60px`.

Left: eyebrow `Statement of purpose` (mono `10px` / `3px` uppercase `#6B675C`,
`mb 26px`), then the lead at `clamp(16px, 1.7vw, 25px)`, `line-height: 1.5`,
`letter-spacing: -0.005em`, `text-wrap: pretty`:

> MOCKBA Art Collective uses historical propaganda to examine contemporary
> propaganda. The political systems change. The enemies change. The distribution
> channels change. The mechanisms persist.

Right (`max-width: 620px`): two paragraphs at `13.5px`, `line-height: 1.9`,
`#45423A`, then a callout — `border-left: 2px solid {accent}`, `padding-left: 16px`,
mono `11.5px` / `1.6px` uppercase `#1A1A17`: `Yesterday's propaganda. Today's
infrastructure.`

### 7. Home — register of sources

`padding: 9vh 4vw`, bottom border `1px solid #1A1A17`. Eyebrow `Register of
sources`. List container top border `1px solid #1A1A17`; each row grid
`repeat(auto-fit, minmax(min(100%, 280px), 1fr))`, `gap: 18px 40px`,
`padding: 26px 0`, bottom border `1px solid #CFC9BA`.

Left: `Item {no} · {title}` (mono `9.5px` / `1.8px` uppercase `#5F5A4E`, `mb 10px`);
original title `14.5px`, `line-height: 1.6`, `#1A1A17`, `mb 14px`; metadata grid
`68px 1fr`, `gap: 4px 12px`, mono `11px` `#45423A` — **artist**, **year**,
**origin**, **purpose**. Right: the long source note, `13px`,
`line-height: 1.9`, `#45423A`.

### 8. Home — notes for the public

`padding: 9vh 4vw`. Eyebrow `Notes for the public`. Container top border
`1px solid #1A1A17`, `max-width: 1000px`. Each entry: bottom border
`1px solid #CFC9BA`, `padding: 22px 0`, grid
`repeat(auto-fit, minmax(min(100%, 260px), 1fr))`, `gap: 12px 40px`. Question
`14px`, `line-height: 1.6`, `#1A1A17`, `font-weight: 500`; answer `13px`,
`line-height: 1.9`, `#45423A`.

Six entries, in order — full copy is in the prototype's logic class (`faqs`):
what MOCKBA is · whether these are original posters · the garment · where it is
produced · when it will be issued · returns and sizing.

**Editorial rule, and it is a brand rule, not a preference:** these notes explain
**how the work is made and why**, never what a work means. A question that
interprets the artwork must not be added back. If the message needs explaining,
the point is lost.

### 9. Item record

Back link bar: `padding: 14px 4vw`, bottom border `1px solid #CFC9BA`, mono `10px`
/ `1.8px` uppercase `#6B675C`, hover `#1A1A17`:
`← Return to the catalogue of items`.

Body grid `repeat(auto-fit, minmax(min(100%, 430px), 1fr))`, bottom border
`1px solid #1A1A17`.

**Left plate panel** — background `#DCD5C4`, `padding: 54px 3vw 4vh`,
`min-height: 74vh`, `align-items: center; justify-content: flex-start`. Corner
label `Fig. {no} — recto, {colour} cotton`. Inside, **one** `position: sticky;
top: 90px` wrapper (`width: 82%`, `max-width: 500px`, flex column, `gap: 18px`)
holding the garment mockup (`width: 100%`, `aspect-ratio: 4/5`) and the caption
(top border `1px solid #CFC9BA`, `padding-top: 12px`, mono `10px` / `1.4px`
uppercase `#6B675C`): `Reproduced from archive source · print imperfections
retained`. Sticky must be on the shared wrapper — not on the two children
separately, which lets them overlap.

**Right column** — `padding: 6vh 4vw`, left border `1px solid #CFC9BA`.

- `Item record {no} / 04 · {sku}` — mono `10px` / `2.4px` uppercase `#6B675C`, `mb 22px`.
- H1 command line — `clamp(24px, 2.9vw, 42px)`, `line-height: 1.14`,
  `letter-spacing: -0.02em`, `font-weight: 500`, `mb 8px`.
- Contradiction — `clamp(13px, 1.2vw, 16px)`, `line-height: 1.6`, `#45423A`, `mb 32px`.
- **Variant selection** — `padding-top: 20px`, top border `1px solid #1A1A17`, `mb 26px`:
  - Label `Blank`, mono `9.5px` / `2px` uppercase `#5F5A4E`, `mb 10px`.
  - Colour chips: flex, `gap: 8px`, `mb 22px`. Each chip `padding: 8px 13px 8px 9px`,
    `border: 1px solid` — `#1A1A17` selected, `#CFC9BA` unselected; ink `#1A1A17` /
    `#6B675C`. Mono `10px` / `1.6px` uppercase. Contains a `14px` square swatch with
    `border: 1px solid #B4AE9E` filled with the garment hex.
  - Row: label `Size` left; stock status right — mono `9.5px` / `1.6px` uppercase,
    `#4F6B3F` when available, `#8A1E14` when not. Text: `available · {qty} units
    recorded` / `sold out in this size` / `no variant recorded`.
  - Size register: grid `repeat(auto-fit, minmax(44px, 1fr))`, `border-top` +
    `border-left` `1px solid #CFC9BA`; each cell `border-right` + `border-bottom`,
    `padding: 11px 6px`, centred, mono `11px`, `letter-spacing: 1.4px`. Selected:
    background `#1A1A17`, ink `#EFECE3`. Available: `#EFECE3` / `#1A1A17`.
    Unavailable: ink `#8B8578`, `text-decoration: line-through`, click is a no-op.
- Price row: `align-items: baseline`, `gap: 14px`, `mb 24px`. Price mono `24px`
  `#1A1A17`; caption mono `9.5px` / `1.8px` uppercase `#5F5A4E` — `usd · {variant
  title}` when sellable, `usd · charged when the series is issued` in preorder mode,
  else `usd test price · not yet fixed`.
- CTA: inline-block, mono `11px`, `letter-spacing: 2.4px`, uppercase,
  `padding: 16px 30px`, `border: 1px solid #1A1A17`, ink `#1A1A17`; hover inverts
  to `#1A1A17` / `#EFECE3`. Label by state:
  - live Storefront + variant in stock → `Add to cart — {price}` (opens the cart
    permalink in a new tab)
  - variant sold out → `Sold out · register interest`
  - preorder mode → `Reserve this item` / `Reservation recorded`
  - default → `Register interest in this item` / `Interest recorded`
- Acknowledgement panel (after registering interest): `border: 1px solid #1A1A17`,
  `padding: 18px 20px`, `mb 30px`. Eyebrow `Entered in the register`; prompt
  "Which item would you acquire at the stated price?" (`13px`, `line-height: 1.75`);
  then a wrapping row of item chips (border-top/left on the row, border-right/bottom
  on each chip, `padding: 10px 14px`, mono `9.5px` / `1.2px` uppercase `#45423A`,
  hover inverts).
- Spec table: grid `repeat(auto-fit, minmax(150px, 1fr))`, border-top/left on the
  grid and border-right/bottom on each cell, `margin: 30px 0`, cells
  `padding: 13px 15px`. Key mono `9px` / `1.8px` uppercase `#5F5A4E`, `mb 6px`;
  value mono `11.5px` `#1A1A17`. Rows: garment `Heavyweight 220g` · fabric
  `100% combed cotton` · fit `Boxy / relaxed` · print `DTG, TBD after sample` ·
  placement `Full front` · sizes `{range}`.
- Source note: eyebrow `Source note`; original title `14.5px`, `line-height: 1.6`,
  `#1A1A17`, `mb 12px`; note `13.5px`, `line-height: 1.9`, `#45423A`,
  `max-width: 580px`, `mb 30px`.
- Metadata register: grid `96px 1fr`, `gap: 5px 14px`, mono `11px` `#45423A`,
  `padding-top: 22px`, top border `1px solid #1A1A17`. Keys mono `9px` / `1.4px`
  uppercase `#5F5A4E`: **artist**, **year**, **origin**, **accession** (SKU),
  **variant** (variant title), **series**, **rights**. The rights value reads
  `{rights_status} / {enforcement_risk} enforcement risk` and is colour-coded:
  `cleared` → `#4F6B3F`, `research required` → `#8A6A16`, restricted → `#8A1E14`.

### 10. Footer

`padding: 22px 4vw`, top border `1px solid #1A1A17`, flex wrap `gap: 10px 30px`,
mono `10px` / `1.6px` uppercase `#6B675C`; first item `#1A1A17`. Items:
`MOCKBA Art Collective` · `mockba.org` · `Original source and MOCKBA intervention
recorded separately` · `Contact the office`.

## Interactions & behaviour

- **Navigation** is in-page state, not routing, in the prototype. In production give
  each item a real route: `/series/{collection-handle}` and
  `/series/{handle}/{product-handle}`. Returning home scrolls to top.
- **Entry animation** (GSAP in the prototype; any equivalent is fine) — deliberately
  restrained: a document being set down, not a product launch. `ease: expo.out`,
  **transform only, never opacity or layout**.
  - Thesis lines: `yPercent: 106 → 0`, `duration: 1`, `stagger: 0.09`, masked by the
    `overflow: hidden` wrapper.
  - Framing paragraph: `y: 12 → 0`, `0.7s`, delay `0.3`.
  - Document register: `y: 12 → 0`, `0.7s`, delay `0.44`.
  - Hero plate: `y: 22 → 0`, `1s`, delay `0.1`.
  - Catalogue cards: `y: 22 → 0`, `0.8s`, on scroll (`start: 'top 88%'`, once),
    `delay: (i % 4) * 0.06`.
  - **Hard requirement:** the resting DOM must already be the correct, visible,
    laid-out state. Animation may only move elements *from* an offset *to* rest, so
    that with JS disabled, reduced motion, print, or a background tab, nothing is
    hidden or displaced. In React, prefer CSS transitions/`@keyframes` on mount over
    an imperative timeline.
- **Variant selection** — choosing a blank resets the size to that colour's first
  available size and clears any "interest recorded" state. Sizes unavailable in the
  chosen colour are struck through and inert. The garment plate, price, SKU, variant
  title and stock line all re-derive from the selected variant.
- **Hover** — outline buttons and chips invert (`#1A1A17` / `#EFECE3`); text links
  fade to `#6B675C`. No transforms, no shadows, no scale.
- **Responsive** — every multi-column layout is
  `repeat(auto-fit, minmax(min(100%, Npx), 1fr))`, so columns collapse without media
  queries. Rules live on grid **cells** (border-right/bottom) with border-top/left on
  the container, so partially filled rows never show orphan lines.
- No loading spinner by design: the page paints from a build-time snapshot and
  revalidates against the API in the background. Keep that — in Next.js it becomes
  ISR/server-rendered data with a cached fallback.

## State management

| state | purpose |
|---|---|
| `series[]` | all published series, newest first; seeded from snapshot, replaced after revalidation |
| `seriesIdx` | active series |
| `view` | `home` \| `detail` (becomes routing in production) |
| `idx` | active item within the series |
| `colour` | selected blank; `null` = product default |
| `size` | selected size; `null` = first available in the chosen colour |
| `notified` | interest/reservation acknowledged for the current item |

Derived per render, not stored: the resolved variant, colour/size option models,
stock label, CTA label, price caption, masthead labels. Data fetching: one
Storefront GraphQL query per collection handle, with a snapshot fallback per
series so one dead handle cannot blank the page.

## Shopify content model

This is the contract. Everything editorial lives in Shopify; the front end holds
layout and the fixed section copy only.

**Series = Collection.** Handles listed newest-first in config. Metafields,
namespace `mockba`: `series_no` (`'001'`), `status`
(`release candidate` | `issued` | `closed`), `issued` (`'2026.01'`).

**Item = Product** in that collection. Metafields, namespace `mockba`:

| key | type | role |
|---|---|---|
| `command` | single_line_text | layer 1 — the command (the display title) |
| `contradiction` | single_line_text | layer 2 — the contradiction |
| `mechanism` | single_line_text | one-line mechanism/context on the card |
| `role` | single_line_text | `hero graphic` \| `editorial` |
| `colour_map` | json | `{ "Black": {"garment":"#1A1A18","ink":"#F1EDE3"}, … }` — per-blank garment + ink, so one work ships on several blanks with no deploy |
| `garment_color` | single_line_text | hex fallback when `colour_map` is absent |
| `print_ink` | single_line_text | hex fallback |
| `print_aspect` | single_line_text | `w/h` of the print area, carrying the source poster's own orientation so nothing is cropped |
| `source` | metaobject_reference | → `source` |

**Variant = Colour × Size.** Colour drives the mockup; size is stock. SKU pattern
`MCK-{item}-{COMMAND-ABBR}-{CO}-{SIZE}`, e.g. `MCK-001-SWP-BL-M`. Sizes XS–3XL.

**Metaobject `source`:** `original_title`, `artist`, `year`, `origin`, `purpose`,
`source_note`, `rights_status` (`cleared` | `research required` | `restricted`),
`enforcement_risk` (`low` | `medium` | `high`). The two rights fields stay separate
so a restricted item can be unpublished or region-gated without touching artwork.

**Rights are territorial.** `rights_status` and `enforcement_risk` may each be
overridden per territory with `_us` and `_eu` suffixed fields —
`rights_status_us`, `enforcement_risk_us`, `rights_status_eu`,
`enforcement_risk_eu`. The buyer's country selects the territory (`eu` is the
life+70 bloc: EEA, UK and Switzerland); anywhere else reads the unsuffixed
field, which must therefore hold the most restrictive status that applies
anywhere. The same poster can be out of term in one market and in copyright in
another — a 1920 work is clear in the US on the 95-year rule while a joint
author who died in 1962 keeps a European term running to 2032.

The territory fields are optional and the model is backward compatible: a source
with only the base fields behaves exactly as before. Where a territory value is
present the item record names it (`cleared in the US / low enforcement risk`);
where it is not, the value is shown unqualified rather than dressed up as a
territorial finding. The sale gate in `app/actions.ts` resolves the same fields
through the same function the page uses, so the published status and the cart
can never disagree about one item.

Product images: image 1 is the archive poster scan used for the print. Alt text
carries the original title.

**Checkout** without a Shopify theme: cart permalink
`https://{domain}/cart/{variantNumericId}:{qty}` → Shopify's hosted checkout. In
production prefer the Cart API for a real cart; the permalink is the validation
shortcut. `domain` + Storefront public access token flip the whole site from
"register interest" to sellable — the read-only public token is safe in the client,
but move the query server-side anyway.

## Design tokens

Colours:

| value | use |
|---|---|
| `#EFECE3` | paper / page background |
| `#DCD5C4` | plate panel (garment stage) |
| `#E6E2D6` | lighter panel, legacy — avoid |
| `#1A1A17` | primary ink, hairline rules, inverted button fill |
| `#45423A` | body copy |
| `#5F5A4E` | plate/fig labels, table keys |
| `#6B675C` | mono secondary, eyebrows |
| `#8B8578` | disabled (struck-through sizes) |
| `#CFC9BA` | hairline rule, secondary borders |
| `#B4AE9E` | swatch border |
| `#14130F` | print backing on dark blanks |
| `#8A1E14` | accent (oxblood) / restricted / out of stock |
| `#8A6A16` | rights: research required |
| `#4F6B3F` | rights: cleared / in stock |
| `#171512` | dark ink on light blanks |
| `#F1EDE3` | light ink on dark blanks |
| `#E8E3D6` | bone blank |
| `#1A1A18` | black blank |

Typography: **IBM Plex Mono** only — weights 400 / 500 / 600. No serif, no second
family, and **no italics anywhere** (both were tried and rejected).

- Display: `clamp(24px, 3.4vw, 50px)` / `1.14` / `-0.02em` / 500
- Item H1: `clamp(24px, 2.9vw, 42px)` / `1.14` / `-0.02em` / 500
- Section heading: `clamp(18px, 2.1vw, 30px)` / `1.2` / `-0.01em` / 500
- Lead: `clamp(16px, 1.7vw, 25px)` / `1.5` / `-0.005em`
- Card title: `17px` / `1.25` / `-0.01em` / 500
- Body: `13–14px` / `1.85–1.9`
- Small body: `12.5–13px` / `1.8–1.9`
- Label (mono caps): `9–11.5px`, `letter-spacing 1.4–3px`, uppercase
- Price: `14px` (card) / `24px` (item record)

Geometry: **`border-radius: 0` everywhere.** Hairlines are `1px`. Spacing runs on
`vh`/`vw` section padding (`7–9vh` block, `4vw` inline) and a `4 / 6 / 8 / 10 / 12 /
14 / 18 / 22 / 26 / 30 / 38 / 40px` step scale. The only shadow in the design is the
garment drop-shadow pair above — no card shadows, no gradients, no glows.

Also present in the prototype as adjustable props: `testPrice` (`$49` / `$54` /
`$59`, overrides catalogue price during price validation), `ctaMode`
(`notify` / `preorder`), `accent` (default `#8A1E14`).

## Assets

`design/src_lenin_sweep.jpg`, `src_functionary.jpg`, `src_hammeranvil.jpg`,
`src_army.jpg` — scans of archive posters, used as the print artwork for items
01–04 respectively. Prototype-only: production reads product image 1 from Shopify.
Other scans exist in the source project (`src_allpower`, `src_motherland`,
`src_traitor`, `src_warloan`, `src_deathray`, `src_arsenel`, `src_theeleventh`,
`src_pod_voditelstvom`, `src_usprotest`) for future series.

Fonts: IBM Plex Mono, Google Fonts, weights 400/500/600. Self-host in production.

Rights: each item's `rights_status` / `enforcement_risk` must be surfaced in the
item record, as specified. Do not drop these fields — they are the reason the
project can publish archive material.

## Files

- `design/MOCKBA Drop 001.dc.html` — the full design reference (both views).
- `design/shopify.js` — Storefront query, metafield contract, normalisation,
  snapshot fallback, checkout permalink. **Port this logic.**
- `design/support.js` — prototype runtime only. Ignore.
- `design/src_*.jpg` — archive poster scans.

## Suggested build order

1. Shopify content model: collection metafields, product metafields, the `source`
   metaobject, variant options Colour × Size.
2. Port `shopify.js` normalisation to a typed server module; query per collection
   handle; keep the per-series fallback.
3. Static shell: masthead, footer, paper background, mono type scale, hairline rules.
4. The garment mockup component (silhouette, print area, luminance-driven ink
   simulation, printed caption) — everything else is flat layout around it.
5. Home sections in order, then the item record with variant selection.
6. Cart/checkout, then the entry animation last, as pure enhancement.
