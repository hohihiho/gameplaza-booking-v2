/**
 * 월별 정산 서비스
 *
 * 매월 1일 6시에 실행되는 포인트 순위 기반 직급 정산 시스템
 */

import { db } from '@/lib/db/database';
import {
  user_points,
  user_tiers,
  user_tier_current,
  monthly_rankings
} from '@/lib/db/schema';
import { calculateTiersForMonth, TierDistribution } from '@/lib/services/user-tiers.service';
import { UserTier, rankUsersForTierCalculation } from '@/lib/utils/tier-calculation';
import { eq, and, desc, sql, ne } from 'drizzle-orm';

// 타입 정의
export enum SettlementStatus {
  SUCCESS = 'success',
  FAILED = 'failed',
  IN_PROGRESS = 'in_progress',
  CANCELLED = 'cancelled'
}

export interface SettlementResult {
  status: SettlementStatus;
  processedMonth: string;
  processedUsers: number;
  totalPointsProcessed: number;
  tierDistribution: TierDistribution;
  executionTime: number;
  errors: string[];
  startTime: string;
  endTime: string;
}

export interface UserRankingData {
  userId: string;
  totalPoints: number;
  rank: number;
  totalTransactions: number;
  totalSpent: number;
  tier: UserTier;
  previousTier?: UserTier;
}

export interface SettlementOptions {
  dryRun?: boolean;
  forceRun?: boolean;
  maxUsers?: number;
  notifyUsers?: boolean;
}

/**
 * 월별 정산을 실행합니다 (매월 1일 6시)
 * @param monthYear 정산할 월 (YYYY-MM 형식)
 * @param options 정산 옵션
 * @returns 정산 결과
 */
export async function runMonthlySettlement(
  monthYear: string,
  options: SettlementOptions = {}
): Promise<SettlementResult> {
  const startTime = new Date().toISOString();
  const start = performance.now();

  let result: SettlementResult = {
    status: SettlementStatus.IN_PROGRESS,
    processedMonth: monthYear,
    processedUsers: 0,
    totalPointsProcessed: 0,
    tierDistribution: {
      gampl_king: 0,
      gampl_vip: 0,
      gampl_regular: 0,
      gampl_user: 0,
      no_tier: 0
    },
    executionTime: 0,
    errors: [],
    startTime,
    endTime: ''
  };

  try {
    // 1. 정산 조건 검증
    if (!options.forceRun) {
      await validateSettlementConditions(monthYear);
    }

    // 2. 중복 정산 확인
    const existingSettlement = await checkExistingSettlement(monthYear);
    if (existingSettlement && !options.dryRun) {
      throw new Error(`${monthYear}월은 이미 정산이 완료되었습니다`);
    }

    console.log(`🏁 월별 정산 시작: ${monthYear}`);

    // 3. 월간 랭킹 계산
    const rankings = await calculateMonthlyRankings(monthYear, options.maxUsers);

    if (rankings.length === 0) {
      console.log(`⚠️  ${monthYear}월에 포인트를 획득한 사용자가 없습니다`);

      result.status = SettlementStatus.SUCCESS;
      result.executionTime = performance.now() - start;
      result.endTime = new Date().toISOString();
      return result;
    }

    // 4. 직급 분포 계산
    const tierDistribution = calculateTierDistribution(rankings);

    // 5. 데이터 아카이빙 (dry run이 아닌 경우)
    if (!options.dryRun) {
      const settlementDate = new Date();
      await archiveMonthlyData(monthYear, rankings, settlementDate);
    }

    // 6. 사용자 포인트 초기화 (dry run이 아닌 경우)
    if (!options.dryRun) {
      const userIds = rankings.map(r => r.userId);
      const nextMonth = getNextMonth(monthYear);
      await resetUserPoints(userIds, nextMonth);
    }

    // 7. 사용자 알림 (옵션에 따라)
    if (options.notifyUsers && !options.dryRun) {
      await notifyUsersAboutTierChanges(rankings);
    }

    // 8. 결과 집계
    const totalPoints = rankings.reduce((sum, r) => sum + r.totalPoints, 0);

    result = {
      status: SettlementStatus.SUCCESS,
      processedMonth: monthYear,
      processedUsers: rankings.length,
      totalPointsProcessed: totalPoints,
      tierDistribution,
      executionTime: performance.now() - start,
      errors: [],
      startTime,
      endTime: new Date().toISOString()
    };

    console.log(`✅ 월별 정산 완료: ${monthYear}, ${rankings.length}명 처리`);
    console.log(`📊 직급 분포:`, tierDistribution);

    return result;

  } catch (error) {
    console.error(`❌ 월별 정산 실패: ${monthYear}`, error);

    result = {
      ...result,
      status: SettlementStatus.FAILED,
      executionTime: performance.now() - start,
      errors: [error instanceof Error ? error.message : String(error)],
      endTime: new Date().toISOString()
    };

    // 실패 시 롤백 시도
    if (!options.dryRun) {
      try {
        await rollbackSettlement(monthYear);
        console.log(`🔄 정산 롤백 완료: ${monthYear}`);
      } catch (rollbackError) {
        console.error(`❌ 정산 롤백 실패: ${monthYear}`, rollbackError);
        result.errors.push(`롤백 실패: ${rollbackError instanceof Error ? rollbackError.message : String(rollbackError)}`);
      }
    }

    return result;
  }
}

/**
 * 특정 월의 사용자 랭킹을 계산합니다
 * @param monthYear 계산할 월
 * @param maxUsers 최대 사용자 수 제한
 * @returns 사용자 랭킹 데이터
 */
export async function calculateMonthlyRankings(
  monthYear: string,
  maxUsers?: number
): Promise<UserRankingData[]> {
  try {
    // 1. 사용자별 월간 포인트 집계
    let query = db
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

    if (maxUsers) {
      query = query.limit(maxUsers);
    }

    const userMonthlyPoints = await query;

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

    // 3. 이전 직급 정보 조회
    const userIds = userRankings.map(user => user.userId);
    const previousTiers = await db
      .select({
        userId: user_tier_current.user_id,
        previousTier: user_tier_current.current_tier
      })
      .from(user_tier_current)
      .where(sql`${user_tier_current.user_id} IN ${userIds}`);

    const previousTierMap = new Map(
      previousTiers.map(tier => [tier.userId, tier.previousTier as UserTier])
    );

    // 4. 직급 계산 및 결과 생성
    const rankings: UserRankingData[] = [];

    for (const userRanking of userRankings) {
      const userMonthlyData = userMonthlyPoints.find(
        u => u.userId === userRanking.userId
      );

      if (!userMonthlyData) continue;

      // 순위에 따른 직급 결정
      let tier: UserTier;
      if (userRanking.rank === 1) {
        tier = UserTier.GAMPL_KING;
      } else if (userRanking.rank >= 2 && userRanking.rank <= 5) {
        tier = UserTier.GAMPL_VIP;
      } else if (userRanking.rank >= 6 && userRanking.rank <= 15) {
        tier = UserTier.GAMPL_REGULAR;
      } else {
        tier = UserTier.GAMPL_USER;
      }

      rankings.push({
        userId: userRanking.userId,
        totalPoints: userRanking.points,
        rank: userRanking.rank,
        totalTransactions: userMonthlyData.totalTransactions,
        totalSpent: userMonthlyData.totalSpent,
        tier,
        previousTier: previousTierMap.get(userRanking.userId)
      });
    }

    return rankings.sort((a, b) => a.rank - b.rank);

  } catch (error) {
    console.error('월간 랭킹 계산 중 오류:', error);
    throw new Error('월간 랭킹을 계산할 수 없습니다');
  }
}

/**
 * 월별 랭킹 데이터를 아카이빙합니다
 * @param monthYear 아카이빙할 월
 * @param rankings 사용자 랭킹 데이터
 * @param settlementDate 정산 일시
 */
export async function archiveMonthlyData(
  monthYear: string,
  rankings: UserRankingData[],
  settlementDate: Date
): Promise<void> {
  try {
    await db.transaction(async (tx) => {
      // 1. monthly_rankings 테이블에 히스토리 저장
      for (const ranking of rankings) {
        await tx.insert(monthly_rankings).values({
          user_id: ranking.userId,
          month_year: monthYear,
          final_points: ranking.totalPoints,
          final_rank: ranking.rank,
          achieved_tier: ranking.tier,
          total_transactions: ranking.totalTransactions,
          total_spent: ranking.totalSpent,
          settlement_date: settlementDate.toISOString()
        });
      }

      // 2. user_tiers 테이블에 월별 직급 정보 저장
      const calculatedAt = settlementDate.toISOString();

      for (const ranking of rankings) {
        await tx.insert(user_tiers).values({
          user_id: ranking.userId,
          current_tier: ranking.tier,
          current_points: ranking.totalPoints,
          current_rank: ranking.rank,
          month_year: monthYear,
          calculated_at: calculatedAt
        });
      }

      console.log(`📂 데이터 아카이빙 완료: ${monthYear}, ${rankings.length}건`);
    });

  } catch (error) {
    console.error('데이터 아카이빙 중 오류:', error);
    throw new Error('데이터를 아카이빙할 수 없습니다');
  }
}

/**
 * 사용자별 포인트를 초기화합니다 (새로운 월로 이동)
 * @param userIds 초기화할 사용자 ID 목록
 * @param newMonthYear 새로운 월
 */
export async function resetUserPoints(
  userIds: string[],
  newMonthYear: string
): Promise<void> {
  try {
    await db.transaction(async (tx) => {
      for (const userId of userIds) {
        // user_tier_current 테이블에서 포인트 0으로 초기화
        await tx
          .insert(user_tier_current)
          .values({
            user_id: userId,
            current_tier: UserTier.NO_TIER,
            current_points: 0,
            current_rank: null,
            current_month: newMonthYear,
            last_updated: new Date().toISOString()
          })
          .onConflictDoUpdate({
            target: user_tier_current.user_id,
            set: {
              current_points: 0,
              current_rank: null,
              current_month: newMonthYear,
              last_updated: new Date().toISOString()
            }
          });
      }
    });

    console.log(`🔄 사용자 포인트 초기화 완료: ${userIds.length}명, 새 월: ${newMonthYear}`);

  } catch (error) {
    console.error('사용자 포인트 초기화 중 오류:', error);
    throw new Error('사용자 포인트를 초기화할 수 없습니다');
  }
}

/**
 * 정산 조건을 검증합니다
 * @param monthYear 정산할 월
 */
export async function validateSettlementConditions(monthYear: string): Promise<void> {
  // 1. 정산 시간 확인 (매월 1일 6시)
  const now = new Date();
  const kstNow = new Date(now.getTime() + (9 * 60 * 60 * 1000));

  if (kstNow.getDate() !== 1 || kstNow.getHours() !== 6) {
    throw new Error('월별 정산은 매월 1일 6시에만 실행할 수 있습니다');
  }

  // 2. 정산 대상 월 검증
  const [year, month] = monthYear.split('-').map(Number);
  const settlementMonth = new Date(year, month - 1);
  const currentMonth = new Date(kstNow.getFullYear(), kstNow.getMonth());

  if (settlementMonth >= currentMonth) {
    throw new Error('미래 월은 정산할 수 없습니다');
  }

  // 3. 데이터 존재 여부 확인
  const [hasData] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(user_points)
    .where(eq(user_points.month_year, monthYear));

  if (hasData.count === 0) {
    console.warn(`⚠️  ${monthYear}월에 포인트 데이터가 없습니다`);
  }
}

/**
 * 기존 정산 데이터 존재 여부를 확인합니다
 * @param monthYear 확인할 월
 * @returns 기존 정산 존재 여부
 */
export async function checkExistingSettlement(monthYear: string): Promise<boolean> {
  const [existingRanking] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(monthly_rankings)
    .where(eq(monthly_rankings.month_year, monthYear));

  return existingRanking.count > 0;
}

/**
 * 직급 분포를 계산합니다
 * @param rankings 사용자 랭킹 데이터
 * @returns 직급 분포
 */
function calculateTierDistribution(rankings: UserRankingData[]): TierDistribution {
  const distribution: TierDistribution = {
    gampl_king: 0,
    gampl_vip: 0,
    gampl_regular: 0,
    gampl_user: 0,
    no_tier: 0
  };

  rankings.forEach(ranking => {
    distribution[ranking.tier]++;
  });

  return distribution;
}

/**
 * 다음 월을 계산합니다
 * @param monthYear 현재 월 (YYYY-MM)
 * @returns 다음 월 (YYYY-MM)
 */
function getNextMonth(monthYear: string): string {
  const [year, month] = monthYear.split('-').map(Number);
  const nextDate = new Date(year, month); // month는 0부터 시작하므로 +1 효과

  return `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * 정산 실패 시 롤백을 수행합니다
 * @param monthYear 롤백할 월
 */
async function rollbackSettlement(monthYear: string): Promise<void> {
  await db.transaction(async (tx) => {
    // 생성된 월별 랭킹 데이터 삭제
    await tx
      .delete(monthly_rankings)
      .where(eq(monthly_rankings.month_year, monthYear));

    // 생성된 월별 직급 데이터 삭제
    await tx
      .delete(user_tiers)
      .where(eq(user_tiers.month_year, monthYear));

    console.log(`🔄 정산 데이터 롤백 완료: ${monthYear}`);
  });
}

/**
 * 직급 변경에 대해 사용자에게 알림을 발송합니다
 * @param rankings 사용자 랭킹 데이터
 */
async function notifyUsersAboutTierChanges(rankings: UserRankingData[]): Promise<void> {
  try {
    const changedTierUsers = rankings.filter(
      ranking => ranking.previousTier && ranking.previousTier !== ranking.tier
    );

    for (const user of changedTierUsers) {
      // 실제 구현에서는 푸시 알림, 이메일, SMS 등을 발송
      console.log(
        `📱 직급 변경 알림: ${user.userId}, ${user.previousTier} → ${user.tier} (${user.rank}위)`
      );
    }

    console.log(`📢 총 ${changedTierUsers.length}명에게 직급 변경 알림 발송`);

  } catch (error) {
    console.error('사용자 알림 발송 중 오류:', error);
    // 알림 실패는 전체 정산을 실패시키지 않음
  }
}

/**
 * 정산 상태를 조회합니다
 * @param monthYear 조회할 월
 * @returns 정산 상태 정보
 */
export async function getSettlementStatus(
  monthYear: string
): Promise<{
  isSettled: boolean;
  settlementDate?: string;
  userCount?: number;
  totalPoints?: number;
  tierDistribution?: TierDistribution;
}> {
  try {
    const [settlementInfo] = await db
      .select({
        userCount: sql<number>`COUNT(*)`,
        totalPoints: sql<number>`SUM(${monthly_rankings.final_points})`,
        settlementDate: monthly_rankings.settlement_date
      })
      .from(monthly_rankings)
      .where(eq(monthly_rankings.month_year, monthYear));

    if (!settlementInfo || settlementInfo.userCount === 0) {
      return { isSettled: false };
    }

    // 직급 분포 조회
    const tierStats = await db
      .select({
        tier: monthly_rankings.achieved_tier,
        count: sql<number>`COUNT(*)`
      })
      .from(monthly_rankings)
      .where(eq(monthly_rankings.month_year, monthYear))
      .groupBy(monthly_rankings.achieved_tier);

    const tierDistribution: TierDistribution = {
      gampl_king: 0,
      gampl_vip: 0,
      gampl_regular: 0,
      gampl_user: 0,
      no_tier: 0
    };

    tierStats.forEach(stat => {
      const tier = stat.tier as UserTier;
      tierDistribution[tier] = stat.count;
    });

    return {
      isSettled: true,
      settlementDate: settlementInfo.settlementDate,
      userCount: settlementInfo.userCount,
      totalPoints: settlementInfo.totalPoints,
      tierDistribution
    };

  } catch (error) {
    console.error('정산 상태 조회 중 오류:', error);
    throw new Error('정산 상태를 조회할 수 없습니다');
  }
}