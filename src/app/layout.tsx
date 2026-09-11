import type { Metadata } from 'next'
import './globals.css'

import { ThemeProvider } from '@/components/ThemeProvider'
import { getSiteSettingsQuery } from '@/lib/queries'

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettingsQuery();
  const siteName = settings?.siteName || 'N8N MARKETING';
  return {
    title: siteName,
    description: '実践に直結する講座を体系的に学びましょう。',
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const settings = await getSiteSettingsQuery();
  // Validated on save; re-checked here so a row written before that
  // validation existed cannot reach the page as raw CSS.
  const accentColor = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(settings?.accentColor || '')
    ? settings!.accentColor
    : null;

  return (
    <html lang="ja" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700&family=Cormorant+Garamond:wght@600&display=swap" rel="stylesheet" />
      </head>
      <body
        suppressHydrationWarning
        style={accentColor ? ({ '--gold': accentColor, '--gold-2': accentColor } as React.CSSProperties) : undefined}
      >
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
