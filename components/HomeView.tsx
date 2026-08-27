import Catalogue from './Catalogue';
import EntryMotion from './EntryMotion';
import Masthead from './Masthead';
import PublicNotes from './PublicNotes';
import SeriesIndex from './SeriesIndex';
import SourceRegister from './SourceRegister';
import Statement from './Statement';
import TitleBlock from './TitleBlock';
import type { Series } from '@/lib/shopify/types';

export default function HomeView({
  series,
  all,
  live,
}: {
  series: Series;
  all: Series[];
  live: boolean;
}) {
  const hero = series.products[0];

  return (
    <>
      <Masthead series={series} />
      <SeriesIndex all={all} activeHandle={series.handle} />
      {hero ? <TitleBlock series={series} hero={hero} live={live} /> : null}
      <Catalogue series={series} live={live} />
      <Statement />
      <SourceRegister items={series.products} />
      <PublicNotes status={series.status} sizes={hero?.sizes ?? 'XS–3XL'} />
      <EntryMotion />
    </>
  );
}
