# 🚨 게임플라자 긴급 이슈 해결 가이드

> 코드 분석에서 발견된 비즈니스 크리티컬 이슈를 즉시 해결하기 위한 가이드입니다.

## 📋 긴급 이슈 목록

1. **NotificationSupabaseRepository 미구현** - 알림 기능 전체 미작동
2. **PaymentSupabaseRepository 미구현** - 결제 기능 전체 미작동  
3. **체크인 금액 하드코딩** - 실제 예약 정보 반영 안됨
4. **입력값 검증 누락** - 보안 취약점

## 1. NotificationSupabaseRepository 구현

### 현재 상황
```typescript
// src/infrastructure/repositories/notification.supabase.repository.ts
export class NotificationSupabaseRepository implements NotificationRepository {
  async create(notification: Notification): Promise<Notification> {
    // TODO: 구현 필요
    throw new Error('Method not implemented.');
  }
  
  async findByUserId(userId: string): Promise<Notification[]> {
    // TODO: 구현 필요
    throw new Error('Method not implemented.');
  }
  
  // ... 5개 메서드 모두 미구현
}
```

### 해결 방법

#### Step 1: 데이터베이스 스키마 확인
```sql
-- Supabase SQL Editor에서 실행
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'notifications'
ORDER BY ordinal_position;
```

#### Step 2: Repository 구현
```typescript
// src/infrastructure/repositories/notification.supabase.repository.ts
import { Injectable } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { NotificationRepository } from '@/src/domain/repositories/notification.repository.interface';
import { Notification } from '@/src/domain/entities/notification';

@Injectable()
export class NotificationSupabaseRepository implements NotificationRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async create(notification: Notification): Promise<Notification> {
    const { data, error } = await this.supabase
      .from('notifications')
      .insert({
        id: notification.id,
        user_id: notification.userId,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        is_read: notification.isRead,
        created_at: notification.createdAt.toISOString(),
        metadata: notification.metadata
      })
      .select()
      .single();

    if (error) {
      throw new Error(`알림 생성 실패: ${error.message}`);
    }

    return this.mapToDomain(data);
  }

  async findByUserId(userId: string): Promise<Notification[]> {
    const { data, error } = await this.supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`알림 조회 실패: ${error.message}`);
    }

    return data.map(this.mapToDomain);
  }

  async findById(id: string): Promise<Notification | null> {
    const { data, error } = await this.supabase
      .from('notifications')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw new Error(`알림 조회 실패: ${error.message}`);
    }

    return this.mapToDomain(data);
  }

  async update(notification: Notification): Promise<Notification> {
    const { data, error } = await this.supabase
      .from('notifications')
      .update({
        title: notification.title,
        message: notification.message,
        is_read: notification.isRead,
        read_at: notification.readAt?.toISOString(),
        metadata: notification.metadata
      })
      .eq('id', notification.id)
      .select()
      .single();

    if (error) {
      throw new Error(`알림 업데이트 실패: ${error.message}`);
    }

    return this.mapToDomain(data);
  }

  async markAsRead(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('notifications')
      .update({
        is_read: true,
        read_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) {
      throw new Error(`알림 읽음 처리 실패: ${error.message}`);
    }
  }

  async deleteByUserId(userId: string): Promise<void> {
    const { error } = await this.supabase
      .from('notifications')
      .delete()
      .eq('user_id', userId);

    if (error) {
      throw new Error(`알림 삭제 실패: ${error.message}`);
    }
  }

  private mapToDomain(data: any): Notification {
    return new Notification({
      id: data.id,
      userId: data.user_id,
      title: data.title,
      message: data.message,
      type: data.type,
      isRead: data.is_read,
      readAt: data.read_at ? new Date(data.read_at) : undefined,
      createdAt: new Date(data.created_at),
      metadata: data.metadata
    });
  }
}
```

#### Step 3: 테스트 작성
```typescript
// src/infrastructure/repositories/__tests__/notification.supabase.repository.test.ts
describe('NotificationSupabaseRepository', () => {
  let repository: NotificationSupabaseRepository;
  let supabase: SupabaseClient;

  beforeEach(() => {
    supabase = createMockSupabaseClient();
    repository = new NotificationSupabaseRepository(supabase);
  });

  describe('create', () => {
    it('알림을 생성할 수 있다', async () => {
      const notification = new Notification({
        userId: 'user123',
        title: '예약 완료',
        message: 'PS5 예약이 완료되었습니다.',
        type: 'reservation'
      });

      const created = await repository.create(notification);
      
      expect(created.id).toBeDefined();
      expect(created.userId).toBe('user123');
      expect(created.title).toBe('예약 완료');
    });
  });

  // ... 다른 테스트 케이스
});
```

## 2. PaymentSupabaseRepository 구현

### 현재 상황
```typescript
// src/infrastructure/repositories/payment.supabase.repository.ts
export class PaymentSupabaseRepository implements PaymentRepository {
  // 모든 메서드 미구현
}
```

### 해결 방법

#### Step 1: Payment 엔티티 정의 확인
```typescript
// src/domain/entities/payment.ts
export class Payment {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly reservationId: string,
    public readonly amount: number,
    public readonly status: PaymentStatus,
    public readonly method: PaymentMethod,
    public readonly paidAt?: Date,
    public readonly refundedAt?: Date,
    public readonly metadata?: Record<string, any>
  ) {}
}

export enum PaymentStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded'
}

export enum PaymentMethod {
  CARD = 'card',
  CASH = 'cash',
  TRANSFER = 'transfer'
}
```

#### Step 2: Repository 구현
```typescript
// src/infrastructure/repositories/payment.supabase.repository.ts
@Injectable()
export class PaymentSupabaseRepository implements PaymentRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async create(payment: Payment): Promise<Payment> {
    const { data, error } = await this.supabase
      .from('payments')
      .insert({
        id: payment.id,
        user_id: payment.userId,
        reservation_id: payment.reservationId,
        amount: payment.amount,
        status: payment.status,
        method: payment.method,
        paid_at: payment.paidAt?.toISOString(),
        metadata: payment.metadata
      })
      .select()
      .single();

    if (error) {
      throw new Error(`결제 생성 실패: ${error.message}`);
    }

    return this.mapToDomain(data);
  }

  async findById(id: string): Promise<Payment | null> {
    const { data, error } = await this.supabase
      .from('payments')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`결제 조회 실패: ${error.message}`);
    }

    return this.mapToDomain(data);
  }

  async findByReservationId(reservationId: string): Promise<Payment | null> {
    const { data, error } = await this.supabase
      .from('payments')
      .select('*')
      .eq('reservation_id', reservationId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`결제 조회 실패: ${error.message}`);
    }

    return this.mapToDomain(data);
  }

  async updateStatus(id: string, status: PaymentStatus): Promise<Payment> {
    const updateData: any = { status };
    
    if (status === PaymentStatus.COMPLETED) {
      updateData.paid_at = new Date().toISOString();
    } else if (status === PaymentStatus.REFUNDED) {
      updateData.refunded_at = new Date().toISOString();
    }

    const { data, error } = await this.supabase
      .from('payments')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`결제 상태 업데이트 실패: ${error.message}`);
    }

    return this.mapToDomain(data);
  }

  async findByUserIdAndDateRange(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Payment[]> {
    const { data, error } = await this.supabase
      .from('payments')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`결제 내역 조회 실패: ${error.message}`);
    }

    return data.map(this.mapToDomain);
  }

  private mapToDomain(data: any): Payment {
    return new Payment(
      data.id,
      data.user_id,
      data.reservation_id,
      data.amount,
      data.status as PaymentStatus,
      data.method as PaymentMethod,
      data.paid_at ? new Date(data.paid_at) : undefined,
      data.refunded_at ? new Date(data.refunded_at) : undefined,
      data.metadata
    );
  }
}
```

## 3. 체크인 금액 하드코딩 해결

### 현재 상황
```typescript
// app/api/admin/checkin/process/route.ts (59번째 줄)
const paymentAmount = 30000; // TODO: 실제 예약 정보에서 금액 계산
```

### 해결 방법

#### Step 1: 예약 정보에서 금액 계산 로직 추가
```typescript
// src/domain/services/pricing.service.ts
export class PricingService {
  calculateAmount(
    deviceType: DeviceType,
    duration: number,
    timeSlot: TimeSlot
  ): number {
    const baseRate = deviceType.hourlyRate;
    const hours = Math.ceil(duration / 60); // 시간 단위로 올림
    
    // 시간대별 할증/할인
    const multiplier = this.getTimeMultiplier(timeSlot);
    
    return baseRate * hours * multiplier;
  }
  
  private getTimeMultiplier(timeSlot: TimeSlot): number {
    const hour = timeSlot.startTime.getHours();
    
    // 피크 시간 (18:00 ~ 24:00): 20% 할증
    if (hour >= 18 || hour < 2) return 1.2;
    
    // 새벽 시간 (02:00 ~ 10:00): 20% 할인
    if (hour >= 2 && hour < 10) return 0.8;
    
    // 일반 시간: 정상 요금
    return 1.0;
  }
}
```

#### Step 2: API Route 수정
```typescript
// app/api/admin/checkin/process/route.ts
import { PricingService } from '@/src/domain/services/pricing.service';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { reservationId } = body;
    
    // 예약 정보 조회
    const reservation = await reservationRepository.findById(reservationId);
    if (!reservation) {
      return NextResponse.json({ error: '예약을 찾을 수 없습니다' }, { status: 404 });
    }
    
    // 기기 타입 정보 조회
    const device = await deviceRepository.findById(reservation.deviceId);
    const deviceType = await deviceTypeRepository.findById(device.typeId);
    
    // 금액 계산
    const pricingService = new PricingService();
    const paymentAmount = pricingService.calculateAmount(
      deviceType,
      reservation.duration,
      reservation.timeSlot
    );
    
    // 결제 처리
    const payment = new Payment({
      userId: reservation.userId,
      reservationId: reservation.id,
      amount: paymentAmount,
      status: PaymentStatus.PENDING,
      method: PaymentMethod.CASH
    });
    
    await paymentRepository.create(payment);
    
    // ... 체크인 처리 계속
  } catch (error) {
    console.error('체크인 처리 실패:', error);
    return NextResponse.json({ error: '체크인 처리 실패' }, { status: 500 });
  }
}
```

## 4. 입력값 검증 라이브러리 구현

### 현재 상황
- `/lib/api/validation.ts` 파일 없음
- 입력값 검증이 각 API에서 개별적으로 처리됨

### 해결 방법

#### Step 1: 검증 라이브러리 생성
```typescript
// lib/api/validation.ts
import { z } from 'zod';

// 공통 검증 스키마
export const schemas = {
  // ID 검증
  id: z.string().uuid('올바른 ID 형식이 아닙니다'),
  
  // 시간 검증 (KST 기준)
  dateTime: z.string().regex(
    /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/,
    '날짜 형식은 YYYY-MM-DD HH:mm 이어야 합니다'
  ),
  
  // 전화번호 검증
  phoneNumber: z.string().regex(
    /^01[0-9]-\d{4}-\d{4}$/,
    '올바른 전화번호 형식이 아닙니다 (010-1234-5678)'
  ),
  
  // 금액 검증
  amount: z.number()
    .positive('금액은 0보다 커야 합니다')
    .max(1000000, '금액이 너무 큽니다'),
    
  // 예약 시간 검증 (분 단위)
  duration: z.number()
    .min(30, '최소 예약 시간은 30분입니다')
    .max(240, '최대 예약 시간은 4시간입니다')
    .multipleOf(30, '예약 시간은 30분 단위여야 합니다')
};

// 예약 생성 검증
export const createReservationSchema = z.object({
  deviceId: schemas.id,
  startTime: schemas.dateTime,
  duration: schemas.duration,
  userId: schemas.id
});

// 체크인 검증
export const checkInSchema = z.object({
  reservationId: schemas.id,
  actualStartTime: schemas.dateTime.optional()
});

// 결제 검증
export const paymentSchema = z.object({
  reservationId: schemas.id,
  amount: schemas.amount,
  method: z.enum(['card', 'cash', 'transfer'])
});

// XSS 방지를 위한 HTML 이스케이핑
export function sanitizeInput(input: string): string {
  const htmlEscapes: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;'
  };
  
  return input.replace(/[&<>"'/]/g, char => htmlEscapes[char]);
}

// 금지어 검사
const BANNED_PATTERNS = [
  /<script/i,
  /javascript:/i,
  /on\w+=/i,
  /eval\(/i,
  /alert\(/i,
  /document\./i,
  /<iframe/i,
  /<object/i
];

export function containsBannedContent(input: string): boolean {
  return BANNED_PATTERNS.some(pattern => pattern.test(input));
}

// 검증 헬퍼 함수
export async function validateRequest<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): Promise<T> {
  try {
    return await schema.parseAsync(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.errors.map(e => e.message).join(', ');
      throw new ValidationError(messages);
    }
    throw error;
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}
```

#### Step 2: API에 검증 적용
```typescript
// app/api/v2/reservations/route.ts
import { validateRequest, createReservationSchema, sanitizeInput } from '@/lib/api/validation';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // 입력값 검증
    const validatedData = await validateRequest(createReservationSchema, body);
    
    // 추가 메모가 있다면 sanitize
    if (body.memo) {
      validatedData.memo = sanitizeInput(body.memo);
    }
    
    // 예약 생성 로직
    const reservation = await createReservationUseCase.execute(validatedData);
    
    return NextResponse.json({ success: true, data: reservation });
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    // ... 다른 에러 처리
  }
}
```

#### Step 3: 미들웨어에서 공통 검증
```typescript
// middleware.ts
import { containsBannedContent } from '@/lib/api/validation';

export async function middleware(request: NextRequest) {
  // POST, PUT, PATCH 요청에 대해 body 검사
  if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
    try {
      const body = await request.json();
      const bodyString = JSON.stringify(body);
      
      if (containsBannedContent(bodyString)) {
        return NextResponse.json(
          { error: '허용되지 않은 내용이 포함되어 있습니다' },
          { status: 400 }
        );
      }
    } catch (error) {
      // JSON 파싱 실패는 무시 (파일 업로드 등)
    }
  }
  
  // ... 기존 미들웨어 로직
}
```

## 📋 구현 체크리스트

### NotificationSupabaseRepository
- [ ] Repository 구현 완료
- [ ] 유닛 테스트 작성
- [ ] API 엔드포인트와 연결
- [ ] 프론트엔드에서 테스트

### PaymentSupabaseRepository  
- [ ] Repository 구현 완료
- [ ] 유닛 테스트 작성
- [ ] 결제 프로세스 통합
- [ ] 관리자 페이지에서 확인

### 체크인 금액 계산
- [ ] PricingService 구현
- [ ] 시간대별 요금 정책 확정
- [ ] API Route 수정
- [ ] 테스트 및 검증

### 입력값 검증
- [ ] validation.ts 라이브러리 생성
- [ ] 모든 API 엔드포인트에 적용
- [ ] XSS/Injection 방지 테스트
- [ ] 에러 메시지 사용자 친화적으로 개선

## ⏱️ 예상 작업 시간

| 작업 | 예상 시간 | 우선순위 |
|------|-----------|----------|
| NotificationSupabaseRepository | 16시간 | 🔴 높음 |
| PaymentSupabaseRepository | 20시간 | 🔴 높음 |
| 체크인 금액 계산 | 8시간 | 🔴 높음 |
| 입력값 검증 | 8시간 | 🔴 높음 |
| **총 예상 시간** | **52시간** | - |

## 🚀 작업 순서 권장사항

1. **입력값 검증 먼저** - 다른 구현에도 필요
2. **PaymentSupabaseRepository** - 체크인 금액 계산과 연관
3. **체크인 금액 계산** - Payment와 함께 테스트
4. **NotificationSupabaseRepository** - 독립적으로 구현 가능

---

⚠️ **중요**: 각 구현 완료 후 반드시 테스트를 실행하고, 실제 Supabase 데이터베이스와 연동 테스트를 수행하세요.

💡 **팁**: Supabase 대시보드의 SQL Editor를 활용하여 테이블 구조를 확인하고, 필요한 경우 마이그레이션을 실행하세요.