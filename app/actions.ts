'use server';

import { revalidatePath } from 'next/cache';

import { addLine, removeLine, updateLine } from '@/lib/shopify/cart';
import { sendContact, sendInterest, mailConfigured } from '@/lib/email';

export type ActionResult = { ok: boolean; message?: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/* ── Cart ─────────────────────────────────────────────────────────────────── */

export async function addToCart(variantId: string, quantity = 1): Promise<ActionResult> {
  if (!variantId) return { ok: false, message: 'No variant recorded.' };
  const cart = await addLine(variantId, quantity);
  if (!cart) return { ok: false, message: 'The cart could not be opened.' };
  revalidatePath('/cart');
  return { ok: true };
}

export async function setLineQuantity(lineId: string, quantity: number): Promise<void> {
  await updateLine(lineId, quantity);
  revalidatePath('/cart');
}

export async function dropLine(lineId: string): Promise<void> {
  await removeLine(lineId);
  revalidatePath('/cart');
}

/* ── Register of interest ─────────────────────────────────────────────────── */

export async function registerInterest(input: {
  email: string;
  itemNo: string;
  itemTitle: string;
  sku: string;
  variantTitle: string;
  seriesTitle: string;
  price: string;
}): Promise<ActionResult> {
  const email = input.email.trim();
  if (!EMAIL_RE.test(email)) return { ok: false, message: 'A valid address is required.' };

  if (!mailConfigured()) {
    // The office is not yet reachable; say so rather than claiming an entry.
    return { ok: false, message: 'The register is not open. Try again shortly.' };
  }

  const sent = await sendInterest({ ...input, email });
  return sent ? { ok: true } : { ok: false, message: 'The entry could not be recorded.' };
}

/* ── Correspondence ───────────────────────────────────────────────────────── */

export async function contactOffice(input: {
  email: string;
  subject: string;
  body: string;
}): Promise<ActionResult> {
  const email = input.email.trim();
  if (!EMAIL_RE.test(email)) return { ok: false, message: 'A valid address is required.' };
  if (!input.body.trim()) return { ok: false, message: 'A message is required.' };

  if (!mailConfigured()) {
    return { ok: false, message: 'The office is not reachable. Try again shortly.' };
  }

  const sent = await sendContact(email, input.subject.trim(), input.body.trim());
  return sent ? { ok: true } : { ok: false, message: 'The message could not be delivered.' };
}

/* Form-shaped wrappers, so the cart works with JavaScript disabled. */

export async function setLineQuantityForm(formData: FormData): Promise<void> {
  const lineId = String(formData.get('lineId') ?? '');
  const quantity = Number(formData.get('quantity') ?? 0);
  if (lineId) await setLineQuantity(lineId, quantity);
}

export async function dropLineForm(formData: FormData): Promise<void> {
  const lineId = String(formData.get('lineId') ?? '');
  if (lineId) await dropLine(lineId);
}
