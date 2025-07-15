// 대여 시간대 관리 페이지
// 비전공자 설명: 관리자가 기기별 대여 가능한 시간대를 설정하는 페이지입니다
'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase';
// import { RealtimeChannel } from '@supabase/supabase-js';
import { 
  Calendar,
  Plus,
  Trash2,
  Edit,
  Save,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Gamepad2,
  DollarSign,
  Coins
} from 'lucide-react';
import Link from 'next/link';

type DeviceType = {
  id: string;
  name: string;
  category: string;
  is_rentable: boolean;
  rental_settings?: {
    credit_types: ('fixed' | 'freeplay' | 'unlimited')[];
    fixed_credits?: number;
    base_price: number;
    price_multiplier_2p?: number;
    max_players: number;
  };
};

type RentalSlot = {
  id: string;
  device_type_id: string;
  date: string;
  start_time: string;
  end_time: string;
  available_devices: number[];
  prices: {
    fixed?: number;
    freeplay?: number;
    unlimited?: number;
  };
  is_active: boolean;
};

export default function RentalSlotManagementPage() {
  const [deviceTypes, setDeviceTypes] = useState<DeviceType[]>([]);
  const [selectedDeviceType, setSelectedDeviceType] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [rentalSlots, setRentalSlots] = useState<RentalSlot[]>([]);
  const [isAddingSlot, setIsAddingSlot] = useState(false);
  // const [editingSlot, setEditingSlot] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [supabase] = useState(() => createClient());

  // 새 시간대 추가 폼 상태
  const [newSlot, setNewSlot] = useState({
    start_time: '',
    end_time: '',
    available_devices: [] as number[],
    prices: {
      fixed: 0,
      freeplay: 0,
      unlimited: 0
    }
  });

  // Supabase에서 대여 가능한 기기 타입 목록 가져오기
  const fetchDeviceTypes = async () => {
    try {
      const { data: deviceTypesData, error } = await supabase
        .from('device_types')
        .select('*')
        .eq('is_rentable', true)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;

      // 데이터 포맷팅
      const formattedData: DeviceType[] = (deviceTypesData || []).map(type => ({
        id: type.id,
        name: type.name,
        category: type.company || 'Unknown',
        is_rentable: type.is_rentable || false,
        rental_settings: {
          credit_types: type.credit_types || ['freeplay'],
          fixed_credits: type.fixed_credits,
          base_price: type.base_price || 50000,
          price_multiplier_2p: type.price_multiplier_2p || 1,
          max_players: type.max_players || 1
        }
      }));

      setDeviceTypes(formattedData);
      
      // 첫 번째 기기를 자동 선택
      if (formattedData.length > 0 && !selectedDeviceType) {
        const firstDevice = formattedData[0];
        if (firstDevice) {
          setSelectedDeviceType(firstDevice.id);
        }
      }
    } catch (error) {
      console.error('기기 타입 불러오기 실패:', error);
      setDeviceTypes([]);
    }
  };

  useEffect(() => {
    fetchDeviceTypes();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  // 실시간 업데이트 구독
  useEffect(() => {
    const channel = supabase
      .channel('rental-slots-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'rental_time_slots'
        },
        (payload) => {
          // 현재 선택된 기기와 날짜에 해당하는 변경사항만 처리
          if (payload.new && 
              'device_type_id' in payload.new &&
              'date' in payload.new &&
              payload.new.device_type_id === selectedDeviceType && 
              payload.new.date === formatDate(selectedDate)) {
            loadRentalSlots();
          }
        }
      )
      .subscribe();


    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase, selectedDeviceType, selectedDate]);

  // 선택한 기기와 날짜에 따른 시간대 불러오기
  useEffect(() => {
    if (selectedDeviceType && selectedDate) {
      loadRentalSlots();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDeviceType, selectedDate]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const loadRentalSlots = async () => {
    try {
      setIsLoading(true);
      const dateStr = formatDate(selectedDate);
      
      const { data: slotsData, error } = await supabase
        .from('rental_time_slots')
        .select('*')
        .eq('device_type_id', selectedDeviceType)
        .eq('date', dateStr)
        .order('start_time');

      if (error) throw error;

      // 데이터 포맷팅
      const formattedSlots: RentalSlot[] = (slotsData || []).map(slot => ({
        id: slot.id,
        device_type_id: slot.device_type_id,
        date: slot.date,
        start_time: slot.start_time,
        end_time: slot.end_time,
        available_devices: slot.available_units || [],
        prices: {
          fixed: slot.credit_options?.fixed?.price,
          freeplay: slot.credit_options?.freeplay?.price || slot.price,
          unlimited: slot.credit_options?.unlimited?.price
        },
        is_active: slot.is_active !== false
      }));

      setRentalSlots(formattedSlots);
    } catch (error) {
      console.error('시간대 정보 불러오기 실패:', error);
      setRentalSlots([]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDateDisplay = (date: Date) => {
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
    setSelectedDate(newDate);
  };

  const getSelectedDeviceType = () => {
    return deviceTypes.find(d => d.id === selectedDeviceType);
  };

  const handleAddSlot = async () => {
    try {
      setIsLoading(true);
      
      const creditOptions: any = {};
      const selectedDevice = getSelectedDeviceType();
      
      // 크레디트 옵션 구성
      if (selectedDevice?.rental_settings?.credit_types.includes('fixed') && newSlot.prices.fixed) {
        creditOptions.fixed = {
          price: newSlot.prices.fixed,
          credits: selectedDevice.rental_settings.fixed_credits
        };
      }
      if (selectedDevice?.rental_settings?.credit_types.includes('freeplay') && newSlot.prices.freeplay) {
        creditOptions.freeplay = {
          price: newSlot.prices.freeplay
        };
      }
      if (selectedDevice?.rental_settings?.credit_types.includes('unlimited') && newSlot.prices.unlimited) {
        creditOptions.unlimited = {
          price: newSlot.prices.unlimited
        };
      }
      
      const { error } = await supabase
        .from('rental_time_slots')
        .insert({
          device_type_id: selectedDeviceType,
          date: formatDate(selectedDate),
          start_time: newSlot.start_time,
          end_time: newSlot.end_time,
          available_units: newSlot.available_devices,
          max_units: newSlot.available_devices.length,
          price: newSlot.prices.freeplay || newSlot.prices.fixed || 0,
          credit_options: creditOptions,
          slot_type: 'regular',
          is_active: true
        });

      if (error) throw error;

      // 성공 후 다시 불러오기
      await loadRentalSlots();
      setIsAddingSlot(false);
      setNewSlot({
        start_time: '',
        end_time: '',
        available_devices: [],
        prices: { fixed: 0, freeplay: 0, unlimited: 0 }
      });
    } catch (error) {
      console.error('시간대 추가 실패:', error);
      alert('시간대 추가에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSlot = async (slotId: string) => {
    if (!confirm('이 시간대를 삭제하시겠습니까?')) return;
    
    try {
      const { error } = await supabase
        .from('rental_time_slots')
        .delete()
        .eq('id', slotId);

      if (error) throw error;

      // 성공 후 목록 업데이트
      setRentalSlots(rentalSlots.filter(slot => slot.id !== slotId));
    } catch (error) {
      console.error('시간대 삭제 실패:', error);
      alert('시간대 삭제에 실패했습니다.');
    }
  };

  const selectedDevice = getSelectedDeviceType();

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* 헤더 */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold dark:text-white mb-2">대여 시간대 관리</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          기기별 대여 가능한 시간대와 가격을 설정합니다
        </p>
      </div>

      {/* 기기 선택 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <h2 className="text-lg font-semibold dark:text-white mb-4">기기 선택</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {deviceTypes.filter(d => d.is_rentable).map((deviceType) => (
            <button
              key={deviceType.id}
              onClick={() => setSelectedDeviceType(deviceType.id)}
              className={`p-4 rounded-lg border transition-all ${
                selectedDeviceType === deviceType.id
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <div className="text-left">
                <h3 className={`font-medium ${
                  selectedDeviceType === deviceType.id
                    ? 'text-blue-900 dark:text-blue-100'
                    : 'text-gray-900 dark:text-white'
                }`}>
                  {deviceType.name}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {deviceType.category}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {selectedDeviceType && (
        <>
          {/* 날짜 선택 */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
            <div className="flex items-center justify-between">
              <button
                onClick={() => navigateDate('prev')}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              </button>
              
              <div className="text-center">
                <h2 className="text-lg font-semibold dark:text-white mb-1">
                  {formatDateDisplay(selectedDate)}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedDevice?.name} - 총 {rentalSlots.length}개 시간대
                </p>
              </div>

              <button
                onClick={() => navigateDate('next')}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              </button>
            </div>
          </div>

          {/* 크레딧 타입 정보 */}
          {selectedDevice && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-6">
              <div className="flex items-start gap-3">
                <Coins className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-1">
                    {selectedDevice.name} 크레딧 설정
                  </h4>
                  <div className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                    <p>• 사용 가능한 크레딧 타입: {
                      selectedDevice.rental_settings?.credit_types.map(type => {
                        switch(type) {
                          case 'fixed': return `고정 ${selectedDevice.rental_settings?.fixed_credits}크레딧`;
                          case 'freeplay': return '프리플레이';
                          case 'unlimited': return '무한크레딧';
                        }
                      }).join(', ')
                    }</p>
                    <p>• 기본 가격: ₩{selectedDevice.rental_settings?.base_price.toLocaleString()}</p>
                    {selectedDevice.rental_settings?.max_players && selectedDevice.rental_settings.max_players > 1 && (
                      <p>• 2P 가격 배수: {selectedDevice.rental_settings?.price_multiplier_2p}배</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 시간대 목록 */}
          <div className="space-y-4 mb-6">
            {rentalSlots.map((slot, index) => (
              <motion.div
                key={slot.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold dark:text-white">
                        {slot.start_time} - {slot.end_time}
                      </h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        slot.is_active
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                      }`}>
                        {slot.is_active ? '활성' : '비활성'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <Gamepad2 className="w-4 h-4" />
                        <span>사용 가능 기기: {slot.available_devices.join(', ')}번</span>
                      </div>

                      {/* 가격 정보 */}
                      {Object.entries(slot.prices).map(([type, price]) => {
                        if (!price || price === 0) return null;
                        return (
                          <div key={type} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <DollarSign className="w-4 h-4" />
                            <span>
                              {type === 'fixed' && '고정크레딧'}
                              {type === 'freeplay' && '프리플레이'}
                              {type === 'unlimited' && '무한크레딧'}
                              : ₩{price.toLocaleString()}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => {/* setEditingSlot(slot.id) */}}
                      className="p-2 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteSlot(slot.id)}
                      className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}

            {rentalSlots.length === 0 && (
              <div className="text-center py-12">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">
                  이 날짜에는 등록된 시간대가 없습니다
                </p>
              </div>
            )}
          </div>

          {/* 시간대 추가 */}
          {!isAddingSlot ? (
            <button
              onClick={() => setIsAddingSlot(true)}
              className="w-full py-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl hover:border-gray-400 dark:hover:border-gray-500 transition-colors flex items-center justify-center gap-2 text-gray-600 dark:text-gray-400"
            >
              <Plus className="w-5 h-5" />
              <span>새 시간대 추가</span>
            </button>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6"
            >
              <h3 className="text-lg font-semibold dark:text-white mb-4">새 시간대 추가</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    시작 시간
                  </label>
                  <input
                    type="time"
                    value={newSlot.start_time}
                    onChange={(e) => setNewSlot({ ...newSlot, start_time: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    종료 시간
                  </label>
                  <input
                    type="time"
                    value={newSlot.end_time}
                    onChange={(e) => setNewSlot({ ...newSlot, end_time: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    사용 가능 기기 번호
                  </label>
                  <div className="flex gap-3">
                    {[1, 2, 3, 4].map(num => (
                      <label key={num} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={newSlot.available_devices.includes(num)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewSlot({ ...newSlot, available_devices: [...newSlot.available_devices, num] });
                            } else {
                              setNewSlot({ ...newSlot, available_devices: newSlot.available_devices.filter(d => d !== num) });
                            }
                          }}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm">{num}번</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* 크레딧 타입별 가격 설정 */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    크레딧 타입별 가격
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {selectedDevice?.rental_settings?.credit_types.map(type => (
                      <div key={type}>
                        <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                          {type === 'fixed' && `고정 ${selectedDevice.rental_settings?.fixed_credits}크레딧`}
                          {type === 'freeplay' && '프리플레이'}
                          {type === 'unlimited' && '무한크레딧'}
                        </label>
                        <input
                          type="number"
                          value={newSlot.prices[type] || ''}
                          onChange={(e) => setNewSlot({
                            ...newSlot,
                            prices: { ...newSlot.prices, [type]: Number(e.target.value) }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder={selectedDevice.rental_settings?.base_price.toString()}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setIsAddingSlot(false);
                    setNewSlot({
                      start_time: '',
                      end_time: '',
                      available_devices: [],
                      prices: { fixed: 0, freeplay: 0, unlimited: 0 }
                    });
                  }}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={handleAddSlot}
                  disabled={!newSlot.start_time || !newSlot.end_time || newSlot.available_devices.length === 0 || isLoading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>추가 중...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>추가하기</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}
        </>
      )}

      {/* 안내 메시지 */}
      <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-1">
              대여 시간대 관리 안내
            </h4>
            <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
              <li>• 기기별로 서로 다른 시간대와 가격을 설정할 수 있습니다</li>
              <li>• 크레딧 타입은 기기별로 사전 설정된 타입만 사용 가능합니다</li>
              <li>• 같은 시간대에 여러 기기 번호를 배정할 수 있습니다</li>
              <li>• 예약이 있는 시간대는 수정/삭제가 제한됩니다</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}