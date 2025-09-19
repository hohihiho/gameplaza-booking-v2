/**
 * 포인트 적립/조회 서비스
 *
 * 결제 완료 시 포인트 적립 및 사용자 포인트 조회 기능
 */

import { db } from '@/lib/db/database';
import { user_points, payment_transactions, user_tier_current } from '@/lib/db/schema';
import { calculatePointsFromPayment, validatePointsCalculation } from '@/lib/utils/point-calculation';
import { eq, and, desc, sql } from 'drizzle-orm';

// 타입 정의
export interface PointsAccumulationResult {
  success: boolean;
  pointsEarned: number;
  transactionId: number;
  userId: string;
  errors: string[];
}

export interface MonthlyPointsSummary {
  userId: string;
  monthYear: string;
  totalPoints: number;
  totalTransactions: number;
  totalSpent: number;
  averagePointsPerTransaction: number;
  firstAccumulation: string | null;
  lastAccumulation: string | null;
}

export interface UserCurrentPoints {
  userId: string;
  currentMonthPoints: number;
  currentRank: number | null;
  currentTier: string;
  monthYear: string;
  lastUpdated: string;
}

/**
 * 결제 완료 시 포인트를 적립합니다
 * @param paymentTransactionId 결제 트랜잭션 ID
 * @returns 포인트 적립 결과
 */
export async function accumulatePointsFromPayment(
  paymentTransactionId: number
): Promise<PointsAccumulationResult> {
  try {
    // 결제 트랜잭션 조회
    const [paymentTransaction] = await db
      .select()
      .from(payment_transactions)
      .where(eq(payment_transactions.id, paymentTransactionId))
      .limit(1);

    if (!paymentTransaction) {
      return {
        success: false,
        pointsEarned: 0,
        transactionId: paymentTransactionId,
        userId: '',
        errors: ['결제 정보를 찾을 수 없습니다']
      };
    }

    // 결제 상태 확인
    if (paymentTransaction.status !== 'completed') {
      return {
        success: false,
        pointsEarned: 0,
        transactionId: paymentTransactionId,
        userId: paymentTransaction.user_id,
        errors: ['완료되지 않은 결제에는 포인트를 적립할 수 없습니다']
      };
    }

    // 중복 적립 방지 - 이미 처리된 결제인지 확인
    const [existingPoints] = await db
      .select()
      .from(user_points)
      .where(eq(user_points.payment_transaction_id, paymentTransactionId))
      .limit(1);

    if (existingPoints) {
      return {
        success: false,
        pointsEarned: 0,
        transactionId: paymentTransactionId,
        userId: paymentTransaction.user_id,
        errors: ['이미 포인트가 적립된 결제입니다']
      };
    }

    // 포인트 계산
    const pointsEarned = calculatePointsFromPayment(paymentTransaction.amount);

    // KST 기준 현재 시간 및 월별 구분
    const now = new Date();
    const kstNow = new Date(now.getTime() + (9 * 60 * 60 * 1000));
    const monthYear = `${kstNow.getFullYear()}-${String(kstNow.getMonth() + 1).padStart(2, '0')}`;
    const earnedAt = kstNow.toISOString().replace('Z', '+09:00');

    // 트랜잭션으로 포인트 적립 및 결제 상태 업데이트
    await db.transaction(async (tx) => {
      // 1. 포인트 적립 레코드 생성
      await tx.insert(user_points).values({
        user_id: paymentTransaction.user_id,
        payment_transaction_id: paymentTransactionId,
        points_earned: pointsEarned,
        payment_amount: paymentTransaction.amount,
        month_year: monthYear,
        earned_at: earnedAt,
        created_at: earnedAt
      });

      // 2. 사용자 현재 포인트 업데이트
      await updateUserCurrentPoints(tx, paymentTransaction.user_id, monthYear);
    });

    return {
      success: true,
      pointsEarned,
      transactionId: paymentTransactionId,
      userId: paymentTransaction.user_id,
      errors: []
    };

  } catch (error) {
    console.error('포인트 적립 중 오류 발생:', error);

    return {
      success: false,
      pointsEarned: 0,
      transactionId: paymentTransactionId,
      userId: '',
      errors: [error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다']
    };
  }
}

/**
 * 사용자의 월별 포인트 요약을 조회합니다
 * @param userId 사용자 ID
 * @param monthYear 조회할 월 (YYYY-MM 형식)
 * @returns 월별 포인트 요약
 */
export async function getMonthlyPointsSummary(
  userId: string,
  monthYear: string
): Promise<MonthlyPointsSummary> {
  try {
    const monthlyPoints = await db
      .select({
        points_earned: user_points.points_earned,
        payment_amount: user_points.payment_amount,
        earned_at: user_points.earned_at
      })
      .from(user_points)
      .where(
        and(
          eq(user_points.user_id, userId),
          eq(user_points.month_year, monthYear)
        )
      )
      .orderBy(desc(user_points.earned_at));

    if (monthlyPoints.length === 0) {
      return {
        userId,
        monthYear,
        totalPoints: 0,
        totalTransactions: 0,
        totalSpent: 0,
        averagePointsPerTransaction: 0,
        firstAccumulation: null,
        lastAccumulation: null
      };
    }

    const totalPoints = monthlyPoints.reduce((sum, point) => sum + point.points_earned, 0);
    const totalSpent = monthlyPoints.reduce((sum, point) => sum + point.payment_amount, 0);
    const totalTransactions = monthlyPoints.length;

    // 날짜순 정렬
    const sortedPoints = monthlyPoints.sort((a, b) =>
      new Date(a.earned_at).getTime() - new Date(b.earned_at).getTime()
    );

    return {
      userId,
      monthYear,
      totalPoints,
      totalTransactions,
      totalSpent,
      averagePointsPerTransaction: totalPoints / totalTransactions,
      firstAccumulation: sortedPoints[0]?.earned_at || null,
      lastAccumulation: sortedPoints[sortedPoints.length - 1]?.earned_at || null
    };

  } catch (error) {
    console.error('월별 포인트 요약 조회 중 오류:', error);
    throw new Error('월별 포인트 요약을 조회할 수 없습니다');
  }
}

/**
 * 사용자의 현재 포인트 상태를 조회합니다
 * @param userId 사용자 ID
 * @returns 현재 포인트 상태
 */
export async function getUserCurrentPoints(userId: string): Promise<UserCurrentPoints | null> {
  try {
    const [currentPoints] = await db
      .select()
      .from(user_tier_current)
      .where(eq(user_tier_current.user_id, userId))
      .limit(1);

    if (!currentPoints) {
      return null;
    }

    return {
      userId: currentPoints.user_id,
      currentMonthPoints: currentPoints.current_points,
      currentRank: currentPoints.current_rank,
      currentTier: currentPoints.current_tier,
      monthYear: currentPoints.current_month,
      lastUpdated: currentPoints.last_updated
    };

  } catch (error) {
    console.error('현재 포인트 조회 중 오류:', error);
    throw new Error('현재 포인트 상태를 조회할 수 없습니다');
  }
}

/**
 * 특정 기간의 포인트 내역을 조회합니다
 * @param userId 사용자 ID
 * @param startDate 시작 날짜 (ISO 문자열)
 * @param endDate 종료 날짜 (ISO 문자열)
 * @param limit 조회 개수 제한 (기본값: 50)
 * @returns 포인트 내역 목록
 */
export async function getPointsHistory(
  userId: string,
  startDate: string,
  endDate: string,
  limit: number = 50
): Promise<Array<{
  id: number;
  pointsEarned: number;
  paymentAmount: number;
  monthYear: string;
  earnedAt: string;
  paymentTransactionId: number | null;
}>> {
  try {
    const pointsHistory = await db
      .select({
        id: user_points.id,
        pointsEarned: user_points.points_earned,
        paymentAmount: user_points.payment_amount,
        monthYear: user_points.month_year,
        earnedAt: user_points.earned_at,
        paymentTransactionId: user_points.payment_transaction_id
      })
      .from(user_points)
      .where(
        and(
          eq(user_points.user_id, userId),
          sql`${user_points.earned_at} >= ${startDate}`,
          sql`${user_points.earned_at} <= ${endDate}`
        )
      )
      .orderBy(desc(user_points.earned_at))
      .limit(limit);

    return pointsHistory;

  } catch (error) {
    console.error('포인트 내역 조회 중 오류:', error);
    throw new Error('포인트 내역을 조회할 수 없습니다');
  }
}

/**
 * 포인트 적립이 올바른지 검증합니다
 * @param paymentAmount 결제 금액
 * @param pointsEarned 적립된 포인트
 * @returns 검증 성공 여부
 */
export async function validatePointsAccumulation(
  paymentAmount: number,
  pointsEarned: number
): Promise<boolean> {
  return validatePointsCalculation(paymentAmount, pointsEarned);
}

/**
 * 사용자의 현재 포인트 정보를 업데이트합니다 (내부 함수)
 * @param tx 트랜잭션 객체
 * @param userId 사용자 ID
 * @param monthYear 월년도
 */
async function updateUserCurrentPoints(
  tx: any,
  userId: string,
  monthYear: string
): Promise<void> {
  // 현재 월의 총 포인트 계산
  const [currentMonthPoints] = await tx
    .select({
      totalPoints: sql<number>`COALESCE(SUM(${user_points.points_earned}), 0)`
    })
    .from(user_points)
    .where(
      and(
        eq(user_points.user_id, userId),
        eq(user_points.month_year, monthYear)
      )
    );

  const totalPoints = currentMonthPoints?.totalPoints || 0;

  // user_tier_current 테이블 업데이트 또는 생성
  await tx
    .insert(user_tier_current)
    .values({
      user_id: userId,
      current_points: totalPoints,
      current_month: monthYear,
      last_updated: new Date().toISOString()
    })
    .onConflictDoUpdate({
      target: user_tier_current.user_id,
      set: {
        current_points: totalPoints,
        current_month: monthYear,
        last_updated: new Date().toISOString()
      }
    });
}

/**
 * 대량의 결제 트랜잭션에 대해 배치로 포인트를 적립합니다
 * @param paymentTransactionIds 결제 트랜잭션 ID 목록
 * @param batchSize 배치 크기 (기본값: 100)
 * @returns 배치 처리 결과
 */
export async function batchAccumulatePoints(
  paymentTransactionIds: number[],
  batchSize: number = 100
): Promise<{
  totalProcessed: number;
  successful: number;
  failed: number;
  errors: string[];
}> {
  const results = {
    totalProcessed: 0,
    successful: 0,
    failed: 0,
    errors: [] as string[]
  };

  // 배치 단위로 처리
  for (let i = 0; i < paymentTransactionIds.length; i += batchSize) {
    const batch = paymentTransactionIds.slice(i, i + batchSize);

    // 병렬 처리
    const batchPromises = batch.map(async (transactionId) => {
      try {
        const result = await accumulatePointsFromPayment(transactionId);
        return result;
      } catch (error) {
        return {
          success: false,
          pointsEarned: 0,
          transactionId: transactionId,
          userId: '',
          errors: [error instanceof Error ? error.message : '알 수 없는 오류']
        };
      }
    });

    const batchResults = await Promise.all(batchPromises);

    // 결과 집계
    batchResults.forEach(result => {
      results.totalProcessed++;
      if (result.success) {
        results.successful++;
      } else {
        results.failed++;
        results.errors.push(...result.errors);
      }
    });
  }

  return results;
}