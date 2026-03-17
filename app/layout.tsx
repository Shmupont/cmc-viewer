import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'CMC Viewer — Portfolio Terminal',
  description: 'Bloomberg-style personal investment portfolio terminal',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}): React.ReactElement {
  return (
    <html lang="en">
      <body className="bg-base text-text-primary antialiased">{children}</body>
    </html>
  )
}
