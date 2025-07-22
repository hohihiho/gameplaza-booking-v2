import type { Metadata } from 'next'
import { Orbitron } from 'next/font/google'
import './globals.css'
import LayoutWrapper from './components/LayoutWrapper'
import { ThemeProvider } from './components/ThemeProvider'
import { Providers } from './providers'
// Stagewise 툴바 임시 비활성화
// import { StagewiseToolbar } from '@stagewise/toolbar-next'
// import { ReactPlugin } from '@stagewise-plugins/react'
// ToastContainer는 LayoutWrapper 내부로 이동

const orbitron = Orbitron({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-orbitron'
})

export const metadata: Metadata = {
  title: '게임플라자 광주점',
  description: '게임플라자 광주점 예약 시스템',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: '게임플라자',
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    title: '게임플라자 광주점',
    description: '광주 게임플라자 리듬게임 기기 예약 시스템',
    type: 'website',
    locale: 'ko_KR',
  },
  twitter: {
    card: 'summary',
    title: '게임플라자 광주점',
    description: '광주 게임플라자 리듬게임 기기 예약 시스템',
  },
  icons: {
    icon: [
      { url: '/icons/icon-192x192.svg', sizes: '192x192', type: 'image/svg+xml' },
      { url: '/icons/icon-512x512.svg', sizes: '512x512', type: 'image/svg+xml' },
    ],
    apple: [
      { url: '/icons/icon-152x152.svg', sizes: '152x152', type: 'image/svg+xml' },
    ],
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#3b82f6',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-152x152.svg" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="게임플라자" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className={`font-sans ${orbitron.variable} bg-gray-50 dark:bg-gray-950`}>
        <Providers>
          <ThemeProvider>
            {/* Stagewise 툴바 - 임시 비활성화 */}
            {/* <StagewiseToolbar 
              config={{
                plugins: [ReactPlugin]
              }}
            /> */}
            
            <LayoutWrapper>
              {children}
            </LayoutWrapper>

          </ThemeProvider>
        </Providers>
      </body>
    </html>
  )
}