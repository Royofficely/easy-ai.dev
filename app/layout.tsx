import type { Metadata } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import './globals.css'

export const metadata: Metadata = {
  title: 'EasyAI - AI Development Made Easy',
  description: 'Build, test, and manage AI prompts across multiple models with our powerful CLI and dashboard.',
  keywords: ['AI', 'CLI', 'development', 'OpenAI', 'Anthropic', 'prompts'],
  authors: [{ name: 'EasyAI', url: 'https://easy-ai.dev' }],
  creator: 'EasyAI',
  publisher: 'EasyAI',
  robots: 'index, follow',
  openGraph: {
    title: 'EasyAI - AI Development Made Easy',
    description: 'Build, test, and manage AI prompts across multiple models with our powerful CLI and dashboard.',
    url: 'https://easy-ai.dev',
    siteName: 'EasyAI',
    type: 'website',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'EasyAI - AI Development Made Easy',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'EasyAI - AI Development Made Easy',
    description: 'Build, test, and manage AI prompts across multiple models with our powerful CLI and dashboard.',
    images: ['/og-image.jpg'],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className="antialiased">
          {children}
        </body>
      </html>
    </ClerkProvider>
  )
}