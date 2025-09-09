// Cloudflare Workers 엔트리 포인트
import { getAssetFromKV } from '@cloudflare/kv-asset-handler';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // 정적 자산 처리
    if (url.pathname.startsWith('/_next/static/') || 
        url.pathname.startsWith('/images/') ||
        url.pathname.endsWith('.ico') ||
        url.pathname.endsWith('.png') ||
        url.pathname.endsWith('.jpg') ||
        url.pathname.endsWith('.jpeg') ||
        url.pathname.endsWith('.webp') ||
        url.pathname.endsWith('.svg')) {
      try {
        return await getAssetFromKV(
          {
            request,
            waitUntil: ctx.waitUntil.bind(ctx),
          },
          {
            ASSET_NAMESPACE: env.__STATIC_CONTENT,
            ASSET_MANIFEST: JSON.parse(env.__STATIC_CONTENT_MANIFEST),
          }
        );
      } catch (e) {
        return new Response('Not Found', { status: 404 });
      }
    }

    // API 라우트 처리
    if (url.pathname.startsWith('/api/')) {
      // 환경 변수를 process.env로 전달
      process.env = {
        ...process.env,
        NEXT_PUBLIC_SUPABASE_URL: env.NEXT_PUBLIC_SUPABASE_URL,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        SUPABASE_SERVICE_ROLE_KEY: env.SUPABASE_SERVICE_ROLE_KEY,
        GOOGLE_CLIENT_ID: env.GOOGLE_CLIENT_ID,
        GOOGLE_CLIENT_SECRET: env.GOOGLE_CLIENT_SECRET,
        NEXTAUTH_URL: env.NEXTAUTH_URL,
        NEXTAUTH_SECRET: env.NEXTAUTH_SECRET,
        JWT_SECRET: env.JWT_SECRET,
        DATABASE_URL: env.DATABASE_URL,
        NEXT_PUBLIC_VAPID_PUBLIC_KEY: env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
        VAPID_PRIVATE_KEY: env.VAPID_PRIVATE_KEY,
        NODE_ENV: env.NODE_ENV || 'production',
      };
    }

    // CORS 헤더 설정
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    };

    // OPTIONS 요청 처리
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // 보안 헤더 추가
    const securityHeaders = {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=(self), payment=()',
    };

    // Next.js 앱으로 요청 전달
    try {
      // Next.js Edge Runtime 사용
      const { default: handler } = await import('../.next/standalone/server.js');
      
      const response = await handler(request, {
        ...env,
        waitUntil: ctx.waitUntil.bind(ctx),
      });

      // 응답에 보안 헤더 추가
      const newHeaders = new Headers(response.headers);
      Object.entries(securityHeaders).forEach(([key, value]) => {
        newHeaders.set(key, value);
      });

      // API 요청에는 CORS 헤더도 추가
      if (url.pathname.startsWith('/api/')) {
        Object.entries(corsHeaders).forEach(([key, value]) => {
          newHeaders.set(key, value);
        });
      }

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: newHeaders,
      });
    } catch (error) {
      console.error('Worker error:', error);
      return new Response('Internal Server Error', { 
        status: 500,
        headers: securityHeaders,
      });
    }
  },
};