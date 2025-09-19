/**
 * API 게이트웨이
 *
 * 기능:
 * - 라우팅 및 프록시
 * - 인증/인가
 * - Rate Limiting
 * - 캐싱
 * - 요청/응답 변환
 */

import { EventEmitter } from 'events';
import { createHash } from 'crypto';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS' | 'HEAD';

interface RouteConfig {
  path: string;
  method: HttpMethod;
  service: string;
  serviceEndpoint: string;
  auth: {
    required: boolean;
    roles?: string[];
    scopes?: string[];
  };
  rateLimit?: {
    requests: number;
    window: number;  // seconds
    keyGenerator?: (req: Request) => string;
  };
  cache?: {
    ttl: number;  // seconds
    keyGenerator?: (req: Request) => string;
    invalidateOn?: string[];  // 이벤트 목록
  };
  transform?: {
    request?: (data: any) => any;
    response?: (data: any) => any;
  };
  validation?: {
    headers?: Record<string, any>;
    query?: Record<string, any>;
    body?: Record<string, any>;
  };
  cors?: {
    origins: string[];
    methods: HttpMethod[];
    headers: string[];
    credentials: boolean;
  };
  timeout?: number;
  retry?: {
    attempts: number;
    backoff: number;
  };
}

interface Request {
  id: string;
  method: HttpMethod;
  path: string;
  headers: Record<string, string>;
  query: Record<string, string>;
  body?: any;
  user?: {
    id: string;
    roles: string[];
    scopes: string[];
  };
  ip: string;
  timestamp: Date;
}

interface Response {
  status: number;
  headers: Record<string, string>;
  body?: any;
  timestamp: Date;
}

interface CacheEntry {
  key: string;
  data: any;
  expires: Date;
  etag: string;
}

interface RateLimitEntry {
  key: string;
  count: number;
  resetAt: Date;
}

interface Middleware {
  name: string;
  priority: number;
  execute: (req: Request, res: Response, next: () => void) => Promise<void>;
}

/**
 * API 게이트웨이
 */
export class ApiGateway extends EventEmitter {
  private routes: Map<string, RouteConfig> = new Map();
  private cache: Map<string, CacheEntry> = new Map();
  private rateLimits: Map<string, RateLimitEntry> = new Map();
  private middlewares: Middleware[] = [];
  private metrics: {
    requests: number;
    errors: number;
    latency: number[];
    cacheHits: number;
    cacheMisses: number;
    rateLimited: number;
  } = {
    requests: 0,
    errors: 0,
    latency: [],
    cacheHits: 0,
    cacheMisses: 0,
    rateLimited: 0,
  };

  constructor() {
    super();
    this.initializeMiddlewares();
    this.startCleanupJob();
  }

  /**
   * 미들웨어 초기화
   */
  private initializeMiddlewares(): void {
    // 로깅 미들웨어
    this.use({
      name: 'logging',
      priority: 1,
      execute: async (req, res, next) => {
        console.log(`[${req.method}] ${req.path} - ${req.ip}`);
        next();
      },
    });

    // CORS 미들웨어
    this.use({
      name: 'cors',
      priority: 2,
      execute: async (req, res, next) => {
        const route = this.findRoute(req);
        if (route?.cors) {
          res.headers['Access-Control-Allow-Origin'] = route.cors.origins.join(', ');
          res.headers['Access-Control-Allow-Methods'] = route.cors.methods.join(', ');
          res.headers['Access-Control-Allow-Headers'] = route.cors.headers.join(', ');
          if (route.cors.credentials) {
            res.headers['Access-Control-Allow-Credentials'] = 'true';
          }
        }
        next();
      },
    });

    // 인증 미들웨어
    this.use({
      name: 'authentication',
      priority: 3,
      execute: async (req, res, next) => {
        const route = this.findRoute(req);
        if (route?.auth.required) {
          if (!req.user) {
            res.status = 401;
            res.body = { error: 'Authentication required' };
            return;
          }

          // 역할 검증
          if (route.auth.roles) {
            const hasRole = route.auth.roles.some(role =>
              req.user!.roles.includes(role)
            );
            if (!hasRole) {
              res.status = 403;
              res.body = { error: 'Insufficient permissions' };
              return;
            }
          }

          // 스코프 검증
          if (route.auth.scopes) {
            const hasScope = route.auth.scopes.some(scope =>
              req.user!.scopes.includes(scope)
            );
            if (!hasScope) {
              res.status = 403;
              res.body = { error: 'Insufficient scopes' };
              return;
            }
          }
        }
        next();
      },
    });

    // Rate Limiting 미들웨어
    this.use({
      name: 'rateLimiting',
      priority: 4,
      execute: async (req, res, next) => {
        const route = this.findRoute(req);
        if (route?.rateLimit) {
          const isAllowed = this.checkRateLimit(req, route.rateLimit);
          if (!isAllowed) {
            res.status = 429;
            res.body = { error: 'Rate limit exceeded' };
            res.headers['X-RateLimit-Limit'] = route.rateLimit.requests.toString();
            res.headers['X-RateLimit-Remaining'] = '0';
            res.headers['X-RateLimit-Reset'] = new Date(Date.now() + route.rateLimit.window * 1000).toISOString();
            this.metrics.rateLimited++;
            return;
          }
        }
        next();
      },
    });

    // 캐싱 미들웨어
    this.use({
      name: 'caching',
      priority: 5,
      execute: async (req, res, next) => {
        const route = this.findRoute(req);
        if (route?.cache && req.method === 'GET') {
          const cached = this.getFromCache(req, route.cache);
          if (cached) {
            res.status = 200;
            res.body = cached.data;
            res.headers['X-Cache'] = 'HIT';
            res.headers['ETag'] = cached.etag;
            this.metrics.cacheHits++;
            return;
          }
          res.headers['X-Cache'] = 'MISS';
          this.metrics.cacheMisses++;
        }
        next();
      },
    });
  }

  /**
   * 라우트 등록
   */
  public registerRoute(config: RouteConfig): void {
    const key = `${config.method}:${config.path}`;
    this.routes.set(key, config);
    this.emit('route-registered', config);
    console.log(`Route registered: ${key} -> ${config.service}${config.serviceEndpoint}`);
  }

  /**
   * 요청 처리
   */
  public async handleRequest(req: Request): Promise<Response> {
    const startTime = Date.now();
    this.metrics.requests++;

    const res: Response = {
      status: 200,
      headers: {},
      timestamp: new Date(),
    };

    try {
      // 미들웨어 체인 실행
      await this.executeMiddlewares(req, res);

      // 라우트가 없으면 404
      const route = this.findRoute(req);
      if (!route) {
        res.status = 404;
        res.body = { error: 'Route not found' };
        return res;
      }

      // 요청 변환
      if (route.transform?.request) {
        req.body = route.transform.request(req.body);
      }

      // 유효성 검증
      if (route.validation) {
        const isValid = this.validateRequest(req, route.validation);
        if (!isValid) {
          res.status = 400;
          res.body = { error: 'Validation failed' };
          return res;
        }
      }

      // 서비스 호출
      const serviceResponse = await this.callService(route, req);

      // 응답 변환
      if (route.transform?.response) {
        serviceResponse.body = route.transform.response(serviceResponse.body);
      }

      // 캐싱
      if (route.cache && req.method === 'GET' && serviceResponse.status === 200) {
        this.saveToCache(req, route.cache, serviceResponse.body);
      }

      res.status = serviceResponse.status;
      res.body = serviceResponse.body;
      res.headers = { ...res.headers, ...serviceResponse.headers };

    } catch (error) {
      this.metrics.errors++;
      console.error('Request handling error:', error);
      res.status = 500;
      res.body = { error: 'Internal server error' };
    }

    // 메트릭스 업데이트
    const latency = Date.now() - startTime;
    this.metrics.latency.push(latency);
    res.headers['X-Response-Time'] = `${latency}ms`;

    this.emit('request-completed', { req, res, latency });

    return res;
  }

  /**
   * 미들웨어 실행
   */
  private async executeMiddlewares(req: Request, res: Response): Promise<void> {
    const sortedMiddlewares = [...this.middlewares].sort((a, b) => a.priority - b.priority);

    for (const middleware of sortedMiddlewares) {
      let nextCalled = false;
      const next = () => { nextCalled = true; };

      await middleware.execute(req, res, next);

      if (!nextCalled) {
        break;  // 미들웨어가 체인을 중단
      }
    }
  }

  /**
   * 라우트 찾기
   */
  private findRoute(req: Request): RouteConfig | undefined {
    const key = `${req.method}:${req.path}`;
    let route = this.routes.get(key);

    if (!route) {
      // 패턴 매칭 (예: /users/:id)
      for (const [pattern, config] of this.routes) {
        const [method, path] = pattern.split(':');
        if (method === req.method && this.matchPath(path, req.path)) {
          route = config;
          break;
        }
      }
    }

    return route;
  }

  /**
   * 경로 매칭
   */
  private matchPath(pattern: string, path: string): boolean {
    const regex = pattern
      .split('/')
      .map(segment => {
        if (segment.startsWith(':')) {
          return '([^/]+)';
        }
        if (segment === '*') {
          return '.*';
        }
        return segment;
      })
      .join('/');

    return new RegExp(`^${regex}$`).test(path);
  }

  /**
   * Rate Limit 체크
   */
  private checkRateLimit(
    req: Request,
    config: { requests: number; window: number; keyGenerator?: (req: Request) => string }
  ): boolean {
    const key = config.keyGenerator ? config.keyGenerator(req) : req.ip;
    const now = Date.now();

    let entry = this.rateLimits.get(key);

    if (!entry || entry.resetAt.getTime() <= now) {
      entry = {
        key,
        count: 0,
        resetAt: new Date(now + config.window * 1000),
      };
      this.rateLimits.set(key, entry);
    }

    entry.count++;

    return entry.count <= config.requests;
  }

  /**
   * 캐시에서 가져오기
   */
  private getFromCache(
    req: Request,
    config: { ttl: number; keyGenerator?: (req: Request) => string }
  ): CacheEntry | null {
    const key = config.keyGenerator ? config.keyGenerator(req) : `${req.method}:${req.path}`;
    const entry = this.cache.get(key);

    if (entry && entry.expires > new Date()) {
      // ETag 검증
      if (req.headers['If-None-Match'] === entry.etag) {
        return { ...entry, data: null };  // 304 Not Modified
      }
      return entry;
    }

    if (entry) {
      this.cache.delete(key);
    }

    return null;
  }

  /**
   * 캐시에 저장
   */
  private saveToCache(
    req: Request,
    config: { ttl: number; keyGenerator?: (req: Request) => string },
    data: any
  ): void {
    const key = config.keyGenerator ? config.keyGenerator(req) : `${req.method}:${req.path}`;
    const etag = this.generateETag(data);

    const entry: CacheEntry = {
      key,
      data,
      expires: new Date(Date.now() + config.ttl * 1000),
      etag,
    };

    this.cache.set(key, entry);
  }

  /**
   * ETag 생성
   */
  private generateETag(data: any): string {
    return createHash('md5').update(JSON.stringify(data)).digest('hex');
  }

  /**
   * 요청 유효성 검증
   */
  private validateRequest(
    req: Request,
    validation: RouteConfig['validation']
  ): boolean {
    if (validation?.headers) {
      for (const [key, schema] of Object.entries(validation.headers)) {
        if (!this.validateValue(req.headers[key], schema)) {
          return false;
        }
      }
    }

    if (validation?.query) {
      for (const [key, schema] of Object.entries(validation.query)) {
        if (!this.validateValue(req.query[key], schema)) {
          return false;
        }
      }
    }

    if (validation?.body) {
      for (const [key, schema] of Object.entries(validation.body)) {
        if (!this.validateValue(req.body?.[key], schema)) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * 값 유효성 검증
   */
  private validateValue(value: any, schema: any): boolean {
    // 간단한 유효성 검증 (실제로는 joi, yup 등 사용)
    if (schema.required && value === undefined) {
      return false;
    }

    if (schema.type) {
      const actualType = Array.isArray(value) ? 'array' : typeof value;
      if (actualType !== schema.type) {
        return false;
      }
    }

    if (schema.min !== undefined && value < schema.min) {
      return false;
    }

    if (schema.max !== undefined && value > schema.max) {
      return false;
    }

    if (schema.pattern && !new RegExp(schema.pattern).test(value)) {
      return false;
    }

    return true;
  }

  /**
   * 서비스 호출
   */
  private async callService(route: RouteConfig, req: Request): Promise<Response> {
    // 실제 구현에서는 HTTP/gRPC 호출
    console.log(`Calling service: ${route.service}${route.serviceEndpoint}`);

    // 재시도 로직
    let lastError: Error | null = null;
    const maxAttempts = route.retry?.attempts || 1;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        // 시뮬레이션
        const response: Response = {
          status: 200,
          headers: {},
          body: {
            message: 'Service response',
            data: req.body,
            service: route.service,
            endpoint: route.serviceEndpoint,
          },
          timestamp: new Date(),
        };

        return response;

      } catch (error) {
        lastError = error as Error;

        if (attempt < maxAttempts) {
          const backoff = (route.retry?.backoff || 1000) * attempt;
          await this.delay(backoff);
        }
      }
    }

    throw lastError;
  }

  /**
   * 미들웨어 추가
   */
  public use(middleware: Middleware): void {
    this.middlewares.push(middleware);
    this.middlewares.sort((a, b) => a.priority - b.priority);
  }

  /**
   * 캐시 무효화
   */
  public invalidateCache(pattern?: string): void {
    if (!pattern) {
      this.cache.clear();
      return;
    }

    const regex = new RegExp(pattern);
    for (const [key, _] of this.cache) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * 정리 작업
   */
  private startCleanupJob(): void {
    setInterval(() => {
      // 만료된 캐시 제거
      const now = new Date();
      for (const [key, entry] of this.cache) {
        if (entry.expires <= now) {
          this.cache.delete(key);
        }
      }

      // 만료된 rate limit 제거
      for (const [key, entry] of this.rateLimits) {
        if (entry.resetAt <= now) {
          this.rateLimits.delete(key);
        }
      }

      // 메트릭스 정리 (최근 1000개만 유지)
      if (this.metrics.latency.length > 1000) {
        this.metrics.latency = this.metrics.latency.slice(-1000);
      }
    }, 60000);  // 1분마다
  }

  /**
   * 메트릭스 조회
   */
  public getMetrics(): {
    requests: number;
    errors: number;
    averageLatency: number;
    p95Latency: number;
    p99Latency: number;
    cacheHitRate: number;
    errorRate: number;
    rateLimitedRate: number;
  } {
    const sorted = [...this.metrics.latency].sort((a, b) => a - b);
    const p95Index = Math.floor(sorted.length * 0.95);
    const p99Index = Math.floor(sorted.length * 0.99);

    const totalCacheRequests = this.metrics.cacheHits + this.metrics.cacheMisses;

    return {
      requests: this.metrics.requests,
      errors: this.metrics.errors,
      averageLatency: sorted.length > 0
        ? sorted.reduce((a, b) => a + b, 0) / sorted.length
        : 0,
      p95Latency: sorted[p95Index] || 0,
      p99Latency: sorted[p99Index] || 0,
      cacheHitRate: totalCacheRequests > 0
        ? (this.metrics.cacheHits / totalCacheRequests) * 100
        : 0,
      errorRate: this.metrics.requests > 0
        ? (this.metrics.errors / this.metrics.requests) * 100
        : 0,
      rateLimitedRate: this.metrics.requests > 0
        ? (this.metrics.rateLimited / this.metrics.requests) * 100
        : 0,
    };
  }

  /**
   * 웹소켓 지원
   */
  public handleWebSocket(
    path: string,
    handler: (ws: any) => void
  ): void {
    // WebSocket 처리 로직
    this.emit('websocket-registered', { path });
  }

  /**
   * GraphQL 지원
   */
  public handleGraphQL(
    endpoint: string,
    schema: any,
    resolvers: any
  ): void {
    // GraphQL 처리 로직
    this.registerRoute({
      path: endpoint,
      method: 'POST',
      service: 'graphql',
      serviceEndpoint: endpoint,
      auth: { required: false },
      transform: {
        request: (data) => {
          // GraphQL 쿼리 파싱
          return data;
        },
        response: (data) => {
          // GraphQL 응답 포맷팅
          return data;
        },
      },
    });
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// 싱글톤 인스턴스
export const apiGateway = new ApiGateway();

// 기본 라우트 설정
apiGateway.registerRoute({
  path: '/api/auth/login',
  method: 'POST',
  service: 'auth',
  serviceEndpoint: '/login',
  auth: { required: false },
  rateLimit: { requests: 5, window: 60 },
  validation: {
    body: {
      email: { type: 'string', required: true, pattern: '^[\\w-\\.]+@[\\w-]+\\.[a-z]{2,}$' },
      password: { type: 'string', required: true, min: 8 },
    },
  },
});

apiGateway.registerRoute({
  path: '/api/reservations',
  method: 'GET',
  service: 'reservation',
  serviceEndpoint: '/list',
  auth: { required: true },
  cache: { ttl: 300 },
  rateLimit: { requests: 100, window: 60 },
});

apiGateway.registerRoute({
  path: '/api/reservations',
  method: 'POST',
  service: 'reservation',
  serviceEndpoint: '/create',
  auth: { required: true, roles: ['user'] },
  rateLimit: { requests: 10, window: 60 },
  validation: {
    body: {
      deviceId: { type: 'string', required: true },
      startTime: { type: 'string', required: true },
      duration: { type: 'number', required: true, min: 30, max: 240 },
    },
  },
});