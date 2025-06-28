// 기기 현황 페이지
// 비전공자 설명: 오락실이 보유한 게임기 목록과 실시간 상태를 보여주는 페이지입니다
'use client';

import { useState, useEffect } from 'react';
import { Gamepad2, Circle, Search, Users, Clock, AlertCircle, ChevronRight, Coins, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

type Device = {
  id: string;
  device_number: number;
  status: 'available' | 'in_use' | 'maintenance';
  current_user?: string;
};

type DeviceType = {
  id: string;
  name: string;
  company: string; // 제조사
  description?: string;
  play_price: string; // 일반 플레이 요금
  is_rentable: boolean; // 대여 가능 여부
  total_count: number;
  devices: Device[];
};

export default function MachinesPage() {
  const [deviceTypes, setDeviceTypes] = useState<DeviceType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedType, setExpandedType] = useState<string | null>(null);
  const [supabase] = useState(() => createClient());
  const [realtimeChannel, setRealtimeChannel] = useState<RealtimeChannel | null>(null);

  // Supabase에서 기기 정보 가져오기
  useEffect(() => {
    fetchDeviceTypes();
    
    // 실시간 업데이트 구독
    const channel = supabase
      .channel('device-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'devices'
        },
        () => {
          // 기기 상태가 변경되면 다시 불러오기
          fetchDeviceTypes();
        }
      )
      .subscribe();

    setRealtimeChannel(channel);

    // 컴포넌트 언마운트 시 구독 해제
    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [supabase]);

  const fetchDeviceTypes = async () => {
    try {
      setLoading(true);

      // device_types와 devices를 함께 가져오기
      const { data: deviceTypesData, error: typesError } = await supabase
        .from('device_types')
        .select(`
          *,
          devices (
            id,
            device_number,
            status,
            current_user
          )
        `)
        .order('name');

      if (typesError) throw typesError;

      // 데이터 포맷팅
      const formattedData: DeviceType[] = (deviceTypesData || []).map(type => {
        // 가격 정보 포맷팅
        let play_price = '';
        if (type.play_modes && Array.isArray(type.play_modes)) {
          play_price = type.play_modes
            .map((mode: any) => `${mode.name}/${mode.price}원`)
            .join(' ');
        }

        return {
          id: type.id,
          name: type.name,
          company: type.company || 'Unknown',
          description: type.description || '',
          play_price: play_price || '가격 정보 없음',
          is_rentable: type.is_rentable || false,
          total_count: type.devices?.length || 0,
          devices: (type.devices || []).map((device: any) => ({
            id: device.id,
            device_number: device.device_number,
            status: device.status,
            current_user: device.current_user
          }))
        };
      });

      setDeviceTypes(formattedData);
    } catch (error) {
      console.error('기기 정보 불러오기 실패:', error);
      // 에러 시 빈 배열로 설정
      setDeviceTypes([]);
    } finally {
      setLoading(false);
    }
  };

  // 필터링된 기기 타입 목록 (검색만)
  const filteredDeviceTypes = deviceTypes.filter(deviceType => {
    const matchesSearch = deviceType.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         deviceType.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         deviceType.company.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  // 전체 상태별 통계
  const stats = {
    total: deviceTypes.reduce((sum, type) => sum + type.devices.length, 0),
    available: deviceTypes.reduce((sum, type) => 
      sum + type.devices.filter(d => d.status === 'available').length, 0),
    inUse: deviceTypes.reduce((sum, type) => 
      sum + type.devices.filter(d => d.status === 'in_use').length, 0),
    maintenance: deviceTypes.reduce((sum, type) => 
      sum + type.devices.filter(d => d.status === 'maintenance').length, 0),
  };

  const getStatusColor = (status: Device['status']) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400';
      case 'in_use':
        return 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400';
      case 'maintenance':
        return 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400';
      default:
        return 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400';
    }
  };

  const getStatusLabel = (status: Device['status']) => {
    switch (status) {
      case 'available':
        return '이용 가능';
      case 'in_use':
        return '대여 중';
      case 'maintenance':
        return '점검 중';
      default:
        return status;
    }
  };

  const getStatusIcon = (status: Device['status']) => {
    switch (status) {
      case 'available':
        return <Circle className="w-3 h-3 fill-current" />;
      case 'in_use':
        return <Users className="w-3 h-3" />;
      case 'maintenance':
        return <AlertCircle className="w-3 h-3" />;
      case 'reserved':
        return <Clock className="w-3 h-3" />;
      default:
        return null;
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* 페이지 헤더 */}
      <section className="bg-white dark:bg-gray-900 py-8 px-5 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold dark:text-white">기기 현황</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">실시간 게임기 이용 현황을 확인하세요</p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-5 py-8">
        {/* 통계 카드 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800">
            <p className="text-sm text-gray-600 dark:text-gray-400">전체</p>
            <p className="text-2xl font-bold dark:text-white">{stats.total}</p>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800">
            <p className="text-sm text-green-600 dark:text-green-400">이용 가능</p>
            <p className="text-2xl font-bold text-green-700 dark:text-green-400">{stats.available}</p>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800">
            <p className="text-sm text-blue-600 dark:text-blue-400">대여 중</p>
            <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">{stats.inUse}</p>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800">
            <p className="text-sm text-yellow-600 dark:text-yellow-400">점검 중</p>
            <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-400">{stats.maintenance}</p>
          </div>
        </div>

        {/* 검색 */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 mb-8 border border-gray-200 dark:border-gray-800">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="기기명 또는 회사명으로 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white dark:text-white"
            />
          </div>
        </div>

        {/* 기기 타입 목록 */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
            <p className="text-gray-600 dark:text-gray-400 mt-4">기기 정보를 불러오는 중...</p>
          </div>
        ) : filteredDeviceTypes.length === 0 ? (
          <div className="text-center py-12">
            <Gamepad2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">검색 결과가 없습니다</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredDeviceTypes.map((deviceType) => {
              const availableCount = deviceType.devices.filter(d => d.status === 'available').length;
              const isExpanded = expandedType === deviceType.id;
              
              return (
                <motion.div
                  key={deviceType.id}
                  layout
                  className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden"
                >
                  {/* 기기 타입 헤더 */}
                  <button
                    onClick={() => setExpandedType(isExpanded ? null : deviceType.id)}
                    className="w-full p-6 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-3">
                              <h3 className="text-lg font-semibold dark:text-white">
                                {deviceType.name}
                              </h3>
                              <span className="text-sm px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded">
                                {deviceType.company}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              {deviceType.description}
                            </p>
                          </div>
                          <span className="text-sm text-gray-500">
                            {deviceType.total_count}대 보유
                          </span>
                        </div>
                        <div className="flex items-center gap-4 mt-3">
                          <div className="flex items-center gap-2">
                            <Coins className="w-4 h-4 text-gray-500" />
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {deviceType.play_price}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Circle className={`w-3 h-3 ${availableCount > 0 ? 'text-green-500 fill-current' : 'text-gray-400'}`} />
                            <span className={`text-sm font-medium ${availableCount > 0 ? 'text-green-600 dark:text-green-400' : 'text-gray-500'}`}>
                              {availableCount}대 이용 가능
                            </span>
                          </div>
                          {deviceType.is_rentable && (
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-blue-500" />
                              <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                                대여 가능
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                    </div>
                  </button>
                  
                  {/* 개별 기기 목록 (확장시) */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: 'auto' }}
                        exit={{ height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden border-t border-gray-200 dark:border-gray-800"
                      >
                        <div className="p-6 pt-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {deviceType.devices.map((device) => (
                              <div
                                key={device.id}
                                className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4"
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <span className="font-medium dark:text-white">
                                    {device.device_number}번기
                                  </span>
                                  <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(device.status)}`}>
                                    {getStatusIcon(device.status)}
                                    {getStatusLabel(device.status)}
                                  </span>
                                </div>
                                {device.current_user && (
                                  <p className="text-sm text-gray-500 mt-1">
                                    이용자: {device.current_user}
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
              );
            })}
          </div>
        )}

        {/* 안내 메시지 */}
        <div className="mt-12 bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
          <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-2 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            안내사항
          </h3>
          <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1">
            <li>• 실시간 상태는 약 1분마다 업데이트됩니다</li>
            <li>• 대여 예약은 마이마이, 츄니즘, 발키리, 라이트닝만 가능합니다</li>
            <li>• 점검 중인 기기는 일시적으로 이용할 수 없습니다</li>
            <li>• 일반 이용은 현장에서 바로 가능합니다</li>
          </ul>
        </div>

        {/* 예약하기 CTA */}
        <div className="mt-12 text-center py-8">
          <p className="text-gray-600 dark:text-gray-400 mb-4">특정 기기를 시간 단위로 대여하고 싶으신가요?</p>
          <a 
            href="/reservations/new" 
            className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
          >
            <Calendar className="w-5 h-5" />
            대여 예약하기
          </a>
        </div>
      </div>
    </main>
  );
}