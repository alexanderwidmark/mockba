# Instructions for Claude Code

You are picking up a completed design and building it for real. Read
`README.md` in this folder first — it is the full specification and is
self-sufficient.

## What this is

An institutional archive storefront for MOCKBA Art Collective, backed by
Shopify. `design/MOCKBA Drop 001.dc.html` is a **design reference prototype**
written for a bespoke HTML component runtime. It is not production code and its
runtime (`support.js`) must not be ported. Recreate the design in a real stack.

## Recommended stack

Next.js (App Router) + TypeScript + Shopify Storefront API, or Shopify Hydrogen
if the store is already on it. Styling: whatever the target repo uses. The
prototype is inline-styled because of its runtime; in production use the repo's
normal approach (CSS modules or Tailwind are both fine) — just keep the literal
values from the README.

## Task order

1. **Shopify content model** — collection metafields (`series_no`, `status`,
   `issued`), product metafields (`command`, `contradiction`, `mechanism`,
   `role`, `colour_map`, `garment_color`, `print_ink`, `print_aspect`,
   `source`), the `source` metaobject, and variant options Colour × Size. The
   README has the full table; `design/shopify.js` has the GraphQL query.
2. **Data layer** — port the normalisation functions from `design/shopify.js`
   to a typed server module. Keep the per-series snapshot fallback: one dead
   collection handle must not blank the page. Move the fetch server-side.
3. **Shell** — masthead, footer, paper background, mono type scale, hairline
   rules.
4. **Garment mockup component** — the clip-path silhouette, the print area, the
   luminance-driven ink simulation, the printed caption. Get this right before
   anything else; every other section is flat layout around it.
5. **Home sections** in README order, then the item record with variant
   selection.
6. **Routing** — `/series/{collection-handle}` and
   `/series/{handle}/{product-handle}`. The prototype uses in-page state; give
   items real URLs.
7. **Cart** — the README documents the cart-permalink shortcut. For production
   use the Cart API for a real multi-line cart.
8. **Entry animation last**, as pure enhancement.

## Non-negotiables

These are brand decisions already litigated with the client. Do not "improve"
them.

- **IBM Plex Mono only.** No second family, no serif, and **no italics
  anywhere** — both were tried and explicitly rejected.
- **`border-radius: 0` everywhere.** No gradients, no glows, no card shadows.
  The only shadow in the design is the garment drop-shadow pair.
- **Institutional register, not streetwear.** "Catalogue of items", "item
  record", "accession", "register interest", "Office of Public Information".
  Never "drop", "shop now", "notify me", "artifacts".
- **The site never explains what a work means** — only how the work is made and
  why. If a copy change would interpret the artwork for the reader, don't make
  it; the point is lost the moment it needs explaining. Method, sourcing,
  production and rights are all in scope.
- **Rights fields stay visible.** `rights_status` and `enforcement_risk` are
  separate fields, both surfaced in the item record, colour-coded per the README.
  They are why the project can publish archive material at all.
- **The archive source and the MOCKBA intervention are recorded separately**
  everywhere they appear. Never merge them into one credit line.
- **Grid rules go on cells, not containers.** Border-top/left on the container,
  border-right/bottom on each cell. A container background used as fake table
  rules makes empty tracks render as grey blocks at some viewport widths.
- **Layouts collapse without media queries** —
  `repeat(auto-fit, minmax(min(100%, Npx), 1fr))` throughout.
- **The resting DOM is the correct laid-out state.** Animation may only move
  elements from an offset to rest, transform-only. With JS disabled, reduced
  motion, print, or a background tab, nothing may be hidden or displaced.
- **No loading spinner.** The page paints from cached data and revalidates in
  the background.

## Verify before you hand back

- Both blank colours read correctly: the poster prints as ink on the bone blank
  (multiply) and as normal artwork screened back on the black blank. The
  luminance split in the README is required — multiply on a dark blank crushes
  the poster to black.
- Posters with `print_aspect: 3/2` are not cropped to `3/4`.
- Selecting a blank resets size to that colour's first available size; sizes
  unavailable in the chosen colour are struck through and inert.
- The item-record plate stays visible while metadata scrolls (one sticky wrapper
  around plate + caption — not two sticky siblings, which overlap).
- Every grid renders clean at 360px, 768px, 1280px and 1920px with no orphan
  rules or grey blocks.
- With JS disabled, all content is present and correctly positioned.
- The series index appears only when more than one series is published.

## Open questions to raise with the client

- Print method and blank supplier are `TBD after sample` in the spec table —
  confirm before launch copy is finalised.
- Production location is stated as confirmed at the same time as the blank.
- Return policy must be published before any payment is taken.
- Price is unfixed: `$49` / `$54` / `$59` are under validation, wired as a prop
  in the prototype. Decide whether that stays as a config value in production.
