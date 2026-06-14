import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Mindgo — پلتفرم کوچینگ و توسعه فردی',
  description: 'ذهنت رو به حرکت درآر. پلتفرم آنلاین کوچینگ، توسعه فردی و خودشناسی.',
  manifest: '/manifest.json',
  icons: {
    icon: '/icons/icon-192.png',
    apple: '/icons/icon-512.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#0F172A',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
}

// Inline script runs synchronously before React hydrates — prevents theme flash
const THEME_SCRIPT = [
  '(function(){',
  "try{var t=localStorage.getItem('mg_theme')||'auto';",
  'var h=new Date().getHours();',
  "var d=t==='dark'||(t==='auto'&&(h>=20||h<6));",
  "if(d)document.documentElement.classList.add('dark');}",
  "catch(e){document.documentElement.classList.add('dark');}",
  '})()',
].join('')

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      <head>
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body suppressHydrationWarning>
        {children}
      </body>
    </html>
  )
}
