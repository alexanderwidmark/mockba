import type { Metadata } from 'next';
import { IBM_Plex_Mono } from 'next/font/google';

import ConsentGate from '@/components/ConsentGate';
import Footer from '@/components/Footer';
import WebAnalytics from '@/components/WebAnalytics';
import '@/styles/globals.css';
import '@/styles/motion.css';

/* IBM Plex Mono only — weights 400/500/600, self-hosted at build time. */
const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  style: ['normal'],
  display: 'swap',
  variable: '--font-plex-mono',
});

export const metadata: Metadata = {
  title: {
    default: 'MOCKBA Art Collective — Office of Public Information',
    template: '%s · MOCKBA Art Collective',
  },
  description:
    'An archive catalogue issued by MOCKBA Art Collective. Historical propaganda, contemporary mechanisms. Every item records its archive source and the MOCKBA intervention separately.',
  metadataBase: process.env.SITE_URL ? new URL(process.env.SITE_URL) : undefined,
  /**
   * Google Merchant Center's claim on mockba.org. The token is not a secret —
   * it is served in the markup to anyone who asks — so it is kept here rather
   * than in an environment variable, where a rename would silently unclaim the
   * store the way a misspelled mail key once silently took both forms down.
   *
   * Merchant Center reads the home page. Every page carries it, which costs
   * nothing and means a future change to the home page cannot drop it.
   */
  verification: {
    google: 'a8-L5DMNYS5EHJBJltJouIkuxBj9PBC3-KWPokglEHM',
  },
  openGraph: {
    type: 'website',
    siteName: 'MOCKBA Art Collective',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={plexMono.variable}>
      <body>
        {children}
        <Footer />
        <ConsentGate />
        <WebAnalytics />
      </body>
    </html>
  );
}
