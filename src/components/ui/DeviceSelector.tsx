'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { Gamepad2, Users, AlertCircle, Sparkles } from 'lucide-react';

interface DeviceType {
  id: string;
  name: string;
  category: string;
  description?: string;
  model_name?: string;
  version_name?: string;
  requires_approval: boolean;
  image_url?: string;
  active_device_count: number;
  total_device_count: number;
  max_rental_units?: number;
  max_players?: number;
  price_multiplier_2p?: number;
  rental_settings?: any;
}

interface DeviceSelectorProps {
  // 사용 가능한 기기 목록
  deviceTypes: DeviceType[];
  // 선택된 기기 ID
  selectedDeviceId?: string;
  // 기기 선택 콜백
  onDeviceSelect?: (deviceId: string) => void;
  // 그리드 컬럼 수
  columns?: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
  };
  // 로딩 상태
  isLoading?: boolean;
  // 에러 메시지
  error?: string | null;
  // 커스텀 렌더링
  renderDevice?: (device: DeviceType, isSelected: boolean) => React.ReactNode;
  // 빈 상태 메시지
  emptyMessage?: string;
  // 카테고리별 그룹핑 여부
  groupByCategory?: boolean;
  // 추가 클래스명
  className?: string;
}

// 카테고리별 정렬 순서 (하위 카테고리가 먼저 오도록)
const CATEGORY_ORDER: Record<string, number> = {
  'SEGA 게임기': 1,
  'CAVE 게임기': 2,
  'SNK 게임기': 3,
  'NAMCO 게임기': 4,
  'TAITO 게임기': 5,
  'CAPCOM 게임기': 6,
  '기타 게임기': 7,
  '비디오 게임기': 8,
  '체감형 게임기': 9,
  '기타': 999,
};

export function DeviceSelector({
  deviceTypes,
  selectedDeviceId,
  onDeviceSelect,
  columns = { mobile: 1, tablet: 2, desktop: 2 },
  isLoading = false,
  error = null,
  renderDevice,
  emptyMessage = '이용 가능한 기기가 없습니다',
  groupByCategory = false,
  className = ''
}: DeviceSelectorProps) {
  // 카테고리별로 기기 그룹핑
  const groupedDevices = groupByCategory
    ? deviceTypes.reduce((acc, device) => {
        const category = device.category || '기타';
        if (!acc[category]) {
          acc[category] = [];
        }
        acc[category].push(device);
        return acc;
      }, {} as Record<string, DeviceType[]>)
    : { '': deviceTypes };

  // 카테고리 정렬
  const sortedCategories = Object.keys(groupedDevices).sort((a, b) => {
    const orderA = CATEGORY_ORDER[a] || 999;
    const orderB = CATEGORY_ORDER[b] || 999;
    return orderA - orderB;
  });

  // 그리드 클래스 생성
  const gridClasses = `grid gap-4 ${
    columns.mobile === 1 ? 'grid-cols-1' : `grid-cols-${columns.mobile}`
  } ${
    columns.tablet === 1 ? 'sm:grid-cols-1' : columns.tablet === 2 ? 'sm:grid-cols-2' : 'sm:grid-cols-3'
  } ${
    columns.desktop === 1 ? 'lg:grid-cols-1' : columns.desktop === 2 ? 'lg:grid-cols-2' : columns.desktop === 3 ? 'lg:grid-cols-3' : 'lg:grid-cols-4'
  }`;

  // 로딩 스켈레톤
  if (isLoading) {
    return (
      <div className={`${gridClasses} ${className}`}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 bg-gray-200 dark:bg-gray-800 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4"
      >
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      </motion.div>
    );
  }

  // 빈 상태
  if (deviceTypes.length === 0) {
    return (
      <div className="text-center py-20">
        <Gamepad2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">{emptyMessage}</p>
        <p className="text-sm text-gray-600 dark:text-gray-400">다른 조건으로 검색해보세요</p>
      </div>
    );
  }

  // 기본 기기 렌더링
  const defaultRenderDevice = (device: DeviceType, isSelected: boolean) => (
    <motion.button
      key={device.id}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onDeviceSelect?.(device.id)}
      disabled={device.active_device_count === 0}
      className={`p-6 rounded-2xl border-2 transition-all text-left relative overflow-hidden ${
        device.active_device_count === 0
          ? 'opacity-50 cursor-not-allowed border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800'
          : isSelected
            ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20'
            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-900'
      }`}
    >
      {/* 승인 필요 배지 */}
      {device.requires_approval && (
        <div className="absolute top-3 right-3">
          <span className="text-xs px-2 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-full">
            승인 필요
          </span>
        </div>
      )}

      <div className="flex items-start justify-between">
        <div className="flex-1 pr-4">
          <h3 className="font-bold text-lg text-gray-900 dark:text-white">{device.name}</h3>
          {device.model_name && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{device.model_name}</p>
          )}
          {device.version_name && (
            <p className="text-xs text-gray-500 dark:text-gray-500">{device.version_name}</p>
          )}
          
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-full">
              {device.category}
            </span>
            
            {device.active_device_count > 0 ? (
              <span className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full">
                {device.active_device_count}대 가능
              </span>
            ) : (
              <span className="text-xs px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-full">
                예약 불가
              </span>
            )}
            
            {device.max_players && device.max_players > 1 && (
              <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full flex items-center gap-1">
                <Users className="w-3 h-3" />
                최대 {device.max_players}인
              </span>
            )}
          </div>
        </div>
        <Gamepad2 className="w-8 h-8 text-gray-400 flex-shrink-0" />
      </div>

      {/* 이미지가 있는 경우 */}
      {device.image_url && (
        <div className="mt-4 -mx-6 -mb-6 h-32 relative overflow-hidden">
          <Image
            src={device.image_url}
            alt={device.name}
            fill
            className="object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-gray-900 to-transparent" />
        </div>
      )}
    </motion.button>
  );

  return (
    <div className={className}>
      {sortedCategories.map((category) => (
        <div key={category || 'default'} className={groupByCategory ? 'mb-8' : ''}>
          {groupByCategory && category && (
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-500" />
              {category}
            </h3>
          )}
          
          <div className={gridClasses}>
            {groupedDevices[category].map((device) => {
              const isSelected = selectedDeviceId === device.id;
              
              if (renderDevice) {
                return renderDevice(device, isSelected);
              }
              
              return defaultRenderDevice(device, isSelected);
            })}
          </div>
        </div>
      ))}
    </div>
  );
}