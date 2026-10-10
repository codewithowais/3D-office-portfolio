import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'The Office — an interactive 3D office',
  description: 'Walk through a living 3D office and its neighbourhood: reception, studio, meeting rooms, the boss cabin and more.',
}

export const viewport: Viewport = { themeColor: '#dcecf4' }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="h-full overflow-hidden">{children}</body>
    </html>
  )
}
