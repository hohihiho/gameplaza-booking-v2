// 기기 현황 페이지
// 비전공자 설명: 오락실이 보유한 게임기 목록과 실시간 상태를 보여주는 페이지입니다
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Gamepad2, Circle, Search, Users, Clock, AlertCircle, ChevronRight, Coins, Calendar, Activity, Wrench, Sparkles, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type Device = {
  id: string;
  device_number: number;
  status: 'available' | 'in_use' | 'maintenance' | 'reserved' | 'broken';
  current_user?: string;
  reservation_info?: {
    start_time: string;
    end_time: string;
    user_name: string;
    is_checked_in: boolean;
  };
};

type DeviceType = {
  id: string;
  name: string;
  company: string; // 제조사
  description?: string;
  model_name?: string;
  version_name?: string;
  play_price: string; // 일반 플레이 요금
  is_rentable: boolean; // 대여 가능 여부
  total_count: number;
  devices: Device[];
  category_id: string;
  display_order: number;
  rental_settings?: {
    base_price?: number;
    credit_types?: string[];
    fixed_credits?: number;
    max_players?: number;
  };
  play_modes?: Array<{
    name: string;
    price: number;
  }>;
};

type Category = {
  id: string;
  name: string;
  display_order: number;
  deviceTypes: DeviceType[];
};

export default function MachinesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all'); // 기본값을 '전체'로 설정
  const [showRentalOnly, setShowRentalOnly] = useState<boolean>(true); // 대여 가능 기기만 표시 (기본값: true)
  const [expandedType, setExpandedType] = useState<string | null>(null);
  const [machineRules, setMachineRules] = useState<any[]>([]);

  // Supabase에서 기기 정보 가져오기
  useEffect(() => {
    fetchDeviceTypes();
    loadMachineRules();
    
    // 10분마다 자동 새로고침
    const intervalId = setInterval(() => {
      fetchDeviceTypes();
    }, 10 * 60 * 1000); // 10분

    // 컴포넌트 언마운트 시 인터벌 정리
    return () => {
      clearInterval(intervalId);
    };
  }, []);

  const fetchDeviceTypes = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/public/machines', { cache: 'no-store' })
      if (!res.ok) throw new Error(`API error (${res.status})`)
      const data = await res.json()
      setCategories(data.categories || [])
      setMachineRules(data.rules || [])
    } catch (error) {
      console.error('기기 정보 불러오기 실패:', error);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  // 기기 현황 안내사항 불러오기
  const loadMachineRules = async () => {
    try {
      const res = await fetch('/api/public/machines', { cache: 'no-store' })
      if (!res.ok) return
      const data = await res.json()
      setMachineRules(data.rules || [])
    } catch (error: any) {
      console.error('기기 현황 안내사항 로드 에러:', error.message || error)
    }
  };

  // 필터링된 카테고리 (검색 및 카테고리 선택 포함)
  const filteredCategories = categories
    .filter(category => {
      return selectedCategoryId === 'all' || category.id === selectedCategoryId;
    })
    .map(category => ({
      ...category,
      deviceTypes: category.deviceTypes.filter(deviceType => {
        // 검색어 필터
        const matchesSearch = deviceType.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                             deviceType.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                             deviceType.company.toLowerCase().includes(searchQuery.toLowerCase());
        
        // 대여 가능 필터
        const matchesRental = !showRentalOnly || deviceType.is_rentable;
        
        return matchesSearch && matchesRental;
      })
    })).filter(cat => cat.deviceTypes.length > 0);

  // 전체 상태별 통계
  const allDeviceTypes = categories.flatMap(cat => cat.deviceTypes);
  const stats = {
    total: allDeviceTypes.reduce((sum, type) => sum + type.devices.length, 0),
    available: allDeviceTypes.reduce((sum, type) => 
      sum + type.devices.filter(d => d.status === 'available').length, 0),
    inUse: allDeviceTypes.reduce((sum, type) => 
      sum + type.devices.filter(d => d.status === 'in_use').length, 0),
    maintenance: allDeviceTypes.reduce((sum, type) => 
      sum + type.devices.filter(d => d.status === 'maintenance').length, 0),
    broken: allDeviceTypes.reduce((sum, type) => 
      sum + type.devices.filter(d => d.status === 'broken').length, 0),
  };

  const getStatusColor = (status: Device['status']) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300';
      case 'in_use':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300';
      case 'maintenance':
        return 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300';
      case 'reserved':
        return 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300';
      case 'broken':
        return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300';
      default:
        return 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400';
    }
  };

  const getStatusLabel = (device: Device) => {
    switch (device.status) {
      case 'available':
        return '이용 가능';
      case 'in_use':
        return '대여 중';
      case 'maintenance':
        return '점검 중';
      case 'reserved':
        // 체크인 여부에 따라 다른 레이블 표시
        if (device.reservation_info?.is_checked_in) {
          return '대기 중'; // 체크인은 되었지만 예약 시간 전
        }
        return '예약됨';
      case 'broken':
        return '사용불가';
      default:
        return device.status;
    }
  };

  const getStatusIcon = (status: Device['status']) => {
    switch (status) {
      case 'available':
        return <Circle className="w-3 h-3 fill-current" />;
      case 'in_use':
        return <Users className="w-3 h-3" />;
      case 'maintenance':
        return <Wrench className="w-3 h-3" />;
      case 'reserved':
        return <Clock className="w-3 h-3" />;
      case 'broken':
        return <AlertCircle className="w-3 h-3" />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-50 to-gray-100 dark:from-gray-950 dark:via-gray-950 dark:to-gray-900">
      {/* 페이지 헤더 */}
      <section className="relative bg-gradient-to-r from-purple-700 to-indigo-800 py-12 px-5 overflow-hidden">
        {/* 애니메이션 배경 요소 */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>
        
        <div className="relative max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col md:flex-row items-center justify-between gap-6"
          >
            {/* 왼쪽: 타이틀 */}
            <div className="text-center md:text-left">
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full mb-3">
                <Activity className="w-3.5 h-3.5 text-white animate-pulse" />
                <span className="text-xs text-white font-medium">실시간 업데이트</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-white mb-2">기기 현황</h1>
              <p className="text-sm md:text-base text-white/90 max-w-md">모든 게임기 상태를 실시간으로 확인하세요</p>
            </div>
            
            {/* 오른쪽: 빠른 통계 */}
            <div className="flex gap-4 md:gap-6">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="text-center"
              >
                <div className="text-2xl md:text-3xl font-black text-white">{stats.available}</div>
                <div className="text-xs text-white/80">이용 가능</div>
              </motion.div>
              <div className="w-px bg-white/30" />
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="text-center"
              >
                <div className="text-2xl md:text-3xl font-black text-white">{stats.total}</div>
                <div className="text-xs text-white/80">전체 기기</div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-5 py-8">
        {/* 통계 카드 */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8 mt-8 relative z-10 space-y-4"
        >
          {/* 전체 기기 - 1열 */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 md:p-6 shadow-lg border border-gray-200/50 dark:border-gray-700/50 hover:shadow-xl transition-shadow">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center">
                <Gamepad2 className="w-6 h-6 text-gray-600 dark:text-gray-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">전체 기기</p>
                <div className="flex items-baseline gap-1">
                  <p className="text-4xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
                  <p className="text-lg text-gray-500 dark:text-gray-400">대</p>
                </div>
              </div>
            </div>
          </div>

          {/* 나머지 상태 - 2열 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-lg border border-gray-200/50 dark:border-gray-700/50 hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-green-600 dark:text-green-400">이용 가능</p>
                <Circle className="w-5 h-5 text-green-500 fill-current" />
              </div>
              <div className="flex items-baseline gap-1">
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.available}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">대</p>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-lg border border-gray-200/50 dark:border-gray-700/50 hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-blue-600 dark:text-blue-400">대여 중</p>
                <Users className="w-5 h-5 text-blue-500" />
              </div>
              <div className="flex items-baseline gap-1">
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.inUse}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">대</p>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-lg border border-gray-200/50 dark:border-gray-700/50 hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-amber-600 dark:text-amber-400">점검 중</p>
                <Wrench className="w-5 h-5 text-amber-500" />
              </div>
              <div className="flex items-baseline gap-1">
                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{stats.maintenance}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">대</p>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-lg border border-gray-200/50 dark:border-gray-700/50 hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-red-600 dark:text-red-400">사용불가</p>
                <AlertCircle className="w-5 h-5 text-red-500" />
              </div>
              <div className="flex items-baseline gap-1">
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.broken}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">대</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* 카테고리 필터 */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-3xl p-6 mb-6 shadow-lg border border-gray-200/50 dark:border-gray-700/50"
        >
          <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4">카테고리</h3>
          <div className="flex flex-wrap gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowRentalOnly(!showRentalOnly)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all relative overflow-hidden ${
                showRentalOnly
                  ? 'text-white shadow-lg'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
              style={showRentalOnly ? { 
                background: 'linear-gradient(to bottom right, #10b981, #059669, #047857)' 
              } : {}}
            >
              <Calendar className={`inline w-4 h-4 mr-1 ${showRentalOnly ? 'text-white' : 'text-gray-700 dark:text-gray-300'}`} />
              대여
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedCategoryId('all')}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all relative overflow-hidden ${
                selectedCategoryId === 'all'
                  ? 'text-white shadow-lg'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
              style={selectedCategoryId === 'all' ? { 
                background: 'linear-gradient(to bottom right, #4c1d95, #4338ca, #312e81)' 
              } : {}}
            >
              <Sparkles className={`inline w-4 h-4 mr-1 ${selectedCategoryId === 'all' ? 'text-white' : 'text-gray-700 dark:text-gray-300'}`} />
              전체
            </motion.button>
            {categories.map(category => (
              <motion.button
                key={category.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedCategoryId(category.id)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all relative overflow-hidden ${
                  selectedCategoryId === category.id
                    ? 'text-white shadow-lg'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
                style={selectedCategoryId === category.id ? { 
                  background: 'linear-gradient(to bottom right, #4c1d95, #4338ca, #312e81)' 
                } : {}}
              >
                {category.name}
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* 검색 */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-gray-800 rounded-3xl p-6 mb-8 shadow-lg border border-gray-200/50 dark:border-gray-700/50"
        >
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="기기명 또는 회사명으로 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-cyan-500 dark:text-white transition-all"
            />
          </div>
        </motion.div>

        {/* 기기 타입 목록 */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-gray-200 dark:border-gray-700 rounded-full animate-pulse"></div>
              <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-indigo-500 rounded-full animate-spin"></div>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mt-6 font-medium">기기 정보를 불러오는 중...</p>
          </div>
        ) : filteredCategories.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-16 bg-white dark:bg-gray-800 rounded-3xl shadow-lg border border-gray-200/50 dark:border-gray-700/50"
          >
            <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-2xl mb-4">
              <Gamepad2 className="w-12 h-12 text-gray-400" />
            </div>
            <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">검색 결과가 없습니다</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">다른 검색어를 시도해보세요</p>
          </motion.div>
        ) : (
          <div className="space-y-8">
            {filteredCategories.map((category, categoryIndex) => (
              <motion.div 
                key={category.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: categoryIndex * 0.1 }}
              >
                {selectedCategoryId === 'all' && (
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                    <div className="w-1 h-8 bg-gradient-to-b from-indigo-500 to-cyan-500 rounded-full" />
                    {category.name}
                  </h2>
                )}
                <div className="space-y-4">
                  {category.deviceTypes.map((deviceType) => {
              const availableCount = deviceType.devices.filter(d => d.status === 'available').length;
              const isExpanded = expandedType === deviceType.id;
              
              // 디버깅용 로그
              console.log(`기기 타입 ${deviceType.name} (${deviceType.id}):`, {
                expandedType,
                isExpanded,
                deviceTypeId: deviceType.id
              });
              
              return (
                <motion.div
                  key={deviceType.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  whileHover={{ y: -4 }}
                  className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 overflow-hidden hover:shadow-xl transition-all"
                >
                  {/* 기기 타입 헤더 */}
                  <button
                    onClick={() => setExpandedType(expandedType === deviceType.id ? null : deviceType.id)}
                    className="w-full p-6 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-3">
                              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                {deviceType.name}
                              </h3>
                              <span className="text-sm px-3 py-1 bg-gradient-to-r from-violet-100 to-purple-100 dark:from-violet-900/30 dark:to-purple-900/30 text-violet-700 dark:text-violet-300 rounded-full font-medium">
                                {deviceType.company}
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {deviceType.model_name && (
                                <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                                  모델: {deviceType.model_name}
                                </span>
                              )}
                              {deviceType.version_name && (
                                <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                                  버전: {deviceType.version_name}
                                </span>
                              )}
                              {!deviceType.model_name && !deviceType.version_name && deviceType.description && (
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  {deviceType.description}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 ml-4 flex-shrink-0">
                            <span className="text-2xl font-bold text-gray-900 dark:text-white">{deviceType.total_count}</span>
                            <span className="text-sm text-gray-500 dark:text-gray-400">대</span>
                          </div>
                        </div>
                        <div className="space-y-2 mt-3">
                          {/* 플레이 모드별 가격 표시 */}
                          <div>
                            {deviceType.play_modes && deviceType.play_modes.length > 0 ? (
                              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                <Coins className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                                <span className="flex flex-wrap gap-1">
                                  {deviceType.play_modes.map((mode, index) => (
                                    <span key={mode.name}>
                                      <span className="font-semibold text-gray-900 dark:text-white">{mode.name}:</span>
                                      <span className="ml-1 text-indigo-600 dark:text-indigo-400 font-bold">{mode.price.toLocaleString()}원</span>
                                      {index < deviceType.play_modes!.length - 1 && <span className="mx-1 text-gray-400">/</span>}
                                    </span>
                                  ))}
                                </span>
                              </div>
                            ) : (
                              // play_modes가 없는 경우 기본 가격 표시
                              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                <Coins className="w-4 h-4 text-gray-400" />
                                <span className="font-medium">현장 문의</span>
                              </div>
                            )}
                          </div>
                          
                          {/* 이용 가능 및 대여 가능 정보 */}
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              <div className={`p-1.5 rounded-lg ${availableCount > 0 ? 'bg-green-100 dark:bg-green-900/30' : 'bg-gray-100 dark:bg-gray-800'}`}>
                                <Circle className={`w-4 h-4 ${availableCount > 0 ? 'text-green-600 dark:text-green-400 fill-current' : 'text-gray-400'}`} />
                              </div>
                              <span className={`text-sm font-semibold ${availableCount > 0 ? 'text-green-600 dark:text-green-400' : 'text-gray-500'}`}>
                                {availableCount}대 이용 가능
                              </span>
                            </div>
                            {deviceType.is_rentable && (
                              <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                  <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                </div>
                                <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                                  대여 가능
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <motion.div
                        animate={{ rotate: isExpanded ? 90 : 0 }}
                        transition={{ duration: 0.3 }}
                        className={`p-2 rounded-xl transition-colors ${
                          isExpanded 
                            ? 'bg-indigo-100 dark:bg-indigo-900/30' 
                            : 'bg-gray-100 dark:bg-gray-700'
                        }`}
                      >
                        <ChevronRight className={`w-5 h-5 transition-colors ${
                          isExpanded 
                            ? 'text-indigo-600 dark:text-indigo-400' 
                            : 'text-gray-600 dark:text-gray-300'
                        }`} />
                      </motion.div>
                    </div>
                  </button>
                  
                  {/* 개별 기기 목록 (확장시) */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ 
                          height: { duration: 0.3, ease: 'easeInOut' },
                          opacity: { duration: 0.2 }
                        }}
                        className="overflow-hidden"
                      >
                        <div className="border-t border-gray-200 dark:border-gray-800">
                          <div className="p-6 pt-4 bg-gray-50 dark:bg-gray-900/50">
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                              {deviceType.devices
                                .sort((a, b) => a.device_number - b.device_number)
                                .map((device, index) => (
                                <motion.div
                                  key={device.id}
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: index * 0.03 }}
                                  className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
                                >
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-lg font-bold text-gray-900 dark:text-white">
                                      {device.device_number}번
                                    </span>
                                    <span className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(device.status)}`}>
                                      {getStatusIcon(device.status)}
                                      {getStatusLabel(device)}
                                    </span>
                                  </div>
                                  {device.reservation_info && (
                                    <div className="mt-2 text-xs space-y-1">
                                      <p className="text-gray-600 dark:text-gray-400">
                                        <Users className="inline w-3 h-3 mr-1" />
                                        {device.reservation_info.user_name}
                                      </p>
                                      <p className="text-gray-500 dark:text-gray-500">
                                        <Clock className="inline w-3 h-3 mr-1" />
                                        {device.reservation_info.start_time.slice(0,5)} - {device.reservation_info.end_time.slice(0,5)}
                                      </p>
                                      {device.status === 'reserved' && device.reservation_info.is_checked_in && (
                                        <p className="text-amber-600 dark:text-amber-400 font-medium">
                                          체크인 완료 (예약 시간 대기 중)
                                        </p>
                                      )}
                                    </div>
                                  )}
                                </motion.div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
                  );
                  })}
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* 안내 메시지 */}
        {machineRules.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-12 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-3xl p-6 border border-blue-200/50 dark:border-blue-700/50 shadow-lg"
          >
            <h3 className="font-bold text-blue-900 dark:text-blue-300 mb-4 flex items-center gap-2">
              <div className="p-2 bg-blue-100 dark:bg-blue-800/30 rounded-xl">
                <Info className="w-5 h-5" />
              </div>
              안내사항
            </h3>
            <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-2">
              {machineRules.map((rule) => (
                <li key={rule.id} className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5"></span>
                  <span className="whitespace-pre-wrap leading-relaxed">{rule.content}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        )}

        {/* 예약하기 CTA */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-12 text-center"
        >
          <div className="bg-indigo-100 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800/50 rounded-3xl p-8 shadow-xl">
            <h3 className="text-2xl font-bold text-indigo-900 dark:text-indigo-100 mb-6">기기를 예약하고 싶으신가요?</h3>
            <motion.a 
              href="/reservations/new" 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-flex items-center gap-2 px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <Calendar className="w-5 h-5" />
              대여 예약하기
            </motion.a>
          </div>
        </motion.div>
      </div>
      
    </div>
  );
}
