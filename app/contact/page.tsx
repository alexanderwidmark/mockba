import ContactForm from '@/components/ContactForm';
import Masthead from '@/components/Masthead';
import { getSeriesContext } from '@/lib/shopify/fetch';

export const revalidate = 300;

export const metadata = { title: 'Contact the office' };

export default async function ContactPage() {
  const { series } = await getSeriesContext();
  return (
    <>
      <Masthead series={series} />
      <ContactForm />
    </>
  );
}
