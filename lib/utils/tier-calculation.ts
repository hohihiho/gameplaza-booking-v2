/**
 * 직급 계산 유틸리티
 *
 * 월별 순위 기반 사용자 직급 분류 로직
 */

export enum UserTier {
  GAMPL_KING = 'gampl_king',
  GAMPL_VIP = 'gampl_vip',
  GAMPL_REGULAR = 'gampl_regular',
  GAMPL_USER = 'gampl_user',
  NO_TIER = 'no_tier'
}

/**
 * 순위에 따른 직급을 계산합니다
 * @param rank 사용자 순위 (1부터 시작)
 * @returns 계산된 직급
 */
export function calculateUserTierFromRank(rank: number): UserTier {
  // 입력값 검증
  if (typeof rank !== 'number' || !Number.isFinite(rank)) {
    throw new Error('유효하지 않은 순위입니다');
  }

  if (rank <= 0) {
    throw new Error('순위는 1 이상이어야 합니다');
  }

  // 순위별 직급 분류
  if (rank === 1) {
    return UserTier.GAMPL_KING;
  } else if (rank >= 2 && rank <= 5) {
    return UserTier.GAMPL_VIP;
  } else if (rank >= 6 && rank <= 15) {
    return UserTier.GAMPL_REGULAR;
  } else {
    return UserTier.GAMPL_USER;
  }
}

/**
 * 포인트에 따른 기본 직급을 계산합니다 (순위가 없는 경우)
 * @param points 사용자 포인트
 * @returns 계산된 직급
 */
export function calculateUserTierFromPoints(points: number): UserTier {
  // 입력값 검증
  if (typeof points !== 'number' || !Number.isFinite(points)) {
    throw new Error('유효하지 않은 포인트입니다');
  }

  if (points < 0) {
    throw new Error('포인트는 0 이상이어야 합니다');
  }

  // 1포인트 이상이면 겜플유저, 0포인트면 직급 없음
  return points >= 1 ? UserTier.GAMPL_USER : UserTier.NO_TIER;
}

/**
 * 사용자 목록을 포인트 기준으로 순위를 매깁니다
 * @param users 사용자 목록 (userId와 points 포함)
 * @returns 순위가 매겨진 사용자 목록
 */
export function rankUsersForTierCalculation(
  users: Array<{ userId: string; points: number }>
): Array<{ userId: string; points: number; rank: number }> {
  if (!Array.isArray(users) || users.length === 0) {
    return [];
  }

  // 포인트 기준 내림차순 정렬
  const sortedUsers = [...users].sort((a, b) => b.points - a.points);

  // 순위 계산 (동점자 처리)
  const rankings = [];
  let currentRank = 1;

  for (let i = 0; i < sortedUsers.length; i++) {
    // 이전 사용자와 포인트가 다르면 순위 업데이트
    if (i > 0 && sortedUsers[i].points !== sortedUsers[i - 1].points) {
      currentRank = i + 1;
    }

    rankings.push({
      ...sortedUsers[i],
      rank: currentRank
    });
  }

  return rankings;
}

/**
 * 순위와 포인트 조건을 검증하여 최종 직급을 결정합니다
 * @param rank 사용자 순위 (null이면 순위 없음)
 * @param points 사용자 포인트
 * @returns 검증된 직급
 */
export function validateTierAssignment(
  rank: number | null,
  points: number
): UserTier {
  // 순위가 1위인데 포인트가 0인 경우는 논리적 모순
  if (rank === 1 && points === 0) {
    throw new Error('1위는 반드시 1포인트 이상이어야 합니다');
  }

  // 순위가 없는 경우 포인트만으로 판단
  if (rank === null) {
    return calculateUserTierFromPoints(points);
  }

  // 순위가 있는 경우 순위 기준으로 판단
  return calculateUserTierFromRank(rank);
}