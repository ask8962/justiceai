import type { Metadata, Viewport } from 'next'

import './globals.css'
import { AuthProvider } from './auth-context'
import { Toaster } from '@/components/ui/toaster'

export const viewport: Viewport = {
  themeColor: '#ffffff',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export const metadata: Metadata = {
  title: 'JusticeAI - Legal First-Aid',
  description: 'Instant, bilingual legal guidance on Indian law powered by AI.',
  manifest: '/manifest.json',
  icons: { apple: '/icons/icon-192x192.png' },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'JusticeAI',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  )
}
