import { notFound } from 'next/navigation';

import Empty from '@/components/Empty';
import HomeView from '@/components/HomeView';
import { isLive } from '@/lib/shopify/config';
import { getSeriesContext } from '@/lib/shopify/fetch';

/* Rendered per request so the price matches the buyer's market. */

export async function generateMetadata({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  const { series } = await getSeriesContext(handle);
  return { title: series ? `${series.title} — catalogue of items` : 'Series' };
}

export default async function Page({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  const { series, all } = await getSeriesContext(handle);
  if (!series && all.length) notFound();
  if (!series) return <Empty />;
  return <HomeView series={series} all={all} live={isLive()} />;
}
