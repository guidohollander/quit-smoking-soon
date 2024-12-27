import './globals.css'
import type { Metadata, Viewport } from 'next'
import VersionDisplay from './components/VersionDisplay'

export const metadata: Metadata = {
  title: 'Quit Smoking Soon',
  description: 'Your journey to a smoke-free life starts here',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        {children}
        <VersionDisplay className="fixed bottom-2 sm:bottom-4 right-2 sm:right-4 text-gray-500 text-xs sm:text-sm" />
      </body>
    </html>
  )
}
