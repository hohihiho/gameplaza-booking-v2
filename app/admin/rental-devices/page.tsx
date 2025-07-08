// 대여 기기 관리 페이지
// 비전공자 설명: 대여 가능한 기기들의 시간대별 가격을 설정하는 페이지입니다
'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Clock,
  Plus,
  ChevronLeft,
  Package,
  Users,
  Hash,
  Sun,
  Moon,
  Palette,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import TimeSlotForm from './components/TimeSlotForm';
import TimeSlotDisplay from './TimeSlotDisplay';

// 타입 정의
interface DeviceType {
  id: string;
  name: string;
  category_name: string;
  model_name?: string;
  version_name?: string;
  is_rentable: boolean;
  device_count: number; // 전체 보유 대수
  rental_settings?: {
    credit_types: ('fixed' | 'freeplay' | 'unlimited')[];
    fixed_credits?: number;
    max_players: number;
    max_rental_units?: number; // 대여 가능 대수
    color?: string; // 기종별 색상 (캘린더 표시용)
    display_order?: number; // 표시 순서
  };
}

interface TimeSlot {
  id?: string;
  device_type_id: string;
  slot_type: 'early' | 'overnight';
  start_time: string;
  end_time: string;
  credit_options: {
    type: 'fixed' | 'freeplay' | 'unlimited';
    price: number;
    fixed_credits?: number;
  }[];
  enable_2p: boolean;
  price_2p_extra?: number;
  is_youth_time?: boolean;
}

// 기본 색상 팔레트
const defaultColors = [
  { name: '핑크', value: 'bg-pink-200 dark:bg-pink-800' },
  { name: '하늘', value: 'bg-sky-200 dark:bg-sky-800' },
  { name: '빨강', value: 'bg-red-200 dark:bg-red-800' },
  { name: '보라', value: 'bg-purple-200 dark:bg-purple-800' },
  { name: '주황', value: 'bg-orange-200 dark:bg-orange-800' },
  { name: '초록', value: 'bg-green-200 dark:bg-green-800' },
  { name: '노랑', value: 'bg-amber-200 dark:bg-amber-800' },
  { name: '파랑', value: 'bg-blue-200 dark:bg-blue-800' },
  { name: '회색', value: 'bg-gray-200 dark:bg-gray-800' },
];

export default function RentalDevicesPage() {
  const searchParams = useSearchParams();
  const [deviceTypes, setDeviceTypes] = useState<DeviceType[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<DeviceType | null>(null);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [isAddingSlot, setIsAddingSlot] = useState(false);
  const [editingSlot, setEditingSlot] = useState<string | null>(null);
  const [allTimeSlots, setAllTimeSlots] = useState<TimeSlot[]>([]);  // 전체 시간대 목록
  const [showColorPicker, setShowColorPicker] = useState<string | null>(null); // 색상 선택기 표시 상태
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  
  // URL 파라미터에서 초기 상태 읽기
  const initialDeviceId = searchParams.get('deviceId');

  // 대여 가능한 기기들만 로드
  const loadRentableDevices = async () => {
    try {
      const response = await fetch('/api/admin/devices/types');
      if (!response.ok) throw new Error('Failed to fetch device types');
      const data = await response.json();
      
      // 대여 가능한 기기만 필터링하고 순서대로 정렬
      const rentableDevices = data
        .filter((device: DeviceType) => device.is_rentable)
        .sort((a: DeviceType, b: DeviceType) => {
          const orderA = a.rental_settings?.display_order ?? 999;
          const orderB = b.rental_settings?.display_order ?? 999;
          return orderA - orderB;
        });
      setDeviceTypes(rentableDevices);
      
      // 모든 기기의 시간대 정보 로드
      const allSlots: TimeSlot[] = [];
      for (const device of rentableDevices) {
        try {
          const slotsResponse = await fetch(`/api/admin/rental-time-slots?deviceTypeId=${device.id}`);
          if (slotsResponse.ok) {
            const slots = await slotsResponse.json();
            allSlots.push(...slots);
          }
        } catch (error) {
          console.error(`Error loading slots for device ${device.id}:`, error);
        }
      }
      setAllTimeSlots(allSlots);
    } catch (error) {
      console.error('Error loading rentable devices:', error);
    }
  };

  // 시간대별 가격 로드
  const loadTimeSlots = async (deviceTypeId: string) => {
    try {
      const response = await fetch(`/api/admin/rental-time-slots?deviceTypeId=${deviceTypeId}`);
      if (!response.ok) throw new Error('Failed to fetch time slots');
      const data = await response.json();
      setTimeSlots(data);
    } catch (error) {
      console.error('Error loading time slots:', error);
      // 임시 mock 데이터
      setTimeSlots([
        {
          id: '1',
          device_type_id: deviceTypeId,
          slot_type: 'early',
          start_time: '10:00',
          end_time: '18:00',
          credit_options: [
            {
              type: 'freeplay',
              price: 30000
            },
            {
              type: 'unlimited',
              price: 40000
            }
          ],
          enable_2p: true,
          price_2p_extra: 10000
        },
        {
          id: '2',
          device_type_id: deviceTypeId,
          slot_type: 'overnight',
          start_time: '22:00',
          end_time: '08:00',
          credit_options: [
            {
              type: 'freeplay',
              price: 50000
            }
          ],
          enable_2p: false
        }
      ]);
    }
  };

  useEffect(() => {
    loadRentableDevices();
  }, []);
  
  // 초기 URL 파라미터에 따라 기기 선택
  useEffect(() => {
    if (deviceTypes.length > 0 && initialDeviceId) {
      const device = deviceTypes.find(d => d.id === initialDeviceId);
      if (device) {
        setSelectedDevice(device);
      }
    }
  }, [deviceTypes, initialDeviceId]);
  
  // 기기 선택 시 URL 업데이트
  const selectDevice = (device: DeviceType) => {
    setSelectedDevice(device);
    const url = new URL(window.location.href);
    url.searchParams.set('deviceId', device.id);
    window.history.pushState({}, '', url.toString());
  };
  
  // 뒤로가기 시 URL 업데이트
  const goBack = () => {
    setSelectedDevice(null);
    const url = new URL(window.location.href);
    url.searchParams.delete('deviceId');
    window.history.pushState({}, '', url.toString());
  };
  
  // 브라우저 뒤로가기 버튼 핸들링
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const deviceId = params.get('deviceId');
      
      if (deviceId) {
        const device = deviceTypes.find(d => d.id === deviceId);
        if (device) {
          setSelectedDevice(device);
        }
      } else {
        setSelectedDevice(null);
      }
    };
    
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [deviceTypes]);

  useEffect(() => {
    if (selectedDevice) {
      loadTimeSlots(selectedDevice.id);
    }
  }, [selectedDevice]);

  // 시간대 저장 핸들러
  const handleSaveTimeSlot = async (data: TimeSlot) => {
    try {
      const method = data.id ? 'PUT' : 'POST';
      const url = data.id 
        ? `/api/admin/rental-time-slots/${data.id}`
        : '/api/admin/rental-time-slots';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (!response.ok) throw new Error('Failed to save time slot');

      // 시간대 목록 새로고침
      if (selectedDevice) {
        await loadTimeSlots(selectedDevice.id);
      }
      setIsAddingSlot(false);
      setEditingSlot(null);
    } catch (error) {
      console.error('Error saving time slot:', error);
      alert('시간대 저장에 실패했습니다.');
    }
  };

  // 시간대 삭제 핸들러
  const handleDeleteTimeSlot = async (slotId: string) => {
    if (!confirm('이 시간대를 삭제하시겠습니까?')) return;

    try {
      const response = await fetch(`/api/admin/rental-time-slots/${slotId}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Failed to delete time slot');

      // 시간대 목록 새로고침
      if (selectedDevice) {
        await loadTimeSlots(selectedDevice.id);
      }
    } catch (error) {
      console.error('Error deleting time slot:', error);
      alert('시간대 삭제에 실패했습니다.');
    }
  };

  // 드래그 앤 드롭 핸들러
  const handleDragStart = (e: React.DragEvent, index: number) => {
    // 드래그 핸들에서만 드래그 허용
    const target = e.target as HTMLElement;
    if (!target.closest('.drag-handle')) {
      e.preventDefault();
      return;
    }
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const updatedDevices = [...deviceTypes];
    const [draggedItem] = updatedDevices.splice(draggedIndex, 1);
    
    if (draggedItem) {
      updatedDevices.splice(dropIndex, 0, draggedItem);

      // 각 기기의 순서 업데이트
      updatedDevices.forEach((device, idx) => {
        if (device.rental_settings) {
          device.rental_settings.display_order = idx;
        }
      });
    }

    setDeviceTypes(updatedDevices);
    setDraggedIndex(null);
    setDragOverIndex(null);

    // API 호출로 순서 저장
    try {
      const updatePromises = updatedDevices.map((device, idx) => 
        fetch('/api/admin/rental-settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            device_type_id: device.id,
            display_order: idx
          })
        })
      );
      
      const responses = await Promise.all(updatePromises);
      const hasError = responses.some(r => !r.ok);
      
      if (hasError) {
        throw new Error('Failed to update some device orders');
      }
      
      console.log('대여기기 순서 업데이트 성공');
    } catch (error: any) {
      console.error('Error updating order:', error);
      alert('순서 변경 실패: ' + error.message);
      // 실패 시 원래 순서로 복구
      await loadRentableDevices();
    }
  };


  // 기기 선택 뷰
  if (!selectedDevice) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-2">
            <Link
              href="/admin"
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            </Link>
            <h1 className="text-2xl font-bold dark:text-white">대여기기관리</h1>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 ml-11">
            대여 가능한 기기들의 시간대별 가격을 설정합니다
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {deviceTypes.map((device, index) => (
            <motion.div
              key={device.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              draggable="false"
              onDragOver={(e) => handleDragOver(e, index)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, index)}
              className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-all cursor-pointer ${
                draggedIndex === index ? 'opacity-50' : ''
              } ${
                dragOverIndex === index ? 'ring-2 ring-blue-500' : ''
              }`}
              onClick={(e) => {
                // 드래그 핸들 클릭시 선택 방지
                const target = e.target as HTMLElement;
                if (!target.closest('.drag-handle')) {
                  selectDevice(device);
                }
              }}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold dark:text-white">{device.name}</h3>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {device.model_name && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                        모델: {device.model_name}
                      </span>
                    )}
                    {device.version_name && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                        버전: {device.version_name}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{device.category_name}</p>
                </div>
                <div className="flex items-center gap-2">
                  {/* 모바일용 화살표 버튼 */}
                  <div className="flex md:hidden flex-col gap-1">
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        
                        // 순서 업데이트
                        const updatedDevices = [...deviceTypes];
                        const currentIndex = updatedDevices.findIndex(d => d.id === device.id);
                        if (currentIndex > 0) {
                          const temp = updatedDevices[currentIndex];
                          const prev = updatedDevices[currentIndex - 1];
                          if (temp && prev) {
                            updatedDevices[currentIndex] = prev;
                            updatedDevices[currentIndex - 1] = temp;
                            
                            // 각 기기의 순서 업데이트
                            updatedDevices.forEach((d, idx) => {
                              if (d.rental_settings) {
                                d.rental_settings.display_order = idx;
                              }
                            });
                          }
                          
                          setDeviceTypes(updatedDevices);
                          
                          // API 호출로 순서 저장
                          try {
                            const updatePromises = updatedDevices.map((d, idx) => 
                              fetch('/api/admin/rental-settings', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  device_type_id: d.id,
                                  display_order: idx
                                })
                              })
                            );
                            
                            const responses = await Promise.all(updatePromises);
                            const hasError = responses.some(r => !r.ok);
                            
                            if (hasError) {
                              throw new Error('Failed to update device orders');
                            }
                          } catch (error: any) {
                            console.error('Error updating order:', error);
                            alert('순서 변경 실패: ' + error.message);
                            await loadRentableDevices();
                          }
                        }
                      }}
                      className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors disabled:opacity-50"
                      disabled={index === 0}
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        
                        // 순서 업데이트
                        const updatedDevices = [...deviceTypes];
                        const currentIndex = updatedDevices.findIndex(d => d.id === device.id);
                        if (currentIndex < updatedDevices.length - 1) {
                          const temp = updatedDevices[currentIndex];
                          const next = updatedDevices[currentIndex + 1];
                          if (temp && next) {
                            updatedDevices[currentIndex] = next;
                            updatedDevices[currentIndex + 1] = temp;
                            
                            // 각 기기의 순서 업데이트
                            updatedDevices.forEach((d, idx) => {
                              if (d.rental_settings) {
                                d.rental_settings.display_order = idx;
                              }
                            });
                          }
                          
                          setDeviceTypes(updatedDevices);
                          
                          // API 호출로 순서 저장
                          try {
                            const updatePromises = updatedDevices.map((d, idx) => 
                              fetch('/api/admin/rental-settings', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  device_type_id: d.id,
                                  display_order: idx
                                })
                              })
                            );
                            
                            const responses = await Promise.all(updatePromises);
                            const hasError = responses.some(r => !r.ok);
                            
                            if (hasError) {
                              throw new Error('Failed to update device orders');
                            }
                          } catch (error: any) {
                            console.error('Error updating order:', error);
                            alert('순서 변경 실패: ' + error.message);
                            await loadRentableDevices();
                          }
                        }
                      }}
                      className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors disabled:opacity-50"
                      disabled={index === deviceTypes.length - 1}
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>
                  {/* 데스크톱용 드래그 핸들 */}
                  <div className="hidden md:flex items-center gap-2">
                    <div 
                      className="drag-handle cursor-move p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded" 
                      title="드래그하여 순서 변경"
                      draggable="true"
                      onDragStart={(e) => handleDragStart(e, index)}
                    >
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                      </svg>
                    </div>
                  </div>
                  {device.rental_settings?.color && (
                    <div className={`w-8 h-8 rounded ${device.rental_settings.color}`} />
                  )}
                  <Package className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <Hash className="w-4 h-4" />
                  <span>
                    보유: {device.device_count || 0}대 / 
                    대여가능: {device.rental_settings?.max_rental_units || device.device_count || 0}대
                  </span>
                </div>
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <Clock className="w-4 h-4" />
                  <span>
                    시간대: {(() => {
                      const slots = allTimeSlots.filter(slot => slot.device_type_id === device.id);
                      const earlySlots = slots.filter(s => s.slot_type === 'early').length;
                      const overnightSlots = slots.filter(s => s.slot_type === 'overnight').length;
                      if (earlySlots === 0 && overnightSlots === 0) return '미설정';
                      const parts = [];
                      if (earlySlots > 0) parts.push(`조기 ${earlySlots}개`);
                      if (overnightSlots > 0) parts.push(`밤샘 ${overnightSlots}개`);
                      return parts.join(', ');
                    })()}
                  </span>
                </div>
                {device.rental_settings?.max_players === 2 && (
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <Users className="w-4 h-4" />
                    <span>2인 플레이 가능</span>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {deviceTypes.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">대여 가능한 기기가 없습니다.</p>
            <Link
              href="/admin/devices"
              className="inline-flex items-center gap-2 mt-4 text-blue-600 dark:text-blue-400 hover:underline"
            >
              기기 관리로 이동
              <ChevronLeft className="w-4 h-4 rotate-180" />
            </Link>
          </div>
        )}
      </div>
    );
  }

  // 시간대별 가격 설정 뷰
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-2">
          <button
            onClick={goBack}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          </button>
          <h1 className="text-2xl font-bold dark:text-white">{selectedDevice.name} 시간대별 가격</h1>
        </div>
        <div className="ml-11">
          <div className="flex flex-wrap gap-2">
            {selectedDevice.model_name && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                모델: {selectedDevice.model_name}
              </span>
            )}
            {selectedDevice.version_name && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                버전: {selectedDevice.version_name}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            시간대별로 다른 가격을 설정할 수 있습니다
          </p>
        </div>
      </div>

      {/* 대여 가능 대수 및 색상 설정 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold dark:text-white mb-2">대여 설정</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              대여 가능 대수와 캘린더 표시 색상을 설정합니다
            </p>
          </div>
        </div>
        
        {/* 대여 가능 대수 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Hash className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <span className="text-sm font-medium dark:text-white">전체 보유:</span>
              <span className="text-lg font-bold dark:text-white">{selectedDevice.device_count || 0}대</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium dark:text-white">대여 가능:</span>
              <input
                type="number"
                min="0"
                max={selectedDevice.device_count || 0}
                value={selectedDevice.rental_settings?.max_rental_units || selectedDevice.device_count || 0}
                onChange={async (e) => {
                  const newValue = e.target.value === '' ? null : Number(e.target.value);
                  const updatedDevice = {
                    ...selectedDevice,
                    rental_settings: {
                      credit_types: selectedDevice.rental_settings?.credit_types || ['freeplay'],
                      max_players: selectedDevice.rental_settings?.max_players || 1,
                      ...selectedDevice.rental_settings,
                      max_rental_units: newValue || undefined
                    }
                  };
                  setSelectedDevice(updatedDevice);
                  
                  // 즉시 저장
                  try {
                    const response = await fetch('/api/admin/rental-settings', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        device_type_id: selectedDevice.id,
                        max_rental_units: newValue,
                        color: selectedDevice.rental_settings?.color,
                        display_order: selectedDevice.rental_settings?.display_order
                      })
                    });
                    
                    if (!response.ok) {
                      throw new Error('Failed to update rental units');
                    }
                    
                    // 전체 목록도 업데이트
                    setDeviceTypes(deviceTypes.map(d => 
                      d.id === selectedDevice.id 
                        ? updatedDevice
                        : d
                    ));
                  } catch (error: any) {
                    console.error('Error updating rental units:', error);
                    alert('대여 가능 대수 변경 실패: ' + error.message);
                    // 실패 시 원래 값으로 복구
                    await loadRentableDevices();
                  }
                }}
                className="w-20 px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-center"
              />
              <span className="text-sm font-medium dark:text-white">대</span>
            </div>
          </div>
        </div>
        
        {/* 색상 설정 */}
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium dark:text-white mb-1">캘린더 표시 색상</h4>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                예약 현황을 구분하기 위한 기종별 색상
              </p>
            </div>
            <div className="relative">
              <button
                onClick={() => setShowColorPicker(showColorPicker === selectedDevice.id ? null : selectedDevice.id)}
                className="flex items-center gap-2 px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <div className={`w-5 h-5 rounded ${selectedDevice.rental_settings?.color || 'bg-gray-400'}`} />
                <span className="text-sm dark:text-white">색상 선택</span>
                <Palette className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </button>
              
              {showColorPicker === selectedDevice.id && (
                <div className="absolute right-0 mt-2 p-3 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10">
                  <div className="grid grid-cols-3 gap-2 place-items-center">
                    {defaultColors.map(color => (
                      <button
                        key={color.value}
                        onClick={async () => {
                          const updatedDevice = {
                            ...selectedDevice,
                            rental_settings: {
                              credit_types: selectedDevice.rental_settings?.credit_types || ['freeplay'],
                              max_players: selectedDevice.rental_settings?.max_players || 1,
                              ...selectedDevice.rental_settings,
                              color: color.value
                            }
                          };
                          setSelectedDevice(updatedDevice);
                          setShowColorPicker(null);
                          
                          // 즉시 저장
                          try {
                            const response = await fetch('/api/admin/rental-settings', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                device_type_id: selectedDevice.id,
                                max_rental_units: selectedDevice.rental_settings?.max_rental_units,
                                color: color.value,
                                display_order: selectedDevice.rental_settings?.display_order
                              })
                            });
                            
                            if (!response.ok) {
                              throw new Error('Failed to update color');
                            }
                            
                            // 전체 목록도 업데이트
                            setDeviceTypes(deviceTypes.map(d => 
                              d.id === selectedDevice.id 
                                ? updatedDevice
                                : d
                            ));
                          } catch (error: any) {
                            console.error('Error updating color:', error);
                            alert('색상 변경 실패: ' + error.message);
                            // 실패 시 원래 값으로 복구
                            await loadRentableDevices();
                          }
                        }}
                        className={`group w-12 h-12 flex items-center justify-center rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                          selectedDevice.rental_settings?.color === color.value ? 'ring-2 ring-blue-500' : ''
                        }`}
                        title={color.name}
                      >
                        <div className={`w-8 h-8 rounded ${color.value}`} />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {selectedDevice.rental_settings?.max_rental_units && 
         selectedDevice.rental_settings.max_rental_units < (selectedDevice.device_count || 0) && (
          <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              ⚠️ 전체 {selectedDevice.device_count}대 중 {selectedDevice.rental_settings.max_rental_units}대만 동시 예약 가능합니다.
              나머지 {(selectedDevice.device_count || 0) - selectedDevice.rental_settings.max_rental_units}대는 예약 불가능합니다.
            </p>
          </div>
        )}
      </div>

      {/* 시간대 목록 */}
      <div className="space-y-6">
        {/* 조기대여 시간대 */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold dark:text-white flex items-center gap-2">
              <Sun className="w-5 h-5 text-yellow-600" />
              조기대여 시간대
            </h3>
            <button
              onClick={() => {
                setIsAddingSlot(true);
                // 기본값을 조기대여로 설정하기 위해 임시 상태 추가
                sessionStorage.setItem('newSlotType', 'early');
              }}
              className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              조기대여 추가
            </button>
          </div>
          <div className="space-y-4">
            {timeSlots.filter(slot => slot.slot_type === 'early').map((slot) => (
          <motion.div
            key={slot.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6"
          >
            {editingSlot === slot.id ? (
              <TimeSlotForm
                deviceTypeId={selectedDevice.id}
                slot={slot}
                onSave={handleSaveTimeSlot}
                onCancel={() => setEditingSlot(null)}
              />
            ) : (
              <TimeSlotDisplay
                slot={slot}
                onEdit={() => setEditingSlot(slot.id || null)}
                onDelete={() => slot.id && handleDeleteTimeSlot(slot.id)}
              />
            )}
          </motion.div>
            ))}
            {timeSlots.filter(slot => slot.slot_type === 'early').length === 0 && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                조기대여 시간대가 없습니다.
              </div>
            )}
          </div>
        </div>

        {/* 밤샘대여 시간대 */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold dark:text-white flex items-center gap-2">
              <Moon className="w-5 h-5 text-indigo-600" />
              밤샘대여 시간대
            </h3>
            <button
              onClick={() => {
                setIsAddingSlot(true);
                sessionStorage.setItem('newSlotType', 'overnight');
              }}
              className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              밤샘대여 추가
            </button>
          </div>
          <div className="space-y-4">
            {timeSlots.filter(slot => slot.slot_type === 'overnight').map((slot) => (
              <motion.div
                key={slot.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6"
              >
                {editingSlot === slot.id ? (
                  <TimeSlotForm
                    deviceTypeId={selectedDevice.id}
                    slot={slot}
                    onSave={handleSaveTimeSlot}
                    onCancel={() => setEditingSlot(null)}
                  />
                ) : (
                  <TimeSlotDisplay
                    slot={slot}
                    onEdit={() => setEditingSlot(slot.id || null)}
                    onDelete={() => slot.id && handleDeleteTimeSlot(slot.id)}
                  />
                )}
              </motion.div>
            ))}
            {timeSlots.filter(slot => slot.slot_type === 'overnight').length === 0 && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                밤샘대여 시간대가 없습니다.
              </div>
            )}
          </div>
        </div>

        {/* 시간대 추가 폼 */}
        {isAddingSlot && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6"
          >
            <TimeSlotForm
              deviceTypeId={selectedDevice.id}
              slot={{
                device_type_id: selectedDevice.id,
                slot_type: (sessionStorage.getItem('newSlotType') as 'early' | 'overnight') || 'early',
                start_time: sessionStorage.getItem('newSlotType') === 'overnight' ? '22:00' : '10:00',
                end_time: sessionStorage.getItem('newSlotType') === 'overnight' ? '08:00' : '18:00',
                credit_options: [],
                enable_2p: false,
                is_youth_time: false
              }}
              onSave={handleSaveTimeSlot}
              onCancel={() => {
                setIsAddingSlot(false);
                sessionStorage.removeItem('newSlotType');
              }}
            />
          </motion.div>
        )}
      </div>
    </div>
  );
}