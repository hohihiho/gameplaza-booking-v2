// 기기 현황 페이지
// D1 데이터베이스 기반으로 완전히 재작성
'use client';

import { useState, useEffect } from 'react';
import { Gamepad2, Circle, Search, Clock, AlertCircle, ChevronRight, Activity, Wrench, Sparkles, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type Device = {
  id: string;
  name: string;
  status: 'available' | 'occupied' | 'maintenance';
  position: number;
  last_used_at?: string;
};

type DeviceType = {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  icon?: string;
  color?: string;
  sort_order: number;
  total_count: number;
  available_count: number;
  occupied_count: number;
  maintenance_count: number;
  devices: Device[];
};

export default function MachinesPage() {
  const [deviceTypes, setDeviceTypes] = useState<DeviceType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedType, setExpandedType] = useState<string | null>(null);

  // API에서 기기 정보 가져오기
  const fetchDeviceTypes = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/machines');
      const data = await response.json();
      
      if (response.ok) {
        setDeviceTypes(data);
      } else {
        console.error('Failed to fetch machines:', data.error);
        setDeviceTypes([]);
      }
    } catch (error) {
      console.error('Error fetching machines:', error);
      setDeviceTypes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeviceTypes();
    
    // 10분마다 자동 새로고침
    const intervalId = setInterval(() => {
      fetchDeviceTypes();
    }, 10 * 60 * 1000);

    return () => {
      clearInterval(intervalId);
    };
  }, []);

  // 검색 필터링
  const filteredDeviceTypes = deviceTypes.filter(deviceType =>
    deviceType.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    deviceType.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (deviceType.description && deviceType.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // 상태에 따른 색상 반환
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'text-emerald-600 dark:text-emerald-400';
      case 'occupied':
        return 'text-red-600 dark:text-red-400';
      case 'maintenance':
        return 'text-orange-600 dark:text-orange-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  // 상태에 따른 아이콘 반환
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available':
        return <Circle className="w-3 h-3 fill-current" />;
      case 'occupied':
        return <Activity className="w-3 h-3" />;
      case 'maintenance':
        return <Wrench className="w-3 h-3" />;
      default:
        return <AlertCircle className="w-3 h-3" />;
    }
  };

  // 상태 텍스트 반환
  const getStatusText = (status: string) => {
    switch (status) {
      case 'available':
        return '사용 가능';
      case 'occupied':
        return '사용 중';
      case 'maintenance':
        return '점검 중';
      default:
        return '알 수 없음';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="flex justify-center space-x-2 mb-4">
            <div className="w-2 h-2 bg-indigo-600 dark:bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-indigo-600 dark:bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-indigo-600 dark:bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
          <p className="text-gray-600 dark:text-gray-400">기기 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-6">
        {/* 헤더 */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-br from-indigo-500 to-cyan-500 rounded-2xl">
              <Gamepad2 className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">기기 현황</h1>
              <p className="text-gray-600 dark:text-gray-400">실시간 게임 기기 상태를 확인하세요</p>
            </div>
          </div>

          {/* 검색 */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="기기명으로 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
          </div>
        </div>

        {/* 전체 통계 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            {
              label: '전체 기기',
              value: deviceTypes.reduce((sum, type) => sum + type.total_count, 0),
              icon: Gamepad2,
              color: 'bg-gradient-to-br from-blue-500 to-blue-600'
            },
            {
              label: '사용 가능',
              value: deviceTypes.reduce((sum, type) => sum + type.available_count, 0),
              icon: Circle,
              color: 'bg-gradient-to-br from-emerald-500 to-emerald-600'
            },
            {
              label: '사용 중',
              value: deviceTypes.reduce((sum, type) => sum + type.occupied_count, 0),
              icon: Activity,
              color: 'bg-gradient-to-br from-red-500 to-red-600'
            },
            {
              label: '점검 중',
              value: deviceTypes.reduce((sum, type) => sum + type.maintenance_count, 0),
              icon: Wrench,
              color: 'bg-gradient-to-br from-orange-500 to-orange-600'
            }
          ].map((stat, index) => (
            <div key={index} className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-lg ${stat.color}`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 기기 유형별 목록 */}
        <div className="space-y-4">
          {filteredDeviceTypes.length === 0 ? (
            <div className="text-center py-12">
              <Gamepad2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {searchQuery ? '검색 결과가 없습니다' : '등록된 기기가 없습니다'}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {searchQuery ? '다른 검색어를 시도해보세요' : '관리자에게 문의하세요'}
              </p>
            </div>
          ) : (
            filteredDeviceTypes.map((deviceType) => (
              <motion.div
                key={deviceType.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden"
              >
                <div
                  className="p-6 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
                  onClick={() => setExpandedType(expandedType === deviceType.id ? null : deviceType.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-gradient-to-br from-indigo-500 to-cyan-500 rounded-xl">
                        <Gamepad2 className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {deviceType.display_name}
                        </h3>
                        {deviceType.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {deviceType.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 mt-2">
                          <span className="text-sm text-emerald-600 dark:text-emerald-400">
                            사용가능 {deviceType.available_count}대
                          </span>
                          <span className="text-sm text-red-600 dark:text-red-400">
                            사용중 {deviceType.occupied_count}대
                          </span>
                          {deviceType.maintenance_count > 0 && (
                            <span className="text-sm text-orange-600 dark:text-orange-400">
                              점검중 {deviceType.maintenance_count}대
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        전체 {deviceType.total_count}대
                      </span>
                      <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform ${
                        expandedType === deviceType.id ? 'rotate-90' : ''
                      }`} />
                    </div>
                  </div>
                </div>

                <AnimatePresence>
                  {expandedType === deviceType.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="border-t border-gray-200 dark:border-gray-700"
                    >
                      <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {deviceType.devices.map((device) => (
                            <div
                              key={device.id}
                              className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-medium text-gray-900 dark:text-white">
                                  {device.name}
                                </h4>
                                <div className={`flex items-center gap-1 ${getStatusColor(device.status)}`}>
                                  {getStatusIcon(device.status)}
                                  <span className="text-sm">
                                    {getStatusText(device.status)}
                                  </span>
                                </div>
                              </div>
                              {device.last_used_at && (
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  마지막 사용: {new Date(device.last_used_at).toLocaleString('ko-KR')}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))
          )}
        </div>

        {/* 범례 */}
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Info className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">상태 안내</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                <Circle className="w-3 h-3 fill-current" />
                <span className="text-sm">사용 가능</span>
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400">즉시 이용 가능한 상태</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-red-600 dark:text-red-400">
                <Activity className="w-3 h-3" />
                <span className="text-sm">사용 중</span>
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400">다른 사용자가 이용 중</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-orange-600 dark:text-orange-400">
                <Wrench className="w-3 h-3" />
                <span className="text-sm">점검 중</span>
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400">정비 또는 점검으로 일시 중단</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}