# MOCKBA Art Collective — build and deployment

The design specification is `README.md`. This file covers running and shipping
the site only.

## Stack

Next.js 15 (App Router) · TypeScript · CSS Modules · Shopify Storefront API ·
Resend. No CSS framework: every value is literal from the specification, held in
`styles/tokens.css`.

## Run

```
npm install
cp .env.example .env.local   # fill in what you have
npm run dev
```

The site renders with no environment at all. `lib/shopify/snapshot.ts` holds a
build-time snapshot of Validation Drop 001, shaped exactly like the Storefront
response, and it is the per-series fallback in production: one dead collection
handle costs that series its freshness and nothing else.

## Getting the Storefront token

The app in the Dev Dashboard exposes a client id and secret rather than a static
Storefront token. Those exchange for a 24-hour Admin token, and one Admin call
turns that into a Storefront token that does not expire:

```
SHOPIFY_CLIENT_ID=... SHOPIFY_CLIENT_SECRET=... node scripts/mint-storefront-token.mjs
```

It prints `SHOPIFY_STOREFRONT_TOKEN=...` plus the scopes the app actually
granted, and names any that are missing. Put the token in Vercel and in
`.env.local`. It is a one-time step — there is nothing to refresh.

The site cannot run on the Admin token itself. The Cart API exists only in the
Storefront API, so checkout would be impossible.

Required scopes on the app:

| scope | what breaks without it |
|---|---|
| `unauthenticated_read_product_listings` | everything |
| `unauthenticated_read_product_inventory` | unit counts and struck-through sizes |
| `unauthenticated_read_metaobjects` | source notes, rights fields and artist credits go blank while the page still renders |
| `unauthenticated_write_checkouts` | the cart cannot open |

## Environment

| variable | effect |
|---|---|
| `SHOPIFY_STORE_DOMAIN` | Defaults to `ebupet-y0.myshopify.com`. With a token, flips the site to sellable. |
| `SHOPIFY_STOREFRONT_TOKEN` | Storefront API public access token. Read-only, but the query runs server-side; nothing is exposed to the browser. |
| `SHOPIFY_API_VERSION` | Defaults to `2026-07`. |
| `SHOPIFY_SERIES_HANDLES` | Collection handles, newest first, comma separated. The series index appears once there are two. |
| `RESEND_KEY` | Register of interest and correspondence. |
| `MAIL_FROM` | Defaults to `MOCKBA Art Collective <hello@mockba.org>`; the domain must be verified in Resend. |
| `MAIL_TO` | Defaults to `hello@mockba.org`. |
| `CTA_MODE` | `notify` (default) or `preorder`. |
| `SITE_URL` | Canonical origin, used for metadata. |

Without `SHOPIFY_*` the item record registers interest instead of selling.
Without `RESEND_KEY` the register says it is not open rather than claiming an
entry was made.

## Routes

| route | rendering |
|---|---|
| `/` | newest series, ISR 5 min |
| `/series/{handle}` | one series, ISR 5 min |
| `/series/{handle}/{product}` | item record, ISR 5 min |
| `/cart` | dynamic; cart id in an httpOnly cookie |
| `/contact` | correspondence with the office |
| `/api/cart/count` | cart badge in the masthead |

## Data layer

`lib/shopify/` is the port of the prototype's `design/shopify.js`, typed and
server-only:

- `query.ts` — one Storefront query per collection handle.
- `normalize.ts` — Storefront response to the models the pages render.
- `snapshot.ts` — the per-series fallback.
- `fetch.ts` — cached fetch with background revalidation. No loading state
  anywhere: a page paints from cached data and the network is never on the
  critical path.
- `cart.ts` — Cart API: create, add, update, remove, checkout handoff. The cart
  permalink from the spec stays available as `permalinkUrl` for single-item
  validation but is not what the site uses.

## Creating the content model

```
node scripts/create-content-model.mjs --dry-run   # print what it would create
node scripts/create-content-model.mjs
```

Creates the metaobject definition and all twelve metafield definitions from the
contract in README.md, with the exact namespace, keys and types the site reads,
and each one explicitly exposed to the Storefront API. A definition that exists
but is not exposed reads back as null, which is indistinguishable from a field
nobody filled in — so the exposure is set here rather than left to a checkbox.

Definitions only; the values are entered in the Shopify admin. Safe to run
again — anything already present is reported and skipped.

The app needs Admin API scopes for this, which are separate from the
`unauthenticated_*` scopes the site itself runs on:

| scope | for |
|---|---|
| `write_products` | product and collection metafield definitions |
| `write_metaobject_definitions` | the `source` metaobject |
| `read_metaobject_definitions` | checking whether it already exists |

Without them every call fails with "Access denied … API client to have access to
the namespace", and the metaobject reports as reserved for another application.
Check what the app actually holds at `/admin/oauth/access_scopes.json`.

## Checking the content model

```
node scripts/verify-content-model.mjs
```

Runs the site's own query against the store and reports, key by key, what is
present. It reads the query straight out of `lib/shopify/query.ts`, so the check
and the site can never drift apart.

It catches the failures that are silent in a browser — a `source` reference that
did not resolve, a `colour_map` missing a blank that the Colour option offers, a
`print_aspect` that is not in `w/h` form, variants with no SKU, inventory that
reports null on every variant. In each of those the page still renders and the
field is simply blank.

## Shopify content model

The contract is in `README.md`. In short: series = collection with `mockba`
metafields `series_no` / `status` / `issued`; item = product with `mockba`
metafields `command`, `contradiction`, `mechanism`, `role`, `colour_map`,
`garment_color`, `print_ink`, `print_aspect`, `source`; `source` is a metaobject;
variants are Colour × Size. Product image 1 is the archive poster scan, with the
original title as alt text.

## Deployment

Vercel. Only `SHOPIFY_STOREFRONT_TOKEN` and `RESEND_KEY` have to be set; the
rest default. Set them in the project, including for
Preview if previews should read the live store. `revalidate` is 5 minutes; a
Shopify webhook hitting an on-demand revalidation route can be added later — the
fetches are already tagged `series:{handle}`.

## Still open, from the specification

- Print method and blank supplier are `TBD after sample`; the spec table says so
  on the page.
- Production location is confirmed with the blank.
- The return policy must be published before any payment is taken.
- Price: the item record reads Shopify's variant price. The `$49 / $54 / $59`
  validation range is not wired as an override — change it in Shopify.
