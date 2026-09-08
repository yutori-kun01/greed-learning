import type { Metadata } from 'next'
import './globals.css'
import { ThemeProvider } from '@/components/ThemeProvider'
import { getSiteSettingsQuery } from '@/lib/queries/settings';

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettingsQuery();
  return {
    title: settings?.siteName || 'N8N MARKETING',
    description: '実践に直結する講座を体系的に学びましょう。',
  };
}

function getBgPatternCSS(pattern: string): string {
  const patterns: Record<string, string> = {
    pattern1: 'none',
    pattern2: 'url("/noise.png")',
    pattern3: 'linear-gradient(135deg, rgba(217,180,91,0.05) 0%, transparent 50%)',
    pattern4: 'repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(255,255,255,0.02) 35px, rgba(255,255,255,0.02) 70px)',
    pattern5: 'none', // Fallback if no specific pattern image
    pattern6: 'radial-gradient(circle at 20% 50%, rgba(217,180,91,0.06) 0%, transparent 50%)',
  };
  return patterns[pattern] || 'none';
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const settings = await getSiteSettingsQuery();
  const bgImageCSS = settings ? getBgPatternCSS(settings.bgPattern) : 'none';

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
                background-image: ${bgImageCSS};
              }
            `}} />
          )}
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
