import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import RootLayoutClient from './RootLayoutClient';
import PWAInstaller from '@/components/PWAInstaller';
import NotificationManager from '@/components/NotificationManager';

const inter = Inter({ subsets: ['latin'] });

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.jobmeter.app';
const siteName = 'JobMeter';
const defaultTitle = 'JobMeter - Find Your Dream Job';
const defaultDescription = 'AI-powered job discovery and matching platform. Get personalized job recommendations, match scores, and apply to jobs that fit your skills and preferences.';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: defaultTitle,
    template: `%s | ${siteName}`,
  },
  description: defaultDescription,
  keywords: [
    'job search',
    'job matching',
    'career',
    'employment',
    'job opportunities',
    'AI job matching',
    'job recommendations',
    'job application',
    'career platform',
    'job finder',
  ],
  authors: [{ name: 'JobMeter' }],
  creator: 'JobMeter',
  publisher: 'JobMeter',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: siteUrl,
    siteName: siteName,
    title: defaultTitle,
    description: defaultDescription,
    images: [
      {
        url: `${siteUrl}/og-image.png`,
        width: 1200,
        height: 630,
        alt: 'JobMeter - AI-powered job discovery platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: defaultTitle,
    description: defaultDescription,
    images: [`${siteUrl}/og-image.png`],
    creator: '@jobmeterapp',
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'JobMeter',
  },
  formatDetection: {
    telephone: false,
  },
  viewport: 'width=device-width, initial-scale=1, maximum-scale=5',
  alternates: {
    canonical: siteUrl,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="admaven-placement" content="Bqjw8rHw7" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://qyuzuooxenyjqnjplrya.supabase.co" />
        
        {/* Ezoic Privacy Scripts - Must be loaded first */}
        <script data-cfasync="false" src="https://cmp.gatekeeperconsent.com/min.js" />
        <script data-cfasync="false" src="https://the.gatekeeperconsent.com/cmp.min.js" />
        
        {/* Ezoic Header Script */}
        <script async src="//www.ezojs.com/ezoic/sa.min.js" />
        <script dangerouslySetInnerHTML={{
          __html: `
            window.ezstandalone = window.ezstandalone || {};
            ezstandalone.cmd = ezstandalone.cmd || [];
          `
        }} />
        
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-315B0S5RGE"></script>
        <script dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-315B0S5RGE');
          `
        }} />
      </head>
      <body className={inter.className}>
        <RootLayoutClient>{children}</RootLayoutClient>
        <PWAInstaller />
        <NotificationManager />
      </body>
    </html>
  );
}