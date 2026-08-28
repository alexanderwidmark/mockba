import { notFound } from 'next/navigation';

import ItemRecord from '@/components/ItemRecord';
import Masthead from '@/components/Masthead';
import SeriesIndex from '@/components/SeriesIndex';
import { isLive } from '@/lib/shopify/config';
import { getSeriesContext } from '@/lib/shopify/fetch';

/* Rendered per request so the price matches the buyer's market; the
   Storefront response behind it is cached per country. */

const preorder = (process.env.CTA_MODE ?? 'notify') === 'preorder';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ handle: string; product: string }>;
}) {
  const { handle, product } = await params;
  const { series } = await getSeriesContext(handle);
  const item = series?.products.find((p) => p.handle === product);
  if (!item) return { title: 'Item record' };
  return {
    title: `Item record ${item.no} · ${item.title}`,
    description: `${item.secondary} — ${item.mechanismLine}`,
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ handle: string; product: string }>;
}) {
  const { handle, product } = await params;
  const { series, all } = await getSeriesContext(handle);
  const item = series?.products.find((p) => p.handle === product);
  if (!series || !item) notFound();

  return (
    <>
      <Masthead series={series} />
      <SeriesIndex all={all} activeHandle={series.handle} />
      <ItemRecord
        item={item}
        seriesHandle={series.handle}
        seriesTitle={series.title}
        seriesStatus={series.status}
        siblings={series.products.map((p) => ({ handle: p.handle, title: p.title }))}
        live={isLive()}
        preorder={preorder}
      />
    </>
  );
}
