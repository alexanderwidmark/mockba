import HomeView from '@/components/HomeView';
import { isLive } from '@/lib/shopify/config';
import { getSeriesContext } from '@/lib/shopify/fetch';
import Empty from '@/components/Empty';

/** The newest published series. */
export default async function Page() {
  const { series, all } = await getSeriesContext();
  if (!series) return <Empty />;
  return <HomeView series={series} all={all} live={isLive()} />;
}
