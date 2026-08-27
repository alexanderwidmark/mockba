import Link from 'next/link';
import { notFound } from 'next/navigation';

import Masthead from '@/components/Masthead';
import { getPolicies, getPolicy } from '@/lib/shopify/policies';
import { getSeriesContext } from '@/lib/shopify/fetch';
import styles from './Policy.module.css';

export const revalidate = 300;

export async function generateStaticParams() {
  return (await getPolicies()).map((p) => ({ handle: p.handle }));
}

export async function generateMetadata({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  const policy = await getPolicy(handle);
  return { title: policy ? policy.title : 'Policy' };
}

export default async function PolicyPage({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  const [policy, policies, { series }] = await Promise.all([
    getPolicy(handle),
    getPolicies(),
    getSeriesContext(),
  ]);
  if (!policy) notFound();

  return (
    <>
      <Masthead series={series} />
      <section className={styles.section}>
        <div className={styles.eyebrow}>Office of Public Information</div>
        <h1 className={styles.heading}>{policy.title}</h1>

        {/* Authored in the Shopify admin; the checkout links to the same text. */}
        <div className={styles.body} dangerouslySetInnerHTML={{ __html: policy.body }} />

        {policies.length > 1 ? (
          <div className={styles.register}>
            {policies.map((p) => (
              <Link
                key={p.handle}
                href={`/policies/${p.handle}`}
                className={`${styles.registerItem} ${p.handle === policy.handle ? styles.current : ''}`}
                aria-current={p.handle === policy.handle ? 'page' : undefined}
              >
                {p.title}
              </Link>
            ))}
          </div>
        ) : null}
      </section>
    </>
  );
}
