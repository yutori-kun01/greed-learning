import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'N8N MARKETING',
  description: '実践に直結する講座を体系的に学びましょう。',
}

import { ThemeProvider } from '@/components/ThemeProvider'
import { getSiteSettingsQuery } from '@/actions/settings'

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
          {settings && (
            <style dangerouslySetInnerHTML={{__html: `
              :root {
                ${settings.accentColor ? `--gold: ${settings.accentColor}; --gold2: ${settings.accentColor};` : ''}
              }
              body {
                background-image: ${settings.bgPattern === 'pattern2' ? 'url("/noise.png")' : 'none'};
                /* Implement other patterns as needed */
              }
            `}} />
          )}
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
