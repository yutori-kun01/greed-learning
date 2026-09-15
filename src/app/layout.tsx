import type { Metadata } from 'next'
import './globals.css'

import { ThemeProvider } from '@/components/ThemeProvider'
import {
  getSiteSettings,
  sanitizeAccentColor,
  sanitizeBgPattern,
  accentTextForLightTheme,
  DEFAULT_SITE_NAME,
} from '@/lib/siteSettings';

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  const siteName = settings?.siteName || DEFAULT_SITE_NAME;
  const description = '実践に直結する講座を体系的に学びましょう。';
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  return {
    // 相対URLのOG画像を絶対URLに解決するために必要。
    metadataBase: appUrl ? new URL(appUrl) : undefined,
    title: { default: siteName, template: `%s | ${siteName}` },
    description,
    openGraph: {
      type: 'website',
      siteName,
      title: siteName,
      description,
      images: settings?.logoUrl ? [settings.logoUrl] : undefined,
    },
    twitter: { card: 'summary', title: siteName, description },
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const settings = await getSiteSettings();
  const accentColor = sanitizeAccentColor(settings?.accentColor);
  const bgPattern = sanitizeBgPattern(settings?.bgPattern);

  return (
    <html lang="ja" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700&family=Cormorant+Garamond:wght@600&display=swap" rel="stylesheet" />
      </head>
      <body suppressHydrationWarning data-bg-pattern={bgPattern}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          {accentColor && (
            <style dangerouslySetInnerHTML={{ __html: `
              :root {
                --gold: ${accentColor};
                --gold-hi: ${accentColor};
                --gold-2: ${accentColor};
                --gold-graph: ${accentColor};
              }
              .light {
                --gold: ${accentColor};
                --gold-hi: ${accentColor};
                --gold-2: ${accentTextForLightTheme(accentColor)};
                --gold-graph: ${accentTextForLightTheme(accentColor, 3)};
              }
            `}} />
          )}
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
