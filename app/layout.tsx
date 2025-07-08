import type { Metadata } from 'next'
import { Inter, Orbitron } from 'next/font/google'
import './globals.css'
import Navigation from './components/Navigation'
import { ThemeProvider } from './components/ThemeProvider'
import { Providers } from './providers'
import { MapPin, MessageCircle, Clock } from 'lucide-react'
import { StagewiseToolbar } from '@stagewise/toolbar-next'
import { ReactPlugin } from '@stagewise-plugins/react'

const inter = Inter({ subsets: ['latin'] })
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
      <body className={`${inter.className} ${orbitron.variable} bg-gray-50 dark:bg-gray-950`}>
        <Providers>
          <ThemeProvider>
            {/* Stagewise 툴바 - 개발 모드에서만 활성화 */}
            <StagewiseToolbar 
              config={{
                plugins: [ReactPlugin]
              }}
            />
            
            <Navigation />
            
            {/* 메인 콘텐츠 */}
            <main className="min-h-screen">
              {children}
            </main>

          </ThemeProvider>
        </Providers>
      </body>
    </html>
  )
}