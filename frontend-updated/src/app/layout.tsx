import type { Metadata, Viewport } from 'next'
import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '@fontsource/instrument-serif/400-italic.css'
import '@fontsource/instrument-serif/400.css'
import '../styles/tokens.css'
import '../styles/base.css'

const SITE = 'https://chess.visheshxdevs.in'

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: 'Real-Time Multiplayer Chess | Play Live',
  description:
    'Play chess live against a real opponent. Moves sync instantly over WebSockets, every move is validated by the server, and your game resumes if your connection drops. Watch live games as a spectator.',
  alternates: { canonical: '/' },
  icons: { icon: '/favicon.svg' },
  openGraph: {
    type: 'website',
    siteName: 'Tempo',
    title: 'Real-Time Multiplayer Chess | Play Live',
    description: 'Chess, built properly for real-time play. Server-validated moves, instant sync, reconnect and resume, live spectating.',
    url: SITE,
    images: ['/og.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Real-Time Multiplayer Chess | Play Live',
    description: 'Chess, built properly for real-time play. Server-validated moves, instant sync, reconnect and resume, live spectating.',
    images: ['/og.png'],
  },
}

export const viewport: Viewport = { themeColor: '#0B0C0E', viewportFit: 'cover' }

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Tempo',
  url: SITE,
  applicationCategory: 'GameApplication',
  operatingSystem: 'Any (web browser)',
  description: 'Real-time multiplayer chess with server-validated moves, reconnect and resume, and live spectator mode.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        {children}
      </body>
    </html>
  )
}
