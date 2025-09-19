'use client';

import React from 'react';

// 직급 타입 정의
export type UserTier =
  | 'GAMEPLA_USER'
  | 'GAMEPLA_REGULAR'
  | 'GAMEPLA_VIP'
  | 'GAMEPLA_KING'
  | 'ADMIN'
  | 'SUPER_ADMIN';

// 직급별 설정
export const tierConfig = {
  GAMEPLA_USER: {
    level: 0,
    name: '겜플유저',
    nameEn: 'GAMEPLA_USER',
    abbreviation: 'GU',
    color: '#6B7280', // gray-500
    gradient: 'from-gray-500 to-gray-600',
    textColor: 'text-white',
    bgClass: 'bg-gradient-to-br from-gray-500 to-gray-600',
  },
  GAMEPLA_REGULAR: {
    level: 1,
    name: '겜플단골',
    nameEn: 'GAMEPLA_REGULAR',
    abbreviation: 'GR',
    color: '#10B981', // emerald-500
    gradient: 'from-emerald-500 to-emerald-600',
    textColor: 'text-white',
    bgClass: 'bg-gradient-to-br from-emerald-500 to-emerald-600',
  },
  GAMEPLA_VIP: {
    level: 2,
    name: '겜플VIP',
    nameEn: 'GAMEPLA_VIP',
    abbreviation: 'GV',
    color: '#3B82F6', // blue-500
    gradient: 'from-blue-500 to-blue-600',
    textColor: 'text-white',
    bgClass: 'bg-gradient-to-br from-blue-500 to-blue-600',
  },
  GAMEPLA_KING: {
    level: 3,
    name: '겜플킹',
    nameEn: 'GAMEPLA_KING',
    abbreviation: 'GK',
    color: '#8B5CF6', // violet-500
    gradient: 'from-violet-500 to-violet-600',
    textColor: 'text-white',
    bgClass: 'bg-gradient-to-br from-violet-500 to-violet-600',
    glowEffect: 'shadow-lg shadow-violet-500/50',
  },
  ADMIN: {
    level: 4,
    name: '관리자',
    nameEn: 'ADMIN',
    abbreviation: 'AD',
    color: '#EF4444', // red-500
    gradient: 'from-red-500 to-red-600',
    textColor: 'text-white',
    bgClass: 'bg-gradient-to-br from-red-500 to-red-600',
  },
  SUPER_ADMIN: {
    level: 5,
    name: '슈퍼관리자',
    nameEn: 'SUPER_ADMIN',
    abbreviation: 'SA',
    color: '#F59E0B', // amber-500
    gradient: 'from-amber-500 to-amber-600',
    textColor: 'text-white',
    bgClass: 'bg-gradient-to-br from-amber-500 to-amber-600',
    glowEffect: 'shadow-lg shadow-amber-500/50',
  },
};

interface UserTierBadgeProps {
  tier: UserTier;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showName?: boolean;
  className?: string;
  animate?: boolean;
}

export default function UserTierBadge({
  tier,
  size = 'sm',
  showName = false,
  className = '',
  animate = false
}: UserTierBadgeProps) {
  const config = tierConfig[tier];

  const sizeClasses = {
    xs: 'w-5 h-5 text-[8px]',
    sm: 'w-6 h-6 text-[10px]',
    md: 'w-8 h-8 text-xs',
    lg: 'w-10 h-10 text-sm',
  };

  const animationClass = animate && config.level >= 3
    ? 'animate-pulse'
    : '';

  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      <div className={`
        relative ${sizeClasses[size]} rounded-full flex items-center justify-center
        ${config.bgClass} ${config.textColor} ${config.glowEffect || ''}
        font-bold shadow-md ${animationClass}
        ring-2 ring-white dark:ring-gray-800
      `}>
        {config.abbreviation}

        {/* 킹/슈퍼관리자용 특수 효과 */}
        {config.level >= 3 && (
          <div className="absolute inset-0 rounded-full animate-ping opacity-20 bg-white" />
        )}
      </div>

      {showName && (
        <span className={`
          font-medium text-gray-700 dark:text-gray-300
          ${size === 'xs' ? 'text-xs' : ''}
          ${size === 'sm' ? 'text-sm' : ''}
          ${size === 'md' ? 'text-base' : ''}
          ${size === 'lg' ? 'text-lg' : ''}
        `}>
          {config.name}
        </span>
      )}
    </div>
  );
}

// 프로필 이미지와 함께 사용하는 뱃지 컴포넌트
interface ProfileWithBadgeProps {
  profileImage?: string;
  userName: string;
  userTier: UserTier;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function ProfileWithBadge({
  profileImage,
  userName,
  userTier,
  size = 'md',
  className = ''
}: ProfileWithBadgeProps) {
  const sizeMap = {
    sm: { profile: 'w-8 h-8', badge: 'xs' as const },
    md: { profile: 'w-12 h-12', badge: 'sm' as const },
    lg: { profile: 'w-16 h-16', badge: 'md' as const },
  };

  const { profile, badge } = sizeMap[size];

  return (
    <div className={`relative inline-block ${className}`}>
      {/* 프로필 이미지 */}
      <div className={`${profile} rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden`}>
        {profileImage ? (
          <img
            src={profileImage}
            alt={userName}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-500 dark:text-gray-400 font-medium">
            {userName.charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      {/* 직급 뱃지 */}
      <div className="absolute -bottom-1 -right-1">
        <UserTierBadge tier={userTier} size={badge} />
      </div>
    </div>
  );
}