/**
 * 사용자 직급 계산/관리 서비스
 *
 * 월별 순위 기반 직급 계산 및 직급 정보 관리 기능
 */

import { db } from '@/lib/db/database';
import {
  user_points,
  user_tiers,
  user_tier_current,
  monthly_rankings
} from '@/lib/db/schema';
import {
  UserTier,
  calculateUserTierFromRank,
  calculateUserTierFromPoints,
  rankUsersForTierCalculation,
  validateTierAssignment
} from '@/lib/utils/tier-calculation';
import { eq, and, desc, sql, inArray } from 'drizzle-orm';

// 타입 정의
export interface UserTierInfo {
  userId: string;
  currentTier: UserTier;
  currentPoints: number;
  currentRank: number | null;
  monthYear: string;
  calculatedAt: string;
  bestTier?: UserTier;
  bestRank?: number | null;
  bestPoints?: number;
}

export interface TierCalculationResult {
  userId: string;
  previousTier: UserTier;
  newTier: UserTier;
  previousRank: number | null;
  newRank: number | null;
  pointsUsed: number;
  monthYear: string;
  calculatedAt: string;
}

export interface TierDistribution {
  gampl_king: number;
  gampl_vip: number;
  gampl_regular: number;
  gampl_user: number;
  no_tier: number;
}

export interface MonthlyTierStats {
  monthYear: string;
  totalUsers: number;
  distribution: TierDistribution;
  averagePoints: number;
  topUserPoints: number;
}

/**
 * 특정 월의 모든 사용자 직급을 계산합니다
 * @param monthYear 계산할 월 (YYYY-MM 형식)
 * @returns 직급 계산 결과 목록
 */
export async function calculateTiersForMonth(
  monthYear: string
): Promise<TierCalculationResult[]> {
  try {
    // 1. 해당 월의 모든 사용자 포인트 집계
    const userMonthlyPoints = await db
      .select({
        userId: user_points.user_id,
        totalPoints: sql<number>`SUM(${user_points.points_earned})`,
        totalTransactions: sql<number>`COUNT(${user_points.id})`,
        totalSpent: sql<number>`SUM(${user_points.payment_amount})`
      })
      .from(user_points)
      .where(eq(user_points.month_year, monthYear))
      .groupBy(user_points.user_id)
      .having(sql`SUM(${user_points.points_earned}) > 0`);

    if (userMonthlyPoints.length === 0) {
      return [];
    }

    // 2. 순위 계산
    const userRankings = rankUsersForTierCalculation(
      userMonthlyPoints.map(user => ({
        userId: user.userId,
        points: user.totalPoints
      }))
    );

    // 3. 각 사용자의 이전 직급 정보 조회
    const userIds = userRankings.map(user => user.userId);
    const previousTiers = await db
      .select()
      .from(user_tier_current)
      .where(inArray(user_tier_current.user_id, userIds));

    const previousTierMap = new Map(
      previousTiers.map(tier => [tier.user_id, tier])
    );

    // 4. 새로운 직급 계산
    const calculationResults: TierCalculationResult[] = [];
    const calculatedAt = new Date().toISOString();

    for (const userRanking of userRankings) {
      const previousTier = previousTierMap.get(userRanking.userId);
      const newTier = validateTierAssignment(userRanking.rank, userRanking.points);

      calculationResults.push({
        userId: userRanking.userId,
        previousTier: previousTier?.current_tier as UserTier || UserTier.NO_TIER,
        newTier,
        previousRank: previousTier?.current_rank || null,
        newRank: userRanking.rank,
        pointsUsed: userRanking.points,
        monthYear,
        calculatedAt
      });
    }

    // 5. 직급 정보 저장
    await saveTierCalculationResults(calculationResults, monthYear);

    return calculationResults;

  } catch (error) {
    console.error('직급 계산 중 오류 발생:', error);
    throw new Error('직급을 계산할 수 없습니다');
  }
}

/**
 * 사용자의 현재 직급 정보를 조회합니다
 * @param userId 사용자 ID
 * @returns 사용자 직급 정보
 */
export async function getUserTierInfo(userId: string): Promise<UserTierInfo | null> {
  try {
    const [currentTier] = await db
      .select()
      .from(user_tier_current)
      .where(eq(user_tier_current.user_id, userId))
      .limit(1);

    if (!currentTier) {
      return null;
    }

    return {
      userId: currentTier.user_id,
      currentTier: currentTier.current_tier as UserTier,
      currentPoints: currentTier.current_points,
      currentRank: currentTier.current_rank,
      monthYear: currentTier.current_month,
      calculatedAt: currentTier.last_updated,
      bestTier: currentTier.best_tier as UserTier || undefined,
      bestRank: currentTier.best_rank || undefined,
      bestPoints: currentTier.best_points || undefined
    };

  } catch (error) {
    console.error('사용자 직급 정보 조회 중 오류:', error);
    throw new Error('사용자 직급 정보를 조회할 수 없습니다');
  }
}

/**
 * 특정 월의 직급 분포를 조회합니다
 * @param monthYear 조회할 월 (YYYY-MM 형식)
 * @returns 월별 직급 통계
 */
export async function getMonthlyTierStats(monthYear: string): Promise<MonthlyTierStats> {
  try {
    // 해당 월의 모든 직급 정보 조회
    const monthlyTiers = await db
      .select({
        tier: user_tiers.current_tier,
        points: user_tiers.current_points
      })
      .from(user_tiers)
      .where(eq(user_tiers.month_year, monthYear));

    if (monthlyTiers.length === 0) {
      return {
        monthYear,
        totalUsers: 0,
        distribution: {
          gampl_king: 0,
          gampl_vip: 0,
          gampl_regular: 0,
          gampl_user: 0,
          no_tier: 0
        },
        averagePoints: 0,
        topUserPoints: 0
      };
    }

    // 직급별 분포 계산
    const distribution: TierDistribution = {
      gampl_king: 0,
      gampl_vip: 0,
      gampl_regular: 0,
      gampl_user: 0,
      no_tier: 0
    };

    let totalPoints = 0;
    let maxPoints = 0;

    monthlyTiers.forEach(tierInfo => {
      const tier = tierInfo.tier as UserTier;
      distribution[tier]++;
      totalPoints += tierInfo.points;
      maxPoints = Math.max(maxPoints, tierInfo.points);
    });

    return {
      monthYear,
      totalUsers: monthlyTiers.length,
      distribution,
      averagePoints: Math.round(totalPoints / monthlyTiers.length),
      topUserPoints: maxPoints
    };

  } catch (error) {
    console.error('월별 직급 통계 조회 중 오류:', error);
    throw new Error('월별 직급 통계를 조회할 수 없습니다');
  }
}

/**
 * 특정 직급의 사용자 목록을 조회합니다
 * @param tier 조회할 직급
 * @param monthYear 조회할 월 (선택사항, 현재 월 기본)
 * @param limit 조회 개수 제한 (기본값: 100)
 * @returns 해당 직급의 사용자 목록
 */
export async function getUsersByTier(
  tier: UserTier,
  monthYear?: string,
  limit: number = 100
): Promise<Array<{
  userId: string;
  currentPoints: number;
  currentRank: number | null;
  monthYear: string;
}>> {
  try {
    let query = db
      .select({
        userId: user_tier_current.user_id,
        currentPoints: user_tier_current.current_points,
        currentRank: user_tier_current.current_rank,
        monthYear: user_tier_current.current_month
      })
      .from(user_tier_current)
      .where(eq(user_tier_current.current_tier, tier));

    if (monthYear) {
      query = query.where(
        and(
          eq(user_tier_current.current_tier, tier),
          eq(user_tier_current.current_month, monthYear)
        )
      );
    }

    const users = await query
      .orderBy(desc(user_tier_current.current_points))
      .limit(limit);

    return users;

  } catch (error) {
    console.error('직급별 사용자 조회 중 오류:', error);
    throw new Error('직급별 사용자 목록을 조회할 수 없습니다');
  }
}

/**
 * 사용자의 직급 변경 이력을 조회합니다
 * @param userId 사용자 ID
 * @param limit 조회 개수 제한 (기본값: 12, 최근 12개월)
 * @returns 직급 변경 이력
 */
export async function getUserTierHistory(
  userId: string,
  limit: number = 12
): Promise<Array<{
  monthYear: string;
  finalTier: UserTier;
  finalRank: number;
  finalPoints: number;
  totalTransactions: number;
  totalSpent: number;
  settlementDate: string;
}>> {
  try {
    const tierHistory = await db
      .select({
        monthYear: monthly_rankings.month_year,
        finalTier: monthly_rankings.achieved_tier,
        finalRank: monthly_rankings.final_rank,
        finalPoints: monthly_rankings.final_points,
        totalTransactions: monthly_rankings.total_transactions,
        totalSpent: monthly_rankings.total_spent,
        settlementDate: monthly_rankings.settlement_date
      })
      .from(monthly_rankings)
      .where(eq(monthly_rankings.user_id, userId))
      .orderBy(desc(monthly_rankings.month_year))
      .limit(limit);

    return tierHistory.map(history => ({
      ...history,
      finalTier: history.finalTier as UserTier
    }));

  } catch (error) {
    console.error('사용자 직급 이력 조회 중 오류:', error);
    throw new Error('사용자 직급 이력을 조회할 수 없습니다');
  }
}

/**
 * 특정 사용자의 직급을 수동으로 업데이트합니다 (관리자 기능)
 * @param userId 사용자 ID
 * @param newTier 새로운 직급
 * @param newRank 새로운 순위 (선택사항)
 * @param reason 변경 사유
 * @returns 업데이트 결과
 */
export async function updateUserTierManually(
  userId: string,
  newTier: UserTier,
  newRank: number | null = null,
  reason: string = '관리자 수동 변경'
): Promise<{
  success: boolean;
  previousTier: UserTier | null;
  newTier: UserTier;
  updatedAt: string;
}> {
  try {
    // 현재 직급 정보 조회
    const currentTierInfo = await getUserTierInfo(userId);
    const previousTier = currentTierInfo?.currentTier || null;

    // KST 기준 현재 시간
    const now = new Date();
    const kstNow = new Date(now.getTime() + (9 * 60 * 60 * 1000));
    const updatedAt = kstNow.toISOString();
    const monthYear = `${kstNow.getFullYear()}-${String(kstNow.getMonth() + 1).padStart(2, '0')}`;

    // 직급 정보 업데이트
    await db
      .insert(user_tier_current)
      .values({
        user_id: userId,
        current_tier: newTier,
        current_rank: newRank,
        current_month: monthYear,
        last_updated: updatedAt
      })
      .onConflictDoUpdate({
        target: user_tier_current.user_id,
        set: {
          current_tier: newTier,
          current_rank: newRank,
          current_month: monthYear,
          last_updated: updatedAt
        }
      });

    // 변경 로그 기록 (필요시 별도 테이블에 저장)
    console.log(`사용자 직급 수동 변경: ${userId}, ${previousTier} -> ${newTier}, 사유: ${reason}`);

    return {
      success: true,
      previousTier,
      newTier,
      updatedAt
    };

  } catch (error) {
    console.error('사용자 직급 수동 업데이트 중 오류:', error);
    throw new Error('사용자 직급을 업데이트할 수 없습니다');
  }
}

/**
 * 현재 월의 실시간 순위를 조회합니다
 * @param monthYear 조회할 월 (선택사항, 현재 월 기본)
 * @param limit 조회 개수 제한 (기본값: 50)
 * @returns 실시간 순위 목록
 */
export async function getCurrentRankings(
  monthYear?: string,
  limit: number = 50
): Promise<Array<{
  userId: string;
  currentPoints: number;
  currentRank: number | null;
  currentTier: UserTier;
  monthYear: string;
}>> {
  try {
    // 현재 월 계산 (monthYear가 없는 경우)
    if (!monthYear) {
      const now = new Date();
      const kstNow = new Date(now.getTime() + (9 * 60 * 60 * 1000));
      monthYear = `${kstNow.getFullYear()}-${String(kstNow.getMonth() + 1).padStart(2, '0')}`;
    }

    const rankings = await db
      .select({
        userId: user_tier_current.user_id,
        currentPoints: user_tier_current.current_points,
        currentRank: user_tier_current.current_rank,
        currentTier: user_tier_current.current_tier,
        monthYear: user_tier_current.current_month
      })
      .from(user_tier_current)
      .where(eq(user_tier_current.current_month, monthYear))
      .orderBy(desc(user_tier_current.current_points))
      .limit(limit);

    return rankings.map(ranking => ({
      ...ranking,
      currentTier: ranking.currentTier as UserTier
    }));

  } catch (error) {
    console.error('현재 순위 조회 중 오류:', error);
    throw new Error('현재 순위를 조회할 수 없습니다');
  }
}

/**
 * 직급 계산 결과를 데이터베이스에 저장합니다 (내부 함수)
 * @param results 직급 계산 결과 목록
 * @param monthYear 계산 대상 월
 */
async function saveTierCalculationResults(
  results: TierCalculationResult[],
  monthYear: string
): Promise<void> {
  await db.transaction(async (tx) => {
    // 1. user_tiers 테이블에 월별 직급 정보 저장
    for (const result of results) {
      await tx
        .insert(user_tiers)
        .values({
          user_id: result.userId,
          current_tier: result.newTier,
          current_points: result.pointsUsed,
          current_rank: result.newRank,
          month_year: monthYear,
          calculated_at: result.calculatedAt
        })
        .onConflictDoUpdate({
          target: [user_tiers.user_id, user_tiers.month_year],
          set: {
            current_tier: result.newTier,
            current_points: result.pointsUsed,
            current_rank: result.newRank,
            calculated_at: result.calculatedAt,
            updated_at: result.calculatedAt
          }
        });
    }

    // 2. user_tier_current 테이블에 현재 직급 정보 업데이트
    for (const result of results) {
      // 최고 기록 확인
      const [bestRecord] = await tx
        .select({
          bestTier: monthly_rankings.achieved_tier,
          bestRank: sql<number>`MIN(${monthly_rankings.final_rank})`,
          bestPoints: sql<number>`MAX(${monthly_rankings.final_points})`
        })
        .from(monthly_rankings)
        .where(eq(monthly_rankings.user_id, result.userId));

      await tx
        .insert(user_tier_current)
        .values({
          user_id: result.userId,
          current_tier: result.newTier,
          current_points: result.pointsUsed,
          current_rank: result.newRank,
          current_month: monthYear,
          best_tier: bestRecord?.bestTier || result.newTier,
          best_rank: bestRecord?.bestRank || result.newRank,
          best_points: bestRecord?.bestPoints || result.pointsUsed,
          last_updated: result.calculatedAt
        })
        .onConflictDoUpdate({
          target: user_tier_current.user_id,
          set: {
            current_tier: result.newTier,
            current_points: result.pointsUsed,
            current_rank: result.newRank,
            current_month: monthYear,
            last_updated: result.calculatedAt
          }
        });
    }
  });
}