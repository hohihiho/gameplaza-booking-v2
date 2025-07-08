import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Navigation from './components/Navigation'
import { ThemeProvider } from './components/ThemeProvider'
import { Providers } from './providers'
import { MapPin, MessageCircle, Clock } from 'lucide-react'
import { StagewiseToolbar } from '@stagewise/toolbar-next'
import { ReactPlugin } from '@stagewise-plugins/react'

const inter = Inter({ subsets: ['latin'] })

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
      <body className={`${inter.className} bg-gray-50 dark:bg-gray-950`}>
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
            <main className="min-h-[calc(100vh-16rem)]">
              {children}
            </main>

          {/* 푸터 */}
          <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 mt-20">
            <div className="max-w-7xl mx-auto px-5 py-12">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div>
                  <h3 className="font-bold mb-4 text-gray-900 dark:text-white">게임플라자 광주점</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    최고의 게임 경험을 제공합니다
                  </p>
                </div>
                
                <div>
                  <h3 className="font-bold mb-4 text-gray-900 dark:text-white">문의</h3>
                  <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    <p className="flex items-center gap-2">
                      <MessageCircle className="w-4 h-4" />
                      카카오톡 1:1 채팅
                    </p>
                    <p className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      광주광역시 동구 충장로안길 6
                    </p>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-bold mb-4 text-gray-900 dark:text-white">운영시간</h3>
                  <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    <p className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      주중: 12:00 - 22:00
                    </p>
                    <p className="ml-6">주말: 11:00 - 22:00</p>
                    <p className="ml-6">공휴일: 별도 공지</p>
                  </div>
                </div>
              </div>
              
              <div className="border-t border-gray-200 dark:border-gray-800 mt-8 pt-8 text-center text-sm text-gray-500 dark:text-gray-400">
                © 2025 게임플라자. All rights reserved.
              </div>
            </div>
          </footer>
          </ThemeProvider>
        </Providers>
      </body>
    </html>
  )
}