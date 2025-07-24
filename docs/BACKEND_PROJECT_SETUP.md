# NestJS 백엔드 프로젝트 설정 가이드

## 1. 프로젝트 생성 명령어

```bash
# 새 디렉토리 생성
mkdir gameplaza-backend
cd gameplaza-backend

# NestJS CLI 설치 (글로벌)
npm i -g @nestjs/cli

# 프로젝트 생성
nest new . --package-manager npm

# 필수 의존성 설치
npm install @nestjs/config @nestjs/typeorm typeorm pg
npm install @nestjs/passport passport passport-google-oauth20 @nestjs/jwt passport-jwt
npm install @nestjs/platform-socket.io socket.io
npm install class-validator class-transformer
npm install bcrypt
npm install @nestjs/swagger swagger-ui-express

# 개발 의존성
npm install -D @types/passport-google-oauth20 @types/passport-jwt
npm install -D @types/bcrypt
npm install -D @types/node
```

## 2. 프로젝트 구조

```
gameplaza-backend/
├── src/
│   ├── common/
│   │   ├── decorators/
│   │   │   ├── current-user.decorator.ts
│   │   │   └── roles.decorator.ts
│   │   ├── filters/
│   │   │   ├── http-exception.filter.ts
│   │   │   └── all-exceptions.filter.ts
│   │   ├── guards/
│   │   │   ├── jwt-auth.guard.ts
│   │   │   ├── google-auth.guard.ts
│   │   │   └── roles.guard.ts
│   │   ├── interceptors/
│   │   │   ├── logging.interceptor.ts
│   │   │   └── transform.interceptor.ts
│   │   ├── pipes/
│   │   │   └── validation.pipe.ts
│   │   └── utils/
│   │       ├── kst-date.util.ts
│   │       └── time-slot.util.ts
│   ├── config/
│   │   ├── database.config.ts
│   │   ├── jwt.config.ts
│   │   └── app.config.ts
│   ├── database/
│   │   ├── migrations/
│   │   └── seeds/
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── dto/
│   │   │   ├── guards/
│   │   │   ├── strategies/
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   └── auth.module.ts
│   │   ├── users/
│   │   │   ├── dto/
│   │   │   ├── entities/
│   │   │   ├── users.controller.ts
│   │   │   ├── users.service.ts
│   │   │   └── users.module.ts
│   │   ├── reservations/
│   │   │   ├── dto/
│   │   │   ├── entities/
│   │   │   ├── services/
│   │   │   ├── reservations.controller.ts
│   │   │   ├── reservations.service.ts
│   │   │   └── reservations.module.ts
│   │   ├── devices/
│   │   │   ├── dto/
│   │   │   ├── entities/
│   │   │   ├── devices.controller.ts
│   │   │   ├── devices.service.ts
│   │   │   └── devices.module.ts
│   │   ├── schedule/
│   │   │   ├── dto/
│   │   │   ├── entities/
│   │   │   ├── schedule.controller.ts
│   │   │   ├── schedule.service.ts
│   │   │   └── schedule.module.ts
│   │   ├── analytics/
│   │   │   ├── dto/
│   │   │   ├── analytics.controller.ts
│   │   │   ├── analytics.service.ts
│   │   │   └── analytics.module.ts
│   │   └── websocket/
│   │       ├── websocket.gateway.ts
│   │       └── websocket.module.ts
│   ├── app.module.ts
│   └── main.ts
├── test/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── docker/
│   ├── Dockerfile
│   └── docker-compose.yml
├── .env.example
├── .eslintrc.js
├── .prettierrc
├── nest-cli.json
├── tsconfig.json
├── tsconfig.build.json
└── package.json
```

## 3. 환경 변수 설정 (.env.example)

```env
# Application
NODE_ENV=development
PORT=3001

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=password
DB_DATABASE=gameplaza

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your-super-secret-refresh-key
JWT_REFRESH_EXPIRES_IN=30d

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3001/auth/google/callback

# Redis (for sessions/caching)
REDIS_HOST=localhost
REDIS_PORT=6379

# Supabase (for migration period)
SUPABASE_URL=https://rupeyejnfurlcpgneekg.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key

# Frontend URL
FRONTEND_URL=http://localhost:3000

# CORS
CORS_ORIGINS=http://localhost:3000,http://localhost:3001
```

## 4. Docker 설정

### docker-compose.yml
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
      POSTGRES_DB: gameplaza
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=development
    volumes:
      - .:/app
      - /app/node_modules
    depends_on:
      - postgres
      - redis
    command: npm run start:dev

volumes:
  postgres_data:
  redis_data:
```

### Dockerfile
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

RUN npm run build

EXPOSE 3001

CMD ["npm", "run", "start:prod"]
```

## 5. TypeORM 설정

### src/config/database.config.ts
```typescript
import { registerAs } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export default registerAs('database', (): TypeOrmModuleOptions => ({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT, 10),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  synchronize: process.env.NODE_ENV === 'development',
  logging: process.env.NODE_ENV === 'development',
  migrations: [__dirname + '/../database/migrations/*{.ts,.js}'],
  migrationsRun: true,
}));
```

## 6. 마이그레이션 명령어

```bash
# 마이그레이션 생성
npm run migration:create -- --name=InitialSchema

# 마이그레이션 실행
npm run migration:run

# 마이그레이션 되돌리기
npm run migration:revert
```

## 7. 개발 시작 명령어

```bash
# 개발 환경 실행 (Docker)
docker-compose up -d

# 개발 서버 실행 (watch mode)
npm run start:dev

# 테스트 실행
npm run test
npm run test:e2e
npm run test:cov

# 빌드
npm run build

# 프로덕션 실행
npm run start:prod
```

## 8. 초기 설정 체크리스트

- [ ] 프로젝트 생성 및 의존성 설치
- [ ] 환경 변수 파일 설정
- [ ] Docker 환경 구축
- [ ] TypeORM 연결 테스트
- [ ] 기본 모듈 구조 생성
- [ ] Swagger 문서 설정
- [ ] 로깅 시스템 구축
- [ ] 에러 핸들링 설정
- [ ] CORS 설정
- [ ] 보안 미들웨어 설정 (helmet, rate-limit)

## 9. 주의사항

1. **포트 충돌**: 기존 Next.js가 3000번을 사용하므로 백엔드는 3001번 사용
2. **데이터베이스**: 개발 환경에서는 Docker PostgreSQL, 프로덕션에서는 Supabase PostgreSQL 직접 연결
3. **인증**: 초기에는 Supabase Auth와 병행, 점진적으로 자체 JWT로 전환
4. **실시간**: Socket.io로 구현하되, 기존 Supabase Realtime과 호환성 유지

---

이 가이드를 따라 NestJS 백엔드 프로젝트를 설정하고 개발을 시작할 수 있습니다.