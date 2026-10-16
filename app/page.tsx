import HomeView from '@/components/HomeView';
import { isLive } from '@/lib/shopify/config';
import { getSeriesContext } from '@/lib/shopify/fetch';
import { getSources } from '@/lib/shopify/sources';
import Empty from '@/components/Empty';

/** The newest published series. */
export default async function Page() {
  const [{ series, all }, sources] = await Promise.all([getSeriesContext(), getSources()]);
  if (!series) return <Empty />;
  return <HomeView series={series} all={all} sources={sources} live={isLive()} />;
}
