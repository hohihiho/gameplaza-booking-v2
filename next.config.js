/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['@supabase/supabase-js'],
  images: {
    domains: ['localhost', 'rupeyejnfurlcpgneekg.supabase.co', 'lh3.googleusercontent.com'],
    // 모바일 최적화를 위한 이미지 설정
    formats: ['image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    minimumCacheTTL: 60,
  },
  experimental: {
    // 패키지 임포트 최적화 확장
    optimizePackageImports: ['lucide-react', '@radix-ui/themes'],
    // CSS 청킹으로 스타일 로딩 최적화
    cssChunking: true,
    // 서버 시작 시 페이지 프리로드 비활성화로 메모리 절약
    preloadEntriesOnStart: false,
    // 서버 컴포넌트 HMR 캐시로 개발 성능 향상
    serverComponentsHmrCache: true,
  },
  // 프로덕션 빌드에서 console 제거
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },
  // PWA 관련 헤더 설정
  async headers() {
    return [
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Service-Worker-Allowed',
            value: '/',
          },
          {
            key: 'Cache-Control',
            value: 'no-cache',
          },
        ],
      },
      {
        source: '/manifest.json',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
        ],
      },
    ]
  },
  // 정적 파일 최적화
  async rewrites() {
    return [
      {
        source: '/sw.js',
        destination: '/sw.js',
      },
    ]
  },
}

module.exports = nextConfig