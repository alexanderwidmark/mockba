import type { Metadata } from 'next';
import { IBM_Plex_Mono } from 'next/font/google';

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
        <WebAnalytics />
      </body>
    </html>
  );
}
