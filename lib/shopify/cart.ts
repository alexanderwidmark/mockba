import 'server-only';

import { cookies } from 'next/headers';

import { SHOPIFY_TOKEN, isLive, storefrontEndpoint } from './config';
import { formatMoney } from './normalize';

/**
 * A real multi-line cart via the Storefront Cart API. The cart id lives in an
 * httpOnly cookie; checkout hands off to Shopify's hosted checkout.
 *
 * The cart permalink documented in the spec (`/cart/{variantId}:{qty}`) stays
 * available as `permalinkUrl` for single-item validation, but it is not what
 * the site uses.
 */

const CART_COOKIE = 'mockba_cart';
const CART_TTL_DAYS = 30;

const CART_FRAGMENT = /* GraphQL */ `
  fragment CartParts on Cart {
    id
    checkoutUrl
    totalQuantity
    cost {
      subtotalAmount {
        amount
        currencyCode
      }
    }
    lines(first: 50) {
      edges {
        node {
          id
          quantity
          merchandise {
            ... on ProductVariant {
              id
              title
              sku
              price {
                amount
                currencyCode
              }
              selectedOptions {
                name
                value
              }
              product {
                title
                handle
              }
            }
          }
        }
      }
    }
  }
`;

type RawCartLine = {
  id: string;
  quantity: number;
  merchandise: {
    id: string;
    title: string;
    sku: string | null;
    price: { amount: string; currencyCode: string };
    selectedOptions: { name: string; value: string }[];
    product: { title: string; handle: string };
  };
};

type RawCart = {
  id: string;
  checkoutUrl: string;
  totalQuantity: number;
  cost: { subtotalAmount: { amount: string; currencyCode: string } };
  lines: { edges: { node: RawCartLine }[] };
};

export type CartLine = {
  id: string;
  quantity: number;
  variantId: string;
  variantTitle: string;
  sku: string;
  productTitle: string;
  productHandle: string;
  price: string;
  lineTotal: string;
};

export type Cart = {
  id: string;
  checkoutUrl: string;
  totalQuantity: number;
  subtotal: string;
  lines: CartLine[];
};

async function storefront<T>(query: string, variables: Record<string, unknown>): Promise<T | null> {
  if (!isLive()) return null;
  try {
    const res = await fetch(storefrontEndpoint(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': SHOPIFY_TOKEN,
      },
      body: JSON.stringify({ query, variables }),
      cache: 'no-store',
    });
    if (!res.ok) {
      console.warn(`[mockba] cart request failed: ${res.status}`);
      return null;
    }
    const json = (await res.json()) as { data?: T; errors?: { message: string }[] };
    if (json.errors?.length) {
      console.warn('[mockba] cart errors:', json.errors.map((e) => e.message).join('; '));
    }
    return json.data ?? null;
  } catch (err) {
    console.warn('[mockba] cart request threw', err);
    return null;
  }
}

function normalizeCart(raw: RawCart | null | undefined): Cart | null {
  if (!raw) return null;
  const currency = raw.cost.subtotalAmount.currencyCode;
  return {
    id: raw.id,
    checkoutUrl: raw.checkoutUrl,
    totalQuantity: raw.totalQuantity,
    subtotal: formatMoney(raw.cost.subtotalAmount.amount, currency),
    lines: (raw.lines?.edges ?? []).map(({ node }) => ({
      id: node.id,
      quantity: node.quantity,
      variantId: node.merchandise.id,
      variantTitle: node.merchandise.title,
      sku: node.merchandise.sku ?? '',
      productTitle: node.merchandise.product.title,
      productHandle: node.merchandise.product.handle,
      price: formatMoney(node.merchandise.price.amount, node.merchandise.price.currencyCode),
      lineTotal: formatMoney(
        Number(node.merchandise.price.amount) * node.quantity,
        node.merchandise.price.currencyCode,
      ),
    })),
  };
}

async function readCartId(): Promise<string | null> {
  const store = await cookies();
  return store.get(CART_COOKIE)?.value ?? null;
}

async function writeCartId(id: string): Promise<void> {
  const store = await cookies();
  store.set(CART_COOKIE, id, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: CART_TTL_DAYS * 24 * 60 * 60,
  });
}

async function clearCartId(): Promise<void> {
  const store = await cookies();
  store.delete(CART_COOKIE);
}

/** The current cart, or null when there is none (or the API is unconfigured). */
export async function getCart(): Promise<Cart | null> {
  const id = await readCartId();
  if (!id) return null;
  const data = await storefront<{ cart: RawCart | null }>(
    /* GraphQL */ `
      ${CART_FRAGMENT}
      query Cart($id: ID!) {
        cart(id: $id) {
          ...CartParts
        }
      }
    `,
    { id },
  );
  // A completed or expired cart comes back null: drop the stale cookie.
  if (data && data.cart === null) await clearCartId();
  return normalizeCart(data?.cart);
}

export async function addLine(variantId: string, quantity = 1): Promise<Cart | null> {
  const id = await readCartId();

  if (id) {
    const data = await storefront<{
      cartLinesAdd: { cart: RawCart | null; userErrors: { message: string }[] };
    }>(
      /* GraphQL */ `
        ${CART_FRAGMENT}
        mutation CartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
          cartLinesAdd(cartId: $cartId, lines: $lines) {
            cart {
              ...CartParts
            }
            userErrors {
              message
            }
          }
        }
      `,
      { cartId: id, lines: [{ merchandiseId: variantId, quantity }] },
    );
    const cart = normalizeCart(data?.cartLinesAdd.cart);
    if (cart) return cart;
    // The stored cart is gone; fall through and open a new one.
    await clearCartId();
  }

  const data = await storefront<{
    cartCreate: { cart: RawCart | null; userErrors: { message: string }[] };
  }>(
    /* GraphQL */ `
      ${CART_FRAGMENT}
      mutation CartCreate($lines: [CartLineInput!]!) {
        cartCreate(input: { lines: $lines }) {
          cart {
            ...CartParts
          }
          userErrors {
            message
          }
        }
      }
    `,
    { lines: [{ merchandiseId: variantId, quantity }] },
  );

  const cart = normalizeCart(data?.cartCreate.cart);
  if (cart) await writeCartId(cart.id);
  return cart;
}

export async function updateLine(lineId: string, quantity: number): Promise<Cart | null> {
  const id = await readCartId();
  if (!id) return null;

  if (quantity <= 0) return removeLine(lineId);

  const data = await storefront<{ cartLinesUpdate: { cart: RawCart | null } }>(
    /* GraphQL */ `
      ${CART_FRAGMENT}
      mutation CartLinesUpdate($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
        cartLinesUpdate(cartId: $cartId, lines: $lines) {
          cart {
            ...CartParts
          }
          userErrors {
            message
          }
        }
      }
    `,
    { cartId: id, lines: [{ id: lineId, quantity }] },
  );
  return normalizeCart(data?.cartLinesUpdate.cart);
}

export async function removeLine(lineId: string): Promise<Cart | null> {
  const id = await readCartId();
  if (!id) return null;

  const data = await storefront<{ cartLinesRemove: { cart: RawCart | null } }>(
    /* GraphQL */ `
      ${CART_FRAGMENT}
      mutation CartLinesRemove($cartId: ID!, $lineIds: [ID!]!) {
        cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
          cart {
            ...CartParts
          }
          userErrors {
            message
          }
        }
      }
    `,
    { cartId: id, lineIds: [lineId] },
  );
  return normalizeCart(data?.cartLinesRemove.cart);
}

/** The validation shortcut from the spec. Not used by the site's own CTA. */
export function permalinkUrl(variantId: string, qty = 1): string | null {
  const domain = process.env.SHOPIFY_STORE_DOMAIN;
  if (!domain || !variantId) return null;
  return `https://${domain}/cart/${String(variantId).split('/').pop()}:${qty}`;
}
