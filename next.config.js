// DB 환경 체크 (개발 환경에서 프로덕션 DB 사용 방지)
// 빌드 시점이 아닌 서버 시작 시점에 체크하도록 변경

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
    
    // 프로덕션에서 번들 사이즈 최적화
    if (!dev) {
      // 트리 쉐이킹 강화
      config.optimization = {
        ...config.optimization,
        usedExports: true,
        sideEffects: false,
      };
      
      // 중복 제거 강화
      config.optimization.splitChunks = {
        ...config.optimization.splitChunks,
        chunks: 'all',
        cacheGroups: {
          ...config.optimization.splitChunks.cacheGroups,
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
            priority: 10,
          },
          common: {
            minChunks: 2,
            chunks: 'all',
            priority: 5,
            reuseExistingChunk: true,
          },
        },
      };
    }
    
    return config;
  },
  
  images: {
    domains: ['localhost', 'lh3.googleusercontent.com'],
    // 모바일 최적화를 위한 이미지 설정
    formats: ['image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    minimumCacheTTL: 60,
  },
  experimental: {
    // Next.js 14.1.0에서 지원하지 않는 옵션 제거
  },
  
  // 하이드레이션 불일치 경고 억제 (브라우저 확장 프로그램으로 인한 경우)
  reactStrictMode: false,
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
              "worker-src 'self' blob: data:",
              // 테스트 환경에서 외부 폰트 허용
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net",
              "font-src 'self' https://fonts.gstatic.com https://cdn.jsdelivr.net",
              "img-src 'self' data: blob: https: http: https://lh3.googleusercontent.com",
              // 외부 연결 허용
              "connect-src 'self' https://accounts.google.com https://www.google-analytics.com https://cdn.jsdelivr.net",
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