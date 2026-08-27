'use client';

import { useState, useTransition } from 'react';

import { contactOffice } from '@/app/actions';
import styles from './ContactForm.module.css';

export default function ContactForm() {
  const [pending, startTransition] = useTransition();
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const data = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await contactOffice({
        email: String(data.get('email') ?? ''),
        subject: String(data.get('subject') ?? ''),
        body: String(data.get('body') ?? ''),
      });
      if (res.ok) setSent(true);
      else setError(res.message ?? 'The message could not be delivered.');
    });
  };

  return (
    <section className={styles.section}>
      <div className={styles.eyebrow}>Contact the office</div>
      <div className={styles.grid}>
        <div>
          <p className={styles.lead}>
            Correspondence on sourcing, rights, production and press is handled by the Office
            of Public Information.
          </p>
          <p className={styles.para}>
            Rights enquiries should state the item accession number. Each item records its
            archive source and its MOCKBA intervention separately; both are stated in the item
            record.
          </p>
        </div>

        {sent ? (
          <div className={styles.form}>
            <div className={styles.eyebrow}>Entered in the correspondence register</div>
            <p className={styles.para}>
              Your message has been received. The office replies to the address stated.
            </p>
          </div>
        ) : (
          <form className={styles.form} onSubmit={onSubmit}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="email">
                Address for reply
              </label>
              <input
                className={styles.input}
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="subject">
                Subject
              </label>
              <input className={styles.input} id="subject" name="subject" type="text" />
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="body">
                Message
              </label>
              <textarea className={styles.textarea} id="body" name="body" required />
            </div>
            <button type="submit" className={styles.submit} disabled={pending}>
              Submit to the office
            </button>
            {error ? <div className={`${styles.status} ${styles.error}`}>{error}</div> : null}
          </form>
        )}
      </div>
    </section>
  );
}
