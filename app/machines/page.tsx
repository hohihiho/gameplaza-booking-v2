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

  // D1 API에서 기기 정보 가져오기
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

  // 만료된 예약 처리는 서버 API에서 자동으로 처리됨

  const fetchDeviceTypes = async () => {
    try {
      setLoading(true);

      // D1 API를 통해 기기 타입 정보 가져오기
      const response = await fetch('/api/admin/devices/types');
      if (!response.ok) {
        throw new Error(`API 요청 실패: ${response.status}`);
      }
      
      const deviceTypes = await response.json();

      // 카테고리 정보 가져오기
      const categoriesResponse = await fetch('/api/devices/categories');
      if (!categoriesResponse.ok) {
        throw new Error(`카테고리 API 요청 실패: ${categoriesResponse.status}`);
      }
      
      const categories = await categoriesResponse.json();

      // 카테고리별로 그룹화
      const categoriesMap = new Map<string, Category>();
      
      // 카테고리 초기화
      (categories || []).forEach((cat: any) => {
        categoriesMap.set(cat.id, {
          id: cat.id,
          name: cat.name,
          display_order: cat.display_order,
          deviceTypes: []
        });
      });

      // 디바이스 타입을 카테고리별로 분류
      (deviceTypes || []).forEach((type: any) => {
        const formattedType: DeviceType = {
          id: type.id,
          name: type.name,
          company: type.version_name || type.description?.split(' ')[0] || 'Unknown', // API에서 제조사 정보 매핑
          description: type.description || '',
          model_name: type.model_name,
          version_name: type.version_name,
          play_price: '현장 문의',
          is_rentable: type.is_rentable || false,
          total_count: type.device_count || 0,
          devices: [], // 개별 기기 정보는 별도 API 필요시 구현
          category_id: type.category_id,
          display_order: type.display_order || 0,
          rental_settings: type.rental_settings || {},
          play_modes: type.play_modes || []
        };

        const category = categoriesMap.get(type.category_id);
        if (category) {
          category.deviceTypes.push(formattedType);
        }
      });

      // Map을 배열로 변환하고 순서대로 정렬
      const sortedCategories = Array.from(categoriesMap.values())
        .sort((a, b) => a.display_order - b.display_order)
        .filter(cat => cat.deviceTypes.length > 0); // 빈 카테고리 제외

      setCategories(sortedCategories);
    } catch (error) {
      console.error('기기 정보 불러오기 실패:', error);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  // 기기 현황 안내사항 불러오기 (D1 마이그레이션 후 비활성화)
  const loadMachineRules = async () => {
    try {
      // TODO: D1에서 machine_rules API 구현 필요시 활성화
      setMachineRules([]);
    } catch (error: any) {
      console.error('기기 현황 안내사항 로드 에러:', error.message || error);
      setMachineRules([]);
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
                                      {mode.name}: {mode.price.toLocaleString()}원
                                      {index < deviceType.play_modes.length - 1 && ', '}
                                    </span>
                                  ))}
                                </span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                <Coins className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                <span>{deviceType.play_price}</span>
                              </div>
                            )}
                          </div>

                          {/* 상태별 개수 표시 */}
                          <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-1.5">
                              <Circle className="w-3 h-3 text-green-500 fill-current" />
                              <span className="text-green-600 dark:text-green-400 font-medium">
                                {availableCount}대 이용가능
                              </span>
                            </div>
                            {deviceType.devices.filter(d => d.status === 'in_use').length > 0 && (
                              <div className="flex items-center gap-1.5">
                                <Users className="w-3 h-3 text-blue-500" />
                                <span className="text-blue-600 dark:text-blue-400">
                                  {deviceType.devices.filter(d => d.status === 'in_use').length}대 대여중
                                </span>
                              </div>
                            )}
                            {deviceType.devices.filter(d => d.status === 'maintenance').length > 0 && (
                              <div className="flex items-center gap-1.5">
                                <Wrench className="w-3 h-3 text-amber-500" />
                                <span className="text-amber-600 dark:text-amber-400">
                                  {deviceType.devices.filter(d => d.status === 'maintenance').length}대 점검중
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                    </div>
                  </button>

                  {/* 확장된 기기 목록 */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="border-t border-gray-200 dark:border-gray-700"
                      >
                        <div className="p-6 bg-gray-50 dark:bg-gray-900/50">
                          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            기기별 상태
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {deviceType.devices.map((device) => (
                              <motion.div
                                key={device.id}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.05 * device.device_number }}
                                className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200/50 dark:border-gray-700/50 hover:shadow-md transition-shadow"
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                                    #{device.device_number}
                                  </span>
                                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium ${getStatusColor(device.status)}`}>
                                    {getStatusIcon(device.status)}
                                    {getStatusLabel(device)}
                                  </span>
                                </div>
                                
                                {/* 예약 정보가 있는 경우 표시 */}
                                {device.reservation_info && (
                                  <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                    <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                                      <div className="flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        <span>
                                          {device.reservation_info.start_time} - {device.reservation_info.end_time}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <Users className="w-3 h-3" />
                                        <span>{device.reservation_info.user_name}</span>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </motion.div>
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
              </motion.div>
            ))}
          </div>
        )}

        {/* 기기 현황 안내사항 */}
        {machineRules && machineRules.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-12 bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-lg border border-gray-200/50 dark:border-gray-700/50"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                <Info className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">기기 현황 안내사항</h3>
            </div>
            <div className="space-y-4">
              {machineRules.map((rule, index) => (
                <motion.div
                  key={rule.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + index * 0.1 }}
                  className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl"
                >
                  <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                      {index + 1}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                      {rule.title}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                      {rule.content}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}