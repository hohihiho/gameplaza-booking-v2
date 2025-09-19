'use client';

import React from 'react';
import { ChevronRight, Trophy, Star, Zap, Crown } from 'lucide-react';
import UserTierBadge, { UserTier, tierConfig } from './UserTierBadge';

// 직급별 포인트 임계값
export const tierThresholds = {
  GAMEPLA_USER: 0,
  GAMEPLA_REGULAR: 1000,
  GAMEPLA_VIP: 5000,
  GAMEPLA_KING: 10000,
  ADMIN: -1, // 수동 부여
  SUPER_ADMIN: -1, // 수동 부여
};

// 직급별 혜택
export const tierBenefits = {
  GAMEPLA_USER: [],
  GAMEPLA_REGULAR: [
    '예약 우선권',
    '월간 이벤트 참가',
  ],
  GAMEPLA_VIP: [
    '예약 우선권+',
    '5% 할인',
    '신규 기기 우선 체험',
  ],
  GAMEPLA_KING: [
    'VIP 전용 예약',
    '10% 할인',
    '1:1 매칭 주선',
    '특별 이벤트 초대',
  ],
  ADMIN: ['관리 기능 접근'],
  SUPER_ADMIN: ['전체 시스템 관리'],
};

interface TierProgressProps {
  currentTier: UserTier;
  currentPoints: number;
  monthlyPoints?: number;
  playCount?: number;
  className?: string;
}

export default function TierProgress({
  currentTier,
  currentPoints,
  monthlyPoints = 0,
  playCount = 0,
  className = ''
}: TierProgressProps) {
  const currentConfig = tierConfig[currentTier];

  // 다음 직급 계산
  const getNextTier = (): UserTier | null => {
    const tiers: UserTier[] = ['GAMEPLA_USER', 'GAMEPLA_REGULAR', 'GAMEPLA_VIP', 'GAMEPLA_KING'];
    const currentIndex = tiers.indexOf(currentTier);

    if (currentIndex === -1 || currentIndex === tiers.length - 1) {
      return null;
    }

    return tiers[currentIndex + 1];
  };

  const nextTier = getNextTier();
  const nextConfig = nextTier ? tierConfig[nextTier] : null;
  const nextThreshold = nextTier ? tierThresholds[nextTier] : 0;

  // 진행률 계산
  const currentThreshold = tierThresholds[currentTier] || 0;
  const progress = nextTier
    ? ((currentPoints - currentThreshold) / (nextThreshold - currentThreshold)) * 100
    : 100;

  const pointsNeeded = nextTier ? nextThreshold - currentPoints : 0;

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg ${className}`}>
      {/* 현재 직급 정보 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <UserTierBadge tier={currentTier} size="lg" animate />
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              {currentConfig.name}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {currentPoints.toLocaleString()} 포인트
            </p>
          </div>
        </div>

        <div className="text-right">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            이번 달
          </p>
          <p className="text-lg font-bold text-gray-900 dark:text-white">
            {monthlyPoints.toLocaleString()}P
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500">
            {playCount}회 플레이
          </p>
        </div>
      </div>

      {/* 다음 직급까지 진행률 */}
      {nextTier && (
        <>
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-gray-600 dark:text-gray-400">
                다음 직급: {nextConfig?.name}
              </span>
              <span className="font-medium text-gray-900 dark:text-white">
                {pointsNeeded.toLocaleString()}P 필요
              </span>
            </div>

            <div className="relative h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`
                  absolute left-0 top-0 h-full transition-all duration-500
                  ${nextConfig?.bgClass}
                `}
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>

            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-gray-500">
                {currentThreshold.toLocaleString()}P
              </span>
              <span className="text-xs text-gray-500">
                {nextThreshold.toLocaleString()}P
              </span>
            </div>
          </div>

          {/* 다음 직급 혜택 미리보기 */}
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <UserTierBadge tier={nextTier} size="xs" />
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                {nextConfig?.name} 혜택
              </h4>
            </div>
            <div className="space-y-1">
              {tierBenefits[nextTier].map((benefit, index) => (
                <div key={index} className="flex items-start gap-2">
                  <ChevronRight className="w-3 h-3 text-gray-400 mt-0.5" />
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    {benefit}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* 최고 등급 도달 */}
      {currentTier === 'GAMEPLA_KING' && (
        <div className="bg-gradient-to-r from-violet-100 to-purple-100 dark:from-violet-900/20 dark:to-purple-900/20 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Crown className="w-5 h-5 text-violet-600 dark:text-violet-400" />
            <h4 className="text-sm font-semibold text-violet-900 dark:text-violet-200">
              최고 등급 달성!
            </h4>
          </div>
          <p className="text-xs text-violet-700 dark:text-violet-300">
            축하합니다! 게임플라자 최고 등급에 도달하셨습니다.
          </p>
        </div>
      )}
    </div>
  );
}

// 직급 히스토리 컴포넌트
interface TierHistoryProps {
  history: {
    month: string;
    tier: UserTier;
    points: number;
    playCount: number;
  }[];
  className?: string;
}

export function TierHistory({ history, className = '' }: TierHistoryProps) {
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg ${className}`}>
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <Trophy className="w-5 h-5 text-yellow-500" />
        직급 히스토리
      </h3>

      <div className="space-y-3">
        {history.map((item, index) => (
          <div
            key={item.month}
            className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700 last:border-0"
          >
            <div className="flex items-center gap-3">
              <UserTierBadge tier={item.tier} size="xs" />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {item.month}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {item.playCount}회 플레이
                </p>
              </div>
            </div>

            <div className="text-right">
              <p className="text-sm font-bold text-gray-900 dark:text-white">
                {item.points.toLocaleString()}P
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}