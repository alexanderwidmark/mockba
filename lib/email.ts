import 'server-only';

import { Resend } from 'resend';

/**
 * Outbound mail. The office is notified; the correspondent gets an
 * acknowledgement in the same register as the rest of the document.
 */

const KEY = process.env.RESEND_KEY ?? '';
const FROM = process.env.MAIL_FROM ?? 'MOCKBA Art Collective <hello@mockba.org>';
const OFFICE = process.env.MAIL_TO ?? 'hello@mockba.org';

export const mailConfigured = (): boolean => Boolean(KEY && OFFICE);

const client = () => (KEY ? new Resend(KEY) : null);

/** Plain text only — the acknowledgement is a notice, not a marketing email. */
async function send(to: string, subject: string, text: string, replyTo?: string) {
  const resend = client();
  if (!resend) {
    console.warn('[mockba] RESEND_KEY not set; mail not sent.');
    return false;
  }
  const { error } = await resend.emails.send({
    from: FROM,
    to,
    subject,
    text,
    ...(replyTo ? { replyTo } : {}),
  });
  if (error) {
    console.error('[mockba] mail failed', error);
    return false;
  }
  return true;
}

export type InterestRecord = {
  email: string;
  itemNo: string;
  itemTitle: string;
  sku: string;
  variantTitle: string;
  seriesTitle: string;
  price: string;
};

export async function sendInterest(record: InterestRecord): Promise<boolean> {
  const lines = [
    `Series      ${record.seriesTitle}`,
    `Item        ${record.itemNo} · ${record.itemTitle}`,
    `Accession   ${record.sku}`,
    `Variant     ${record.variantTitle}`,
    `Price       ${record.price}`,
    `Address     ${record.email}`,
  ].join('\n');

  const notified = await send(
    OFFICE,
    `Interest registered — ${record.itemNo} ${record.itemTitle}`,
    `An entry has been made in the register of interest.\n\n${lines}\n`,
    record.email,
  );

  await send(
    record.email,
    `Entered in the register — ${record.itemTitle}`,
    [
      'MOCKBA Art Collective — Office of Public Information',
      '',
      'Your interest has been entered in the register.',
      '',
      lines,
      '',
      'You will be notified when the series is issued, with the dispatch window',
      'stated at that point. Nothing is dispatched and no payment is taken until',
      'physical samples pass review.',
      '',
      'Original source and MOCKBA intervention are recorded separately in the item',
      'record.',
      '',
      'mockba.org',
    ].join('\n'),
  );

  return notified;
}

export async function sendContact(from: string, subject: string, body: string): Promise<boolean> {
  return send(
    OFFICE,
    `Correspondence — ${subject || 'no subject stated'}`,
    [`From        ${from}`, `Subject     ${subject || '—'}`, '', body].join('\n'),
    from,
  );
}
