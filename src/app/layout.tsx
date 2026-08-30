import type { Metadata } from 'next'
import './globals.css'

import { ThemeProvider } from '@/components/ThemeProvider'
import { getSiteSettingsQuery } from '@/actions/settings'

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

  return (
    <html lang="ja" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700&family=Cormorant+Garamond:wght@600&display=swap" rel="stylesheet" />
      </head>
      <body suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          {settings?.accentColor && (
            <style dangerouslySetInnerHTML={{ __html: `
              :root, .light {
                --gold: ${settings.accentColor};
                --gold-2: ${settings.accentColor};
              }
            `}} />
          )}
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
