import type { Metadata } from 'next'
import { Orbitron } from 'next/font/google'
import './globals.css'
import LayoutWrapper from './components/LayoutWrapper'
import { ThemeProvider } from './components/ThemeProvider'
import { Providers } from './providers'
import ServiceWorkerRegister from './components/service-worker-register'
import PWAInstallPrompt from './components/PWAInstallPrompt'
// import DynamicFavicon from './components/DynamicFavicon'
import { checkDatabaseEnvironment } from '@/lib/server/check-db-env'

// 서버 시작 시 DB 환경 체크
if (typeof window === 'undefined') {
  checkDatabaseEnvironment();
}

const orbitron = Orbitron({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-orbitron'
})

export const metadata: Metadata = {
  title: '광주 게임플라자 - Gwangju Game Plaza',
  description: '광주 게임플라자 예약 시스템 - Gwangju Game Plaza Reservation System. Privacy Policy and Terms of Service available.',
  manifest: '/manifest.json',
  keywords: ['게임플라자', 'game plaza', 'privacy policy', '개인정보처리방침', 'terms of service', '이용약관'],
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: '게임플라자',
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    title: '광주 게임플라자 - Gwangju Game Plaza',
    description: '광주 게임플라자 리듬게임 기기 예약 시스템 - Privacy Policy and Terms available',
    type: 'website',
    locale: 'ko_KR',
    url: 'https://gameplaza-v2.vercel.app',
    siteName: 'Gwangju Game Plaza',
  },
  twitter: {
    card: 'summary',
    title: '광주 게임플라자 - Gwangju Game Plaza',
    description: '광주 게임플라자 리듬게임 기기 예약 시스템',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icons/favicon-light-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/icons/favicon-light-32x32.png', sizes: '32x32', type: 'image/png' },
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
        
        {/* 개인정보처리방침 및 약관 메타 태그 - Google Play Console 봇 인식용 */}
        <meta name="privacy-policy" content="/privacy" />
        <meta name="terms-of-service" content="/terms" />
        <link rel="privacy-policy" href="/privacy" />
        <link rel="terms-of-service" href="/terms" />
        
        {/* JSON-LD 구조화 데이터 */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": "광주 게임플라자",
              "alternateName": "Gwangju Game Plaza",
              "url": "https://gameplaza-v2.vercel.app",
              "description": "광주 게임플라자 예약 시스템",
              "inLanguage": "ko-KR",
              "potentialAction": {
                "@type": "SearchAction",
                "target": "https://gameplaza-v2.vercel.app/search?q={search_term_string}",
                "query-input": "required name=search_term_string"
              },
              "mainEntity": {
                "@type": "Organization",
                "name": "광주 게임플라자",
                "url": "https://gameplaza-v2.vercel.app",
                "logo": "https://gameplaza-v2.vercel.app/icons/icon-512x512.svg",
                "contactPoint": {
                  "@type": "ContactPoint",
                  "email": "ndz5496@gmail.com",
                  "contactType": "customer service"
                }
              },
              "hasPart": [
                {
                  "@type": "WebPage",
                  "name": "Privacy Policy",
                  "url": "https://gameplaza-v2.vercel.app/privacy"
                },
                {
                  "@type": "WebPage", 
                  "name": "Terms of Service",
                  "url": "https://gameplaza-v2.vercel.app/terms"
                }
              ]
            })
          }}
        />
        
        {/* Google Search Console 소유권 확인용 - 필요시 추가 */}
        {/* <meta name="google-site-verification" content="YOUR_VERIFICATION_CODE_HERE" /> */}
      </head>
      <body className={`font-sans ${orbitron.variable} bg-gray-50 dark:bg-gray-950`}>
        {/* 스킵 링크 - 키보드 사용자를 위한 빠른 네비게이션 */}
        <a 
          href="#main-content" 
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-indigo-600 focus:text-white focus:rounded-md focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          본문으로 바로가기
        </a>
        
        {/* ARIA 라이브 리전 - 스크린 리더 알림용 */}
        <div 
          id="live-region-polite" 
          role="status" 
          aria-live="polite" 
          aria-atomic="true" 
          className="sr-only"
        ></div>
        <div 
          id="live-region-assertive" 
          role="alert" 
          aria-live="assertive" 
          aria-atomic="true" 
          className="sr-only"
        ></div>
        
        <Providers>
          <ThemeProvider>
            <LayoutWrapper>
              {children}
            </LayoutWrapper>
            <ServiceWorkerRegister />
            <PWAInstallPrompt />
          </ThemeProvider>
        </Providers>
      </body>
    </html>
  )
}