/**
 * 포인트 시스템 서비스
 * 게임 점수를 기반으로 사용자 포인트와 직급을 계산
 */

// 게임별 가중치 (난이도 기반)
export const GAME_WEIGHTS = {
  maimai: 1.0,
  chunithm: 1.0,
  sound_voltex_valkyrie: 1.2,  // 고난도
  beatmania_lightning: 1.3,    // 최고난도
  default: 1.0
} as const;

// 월간 활동 보너스
export const ACTIVITY_BONUS = {
  PLAYS_1_5: 1.0,    // 기본
  PLAYS_6_10: 1.1,   // 10% 보너스
  PLAYS_11_20: 1.2,  // 20% 보너스
  PLAYS_21_PLUS: 1.3 // 30% 보너스
} as const;

// 직급별 포인트 임계값
export const TIER_THRESHOLDS = {
  GAMEPLA_USER: 0,        // 기본
  GAMEPLA_REGULAR: 1000,  // 월 평균 3~4회 플레이
  GAMEPLA_VIP: 5000,      // 상위 20% 활동
  GAMEPLA_KING: 10000,    // 상위 5% 활동
  ADMIN: -1,              // 수동 부여
  SUPER_ADMIN: -1,        // 수동 부여
} as const;

// 직급 타입
export type UserTier = keyof typeof TIER_THRESHOLDS;

// 게임 플레이 기록
export interface GamePlayRecord {
  gameId: string;
  score: number;
  playedAt: Date;
  duration?: number; // 플레이 시간(분)
}

// 사용자 포인트 정보
export interface UserPoints {
  userId: string;
  totalPoints: number;
  monthlyPoints: number;
  weeklyPoints: number;
  dailyPoints: number;
  currentTier: UserTier;
  nextTier: UserTier | null;
  pointsToNextTier: number;
  monthlyPlayCount: number;
  lastPlayDate: Date | null;
}

// 포인트 계산 결과
export interface PointCalculation {
  basePoints: number;
  gameWeight: number;
  activityBonus: number;
  finalPoints: number;
}

/**
 * 게임 플레이에서 포인트 계산
 */
export function calculatePointsFromPlay(
  gameId: string,
  score: number,
  monthlyPlayCount: number
): PointCalculation {
  // 기본 포인트 계산 (점수의 0.01%)
  const basePoints = Math.floor(score * 0.0001);

  // 게임 가중치
  const gameWeight = GAME_WEIGHTS[gameId as keyof typeof GAME_WEIGHTS] || GAME_WEIGHTS.default;

  // 활동 보너스 계산
  let activityBonus = ACTIVITY_BONUS.PLAYS_1_5;
  if (monthlyPlayCount >= 21) {
    activityBonus = ACTIVITY_BONUS.PLAYS_21_PLUS;
  } else if (monthlyPlayCount >= 11) {
    activityBonus = ACTIVITY_BONUS.PLAYS_11_20;
  } else if (monthlyPlayCount >= 6) {
    activityBonus = ACTIVITY_BONUS.PLAYS_6_10;
  }

  // 최종 포인트
  const finalPoints = Math.floor(basePoints * gameWeight * activityBonus);

  return {
    basePoints,
    gameWeight,
    activityBonus,
    finalPoints
  };
}

/**
 * 총 포인트로 직급 결정
 */
export function getTierFromPoints(totalPoints: number): UserTier {
  if (totalPoints >= TIER_THRESHOLDS.GAMEPLA_KING) {
    return 'GAMEPLA_KING';
  }
  if (totalPoints >= TIER_THRESHOLDS.GAMEPLA_VIP) {
    return 'GAMEPLA_VIP';
  }
  if (totalPoints >= TIER_THRESHOLDS.GAMEPLA_REGULAR) {
    return 'GAMEPLA_REGULAR';
  }
  return 'GAMEPLA_USER';
}

/**
 * 다음 직급 정보 계산
 */
export function getNextTierInfo(currentTier: UserTier, currentPoints: number): {
  nextTier: UserTier | null;
  pointsNeeded: number;
} {
  const tierOrder: UserTier[] = ['GAMEPLA_USER', 'GAMEPLA_REGULAR', 'GAMEPLA_VIP', 'GAMEPLA_KING'];
  const currentIndex = tierOrder.indexOf(currentTier);

  if (currentIndex === -1 || currentIndex === tierOrder.length - 1) {
    return { nextTier: null, pointsNeeded: 0 };
  }

  const nextTier = tierOrder[currentIndex + 1];
  const pointsNeeded = TIER_THRESHOLDS[nextTier] - currentPoints;

  return { nextTier, pointsNeeded: Math.max(0, pointsNeeded) };
}

/**
 * 월간 보너스 계산 (월말 정산)
 */
export function calculateMonthlyBonus(
  monthlyPoints: number,
  monthlyPlayCount: number
): number {
  let bonus = 0;

  // 플레이 횟수 보너스
  if (monthlyPlayCount >= 30) {
    bonus += 500; // 매일 플레이 보너스
  } else if (monthlyPlayCount >= 20) {
    bonus += 200;
  } else if (monthlyPlayCount >= 10) {
    bonus += 100;
  }

  // 월간 포인트 보너스
  if (monthlyPoints >= 5000) {
    bonus += 300;
  } else if (monthlyPoints >= 3000) {
    bonus += 150;
  } else if (monthlyPoints >= 1000) {
    bonus += 50;
  }

  return bonus;
}

/**
 * 특별 이벤트 포인트
 */
export function calculateEventPoints(
  eventType: 'first_play' | 'perfect_score' | 'milestone' | 'tournament',
  baseValue?: number
): number {
  switch (eventType) {
    case 'first_play':
      return 100; // 첫 플레이 보너스
    case 'perfect_score':
      return 500; // 퍼펙트 달성
    case 'milestone':
      return baseValue || 200; // 마일스톤 달성
    case 'tournament':
      return baseValue || 1000; // 토너먼트 참가/우승
    default:
      return 0;
  }
}

/**
 * 직급별 혜택
 */
export const TIER_BENEFITS = {
  GAMEPLA_USER: {
    bookingDays: 7,          // 7일 전부터 예약 가능
    maxConcurrentBookings: 1, // 동시 예약 1개
    discount: 0,              // 할인 없음
    specialAccess: [],
  },
  GAMEPLA_REGULAR: {
    bookingDays: 10,
    maxConcurrentBookings: 2,
    discount: 0,
    specialAccess: ['monthly_event'],
  },
  GAMEPLA_VIP: {
    bookingDays: 14,
    maxConcurrentBookings: 3,
    discount: 5, // 5% 할인
    specialAccess: ['monthly_event', 'new_device_preview'],
  },
  GAMEPLA_KING: {
    bookingDays: 30,
    maxConcurrentBookings: 5,
    discount: 10, // 10% 할인
    specialAccess: ['monthly_event', 'new_device_preview', 'vip_matching', 'special_event'],
  },
  ADMIN: {
    bookingDays: 365,
    maxConcurrentBookings: 999,
    discount: 0,
    specialAccess: ['all'],
  },
  SUPER_ADMIN: {
    bookingDays: 365,
    maxConcurrentBookings: 999,
    discount: 0,
    specialAccess: ['all'],
  },
} as const;

/**
 * 예약 가능 날짜 계산
 */
export function getBookingAvailableDate(userTier: UserTier): Date {
  const benefits = TIER_BENEFITS[userTier];
  const today = new Date();
  const availableDate = new Date(today);
  availableDate.setDate(today.getDate() + benefits.bookingDays);
  return availableDate;
}

/**
 * 할인된 가격 계산
 */
export function calculateDiscountedPrice(
  originalPrice: number,
  userTier: UserTier
): { finalPrice: number; discountAmount: number; discountRate: number } {
  const benefits = TIER_BENEFITS[userTier];
  const discountRate = benefits.discount;
  const discountAmount = Math.floor((originalPrice * discountRate) / 100);
  const finalPrice = originalPrice - discountAmount;

  return {
    finalPrice,
    discountAmount,
    discountRate,
  };
}

/**
 * 사용자 포인트 요약 생성
 */
export function createUserPointsSummary(
  totalPoints: number,
  monthlyPoints: number,
  weeklyPoints: number,
  dailyPoints: number,
  monthlyPlayCount: number,
  lastPlayDate: Date | null
): UserPoints {
  const currentTier = getTierFromPoints(totalPoints);
  const { nextTier, pointsNeeded } = getNextTierInfo(currentTier, totalPoints);

  return {
    userId: '', // Will be filled by the caller
    totalPoints,
    monthlyPoints,
    weeklyPoints,
    dailyPoints,
    currentTier,
    nextTier,
    pointsToNextTier: pointsNeeded,
    monthlyPlayCount,
    lastPlayDate,
  };
}