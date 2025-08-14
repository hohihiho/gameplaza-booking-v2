/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },
  // webpack 설정 추가
  webpack: (config, { isServer, dev }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    
    // 개발 모드에서 캐시 문제 해결
    if (dev) {
      config.cache = false;
    }
    
    return config;
  },
  
  images: {
    domains: ['localhost', 'rupeyejnfurlcpgneekg.supabase.co', 'lh3.googleusercontent.com'],
    // 모바일 최적화를 위한 이미지 설정
    formats: ['image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    minimumCacheTTL: 60,
  },
  experimental: {
    // Next.js 14.1.0에서 지원하지 않는 옵션 제거
  },
  // 프로덕션 빌드에서 console 제거
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },
  // 보안 헤더 및 PWA 관련 헤더 설정
  async headers() {
    const isDev = process.env.NODE_ENV === 'development'
    
    return [
      // 모든 페이지에 보안 헤더 적용
      {
        source: '/(.*)',
        headers: [
          // X-Frame-Options - 클릭재킹 방지
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          // X-Content-Type-Options - MIME 타입 스니핑 방지
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          // X-XSS-Protection - XSS 필터링 활성화
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          // Referrer-Policy - 리퍼러 정보 제한
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          // Permissions-Policy - 브라우저 기능 제한
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(self), payment=()',
          },
          // HSTS - HTTPS 강제 (프로덕션에서만)
          ...(isDev ? [] : [{
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          }]),
          // Content Security Policy - 테스트 환경에 따라 조정
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://accounts.google.com https://www.googletagmanager.com https://www.google-analytics.com",
              // 테스트 환경에서 외부 폰트 허용
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net",
              "font-src 'self' https://fonts.gstatic.com https://cdn.jsdelivr.net",
              "img-src 'self' data: blob: https: http: https://lh3.googleusercontent.com https://rupeyejnfurlcpgneekg.supabase.co",
              // 테스트 환경에서 test.supabase.co 허용
              process.env.NODE_ENV === 'test' 
                ? "connect-src 'self' https://accounts.google.com https://rupeyejnfurlcpgneekg.supabase.co wss://rupeyejnfurlcpgneekg.supabase.co https://test.supabase.co https://www.google-analytics.com https://cdn.jsdelivr.net"
                : "connect-src 'self' https://accounts.google.com https://rupeyejnfurlcpgneekg.supabase.co wss://rupeyejnfurlcpgneekg.supabase.co https://www.google-analytics.com https://cdn.jsdelivr.net",
              "frame-src 'self' https://accounts.google.com",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              ...(isDev ? [] : ["upgrade-insecure-requests"]),
            ].join('; '),
          },
        ],
      },
      // Service Worker 관련 헤더
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Service-Worker-Allowed',
            value: '/',
          },
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
        ],
      },
      // Manifest 관련 헤더
      {
        source: '/manifest.json',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
        ],
      },
      // API 라우트 보안 헤더
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'X-Robots-Tag',
            value: 'noindex, nofollow',
          },
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate',
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