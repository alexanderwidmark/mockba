import HomeView from '@/components/HomeView';
import { isLive } from '@/lib/shopify/config';
import { getSeriesContext } from '@/lib/shopify/fetch';
import Empty from '@/components/Empty';

export const revalidate = 300;

/** The newest published series. */
export default async function Page() {
  const { series, all } = await getSeriesContext();
  if (!series) return <Empty />;
  return <HomeView series={series} all={all} live={isLive()} />;
}
