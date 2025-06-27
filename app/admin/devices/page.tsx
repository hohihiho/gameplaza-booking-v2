// 기기 관리 페이지
// 비전공자 설명: 관리자가 카테고리, 기종, 개별 기기를 관리하는 페이지입니다
'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  DollarSign,
  Gamepad2,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  ChevronLeft,
  Building2,
  Package,
  Users,
  Hash,
  ChevronUp,
  ChevronDown,
  CheckCircle,
  XCircle,
  Wrench,
  GripVertical
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// 타입 정의
type Category = {
  id: string;
  name: string;
  display_order: number;
};

type DeviceType = {
  id: string;
  name: string;
  category_id: string;
  description?: string;
  display_order?: number;
  play_modes: {
    name: string;
    price: number;
  }[];
  is_rentable: boolean;
  rental_settings?: {
    base_price: number;
    credit_types: ('fixed' | 'freeplay' | 'unlimited')[];
    fixed_credits?: number;
    max_players: number;
    price_multiplier_2p?: number;
  };
  device_count: number;
  active_count: number;
};

type Device = {
  id: string;
  device_type_id: string;
  device_number: number;
  status: 'available' | 'in_use' | 'maintenance' | 'unavailable';
  notes?: string;
  last_maintenance?: string;
};

type ViewType = 'categories' | 'types' | 'devices';

// 기종 편집 폼 컴포넌트
function TypeEditForm({ 
  type,
  categoryId,
  onSubmit, 
  onCancel 
}: { 
  type?: DeviceType;
  categoryId?: string;
  onSubmit: (data: {
    name: string;
    description?: string;
    is_rentable: boolean;
    play_modes?: { name: string; price: number }[];
    rental_settings?: {
      base_price?: number;
      credit_types?: ('fixed' | 'freeplay' | 'unlimited')[];
      fixed_credits?: number;
      max_players?: number;
      price_multiplier_2p?: number;
    };
  }) => void;
  onCancel: () => void;
}) {
  const [playModes, setPlayModes] = useState(type?.play_modes || []);
  const [newModeName, setNewModeName] = useState('');
  const [newModePrice, setNewModePrice] = useState('');
  const [isRentable, setIsRentable] = useState(type?.is_rentable || false);
  const [creditTypes, setCreditTypes] = useState<('fixed' | 'freeplay' | 'unlimited')[]>(
    type?.rental_settings?.credit_types || []
  );

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    onSubmit({
      name: formData.get('name') as string,
      description: formData.get('description') as string || undefined,
      is_rentable: isRentable,
      play_modes: playModes.length > 0 ? playModes : undefined,
      rental_settings: isRentable ? {
        base_price: parseInt(formData.get('base_price') as string) || undefined,
        credit_types: creditTypes.length > 0 ? creditTypes : undefined,
        fixed_credits: creditTypes.includes('fixed') ? parseInt(formData.get('fixed_credits') as string) || undefined : undefined,
        max_players: parseInt(formData.get('max_players') as string) || 1,
        price_multiplier_2p: parseFloat(formData.get('price_multiplier_2p') as string) || undefined
      } : undefined
    });
  };

  const addPlayMode = () => {
    if (newModeName && newModePrice) {
      setPlayModes([...playModes, { 
        name: newModeName, 
        price: parseInt(newModePrice)
      }]);
      setNewModeName('');
      setNewModePrice('');
    }
  };

  const removePlayMode = (index: number) => {
    setPlayModes(playModes.filter((_, i) => i !== index));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-lg font-semibold dark:text-white mb-4">
        {type ? '기종 수정' : '기종 추가'}
      </h3>
      
      {/* 기본 정보 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            기종명 *
          </label>
          <input
            name="name"
            type="text"
            defaultValue={type?.name}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
            autoFocus
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            설명
          </label>
          <input
            name="description"
            type="text"
            defaultValue={type?.description}
            placeholder="예: 발키리 PLUS"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* 플레이 모드 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          플레이 모드별 가격
        </label>
        
        {/* 기존 모드 목록 */}
        <div className="space-y-2 mb-3">
          {playModes.map((mode, index) => (
            <div key={index} className="flex items-center gap-2">
              <input
                type="text"
                value={mode.name}
                onChange={(e) => {
                  const updated = [...playModes];
                  updated[index].name = e.target.value;
                  setPlayModes(updated);
                }}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="모드명"
              />
              <input
                type="number"
                value={mode.price}
                onChange={(e) => {
                  const updated = [...playModes];
                  updated[index].price = parseInt(e.target.value) || 0;
                  setPlayModes(updated);
                }}
                className="w-32 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="가격"
              />
              <span className="text-sm text-gray-600 dark:text-gray-400">원</span>
              <button
                type="button"
                onClick={() => removePlayMode(index)}
                className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        {/* 새 모드 추가 */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={newModeName}
            onChange={(e) => setNewModeName(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            placeholder="새 모드명"
          />
          <input
            type="number"
            value={newModePrice}
            onChange={(e) => setNewModePrice(e.target.value)}
            className="w-32 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            placeholder="가격"
          />
          <button
            type="button"
            onClick={addPlayMode}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 대여 설정 */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
        <label className="flex items-center gap-2 mb-4">
          <input
            type="checkbox"
            checked={isRentable}
            onChange={(e) => setIsRentable(e.target.checked)}
            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
          />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">대여 가능</span>
        </label>

        {isRentable && (
          <div className="space-y-4 ml-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  기본 가격 (원)
                </label>
                <input
                  name="base_price"
                  type="number"
                  defaultValue={type?.rental_settings?.base_price}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="30000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  최대 플레이어 수
                </label>
                <select
                  name="max_players"
                  defaultValue={type?.rental_settings?.max_players || 1}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="1">1명</option>
                  <option value="2">2명</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                크레디트 타입
              </label>
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={creditTypes.includes('fixed')}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setCreditTypes([...creditTypes, 'fixed']);
                      } else {
                        setCreditTypes(creditTypes.filter(t => t !== 'fixed'));
                      }
                    }}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">고정 크레디트</span>
                </label>
                {creditTypes.includes('fixed') && (
                  <div className="ml-6">
                    <input
                      name="fixed_credits"
                      type="number"
                      defaultValue={type?.rental_settings?.fixed_credits}
                      placeholder="크레디트 수"
                      className="w-32 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                )}
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={creditTypes.includes('freeplay')}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setCreditTypes([...creditTypes, 'freeplay']);
                      } else {
                        setCreditTypes(creditTypes.filter(t => t !== 'freeplay'));
                      }
                    }}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">프리플레이</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={creditTypes.includes('unlimited')}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setCreditTypes([...creditTypes, 'unlimited']);
                      } else {
                        setCreditTypes(creditTypes.filter(t => t !== 'unlimited'));
                      }
                    }}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">무제한</span>
                </label>
              </div>
            </div>

            {type?.rental_settings?.max_players === 2 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  2인 플레이 가격 배수
                </label>
                <input
                  name="price_multiplier_2p"
                  type="number"
                  step="0.1"
                  defaultValue={type?.rental_settings?.price_multiplier_2p || 1.5}
                  className="w-32 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          {type ? '수정' : '추가'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg transition-colors"
        >
          취소
        </button>
      </div>
    </form>
  );
}

// 기기 카드 컴포넌트
function DeviceCard({ 
  device, 
  onStatusChange, 
  onEdit, 
  onDelete,
  isEditing,
  onSave,
  onCancel
}: {
  device: Device;
  onStatusChange: (status: Device['status']) => void;
  onEdit: () => void;
  onDelete: () => void;
  isEditing: boolean;
  onSave: (notes: string) => void;
  onCancel: () => void;
}) {
  const [notes, setNotes] = useState(device.notes || '');

  const statusConfig = {
    available: { color: 'text-green-600 dark:text-green-400', icon: CheckCircle, label: '사용 가능' },
    in_use: { color: 'text-blue-600 dark:text-blue-400', icon: Gamepad2, label: '사용 중' },
    maintenance: { color: 'text-orange-600 dark:text-orange-400', icon: Wrench, label: '점검 중' },
    unavailable: { color: 'text-red-600 dark:text-red-400', icon: XCircle, label: '사용 불가' }
  };

  const StatusIcon = statusConfig[device.status].icon;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h4 className="text-lg font-semibold dark:text-white">#{device.device_number}</h4>
          <div className={`flex items-center gap-2 mt-1 ${statusConfig[device.status].color}`}>
            <StatusIcon className="w-4 h-4" />
            <span className="text-sm">{statusConfig[device.status].label}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={device.status}
            onChange={(e) => onStatusChange(e.target.value as Device['status'])}
            className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="available">사용 가능</option>
            <option value="in_use">사용 중</option>
            <option value="maintenance">점검 중</option>
            <option value="unavailable">사용 불가</option>
          </select>
        </div>
      </div>

      {isEditing ? (
        <div className="space-y-3">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="메모를 입력하세요..."
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
            rows={3}
          />
          <div className="flex gap-2">
            <button
              onClick={() => onSave(notes)}
              className="flex-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
            >
              저장
            </button>
            <button
              onClick={onCancel}
              className="flex-1 px-3 py-1.5 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm rounded-lg transition-colors"
            >
              취소
            </button>
          </div>
        </div>
      ) : (
        <>
          {device.notes && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{device.notes}</p>
          )}
          {device.last_maintenance && (
            <p className="text-xs text-gray-500 dark:text-gray-500 mb-3">
              마지막 점검: {new Date(device.last_maintenance).toLocaleDateString()}
            </p>
          )}
          <div className="flex gap-2">
            <button
              onClick={onEdit}
              className="flex-1 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
            >
              <Edit className="w-4 h-4 mx-auto" />
            </button>
            <button
              onClick={onDelete}
              className="flex-1 px-3 py-1.5 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4 mx-auto" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default function DevicesPage() {
  const router = useRouter();
  
  // 카테고리 관련 상태
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [draggedCategoryIndex, setDraggedCategoryIndex] = useState<number | null>(null);
  const [dragOverCategoryIndex, setDragOverCategoryIndex] = useState<number | null>(null);

  // 기종 관련 상태
  const [deviceTypes, setDeviceTypes] = useState<DeviceType[]>([]);
  const [selectedDeviceType, setSelectedDeviceType] = useState<DeviceType | null>(null);
  const [isAddingType, setIsAddingType] = useState(false);
  const [editingType, setEditingType] = useState<string | null>(null);
  const [draggedTypeIndex, setDraggedTypeIndex] = useState<number | null>(null);
  const [dragOverTypeIndex, setDragOverTypeIndex] = useState<number | null>(null);

  // 기기 관련 상태
  const [devices, setDevices] = useState<Device[]>([]);
  const [editingDevice, setEditingDevice] = useState<string | null>(null);
  const [isLoadingDevices, setIsLoadingDevices] = useState(false);

  // 뷰 상태
  const [view, setView] = useState<ViewType>('categories');
  const [navigationHistory, setNavigationHistory] = useState<ViewType[]>(['categories']);

  // 네비게이션 함수
  const navigateTo = (newView: ViewType) => {
    setView(newView);
    setNavigationHistory(prev => [...prev, newView]);
  };

  const navigateBack = () => {
    if (navigationHistory.length > 1) {
      const newHistory = [...navigationHistory];
      newHistory.pop(); // 현재 뷰 제거
      const previousView = newHistory[newHistory.length - 1];
      
      setView(previousView);
      setNavigationHistory(newHistory);
      
      // 뷰에 따라 상태 초기화
      if (previousView === 'categories') {
        setSelectedCategory(null);
        setSelectedDeviceType(null);
      } else if (previousView === 'types') {
        setSelectedDeviceType(null);
      }
    }
  };

  // 브라우저 뒤로가기 버튼 핸들링
  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      e.preventDefault();
      // 카테고리 뷰에서 뒤로가기 시 대시보드로 이동
      if (view === 'categories') {
        router.push('/admin');
      } else {
        navigateBack();
      }
    };

    // 초기 상태 설정 - 한 번만 설정
    if (navigationHistory.length === 1) {
      window.history.pushState({ page: 'devices' }, '');
    }
    
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [navigationHistory, view, router]);

  // 데이터 로드 함수들
  const loadCategories = async () => {
    try {
      const response = await fetch('/api/admin/devices/categories');
      if (!response.ok) throw new Error('Failed to fetch categories');
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadDeviceTypes = async () => {
    try {
      const response = await fetch('/api/admin/devices/types');
      if (!response.ok) throw new Error('Failed to fetch device types');
      const data = await response.json();
      setDeviceTypes(data || []);
    } catch (error) {
      console.error('Error loading device types:', error);
      setDeviceTypes([]);
    }
  };

  const loadDevices = async (deviceTypeId: string) => {
    setIsLoadingDevices(true);
    try {
      const response = await fetch(`/api/admin/devices?deviceTypeId=${deviceTypeId}`);
      if (!response.ok) throw new Error('Failed to fetch devices');
      const data = await response.json();
      setDevices(data);
    } catch (error) {
      console.error('Error loading devices:', error);
    } finally {
      setIsLoadingDevices(false);
    }
  };

  useEffect(() => {
    loadCategories();
    loadDeviceTypes();
  }, []);

  useEffect(() => {
    if (selectedDeviceType) {
      loadDevices(selectedDeviceType.id);
    }
  }, [selectedDeviceType]);

  // 카테고리 드래그 앤 드롭 핸들러
  const handleCategoryDragStart = (e: React.DragEvent, index: number) => {
    const target = e.target as HTMLElement;
    if (!target.closest('.drag-handle')) {
      e.preventDefault();
      return;
    }
    setDraggedCategoryIndex(index);
  };

  const handleCategoryDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverCategoryIndex(index);
  };

  const handleCategoryDragLeave = () => {
    setDragOverCategoryIndex(null);
  };

  const handleCategoryDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    
    if (draggedCategoryIndex === null || draggedCategoryIndex === dropIndex) {
      setDraggedCategoryIndex(null);
      setDragOverCategoryIndex(null);
      return;
    }

    const updatedCategories = [...categories];
    const [draggedItem] = updatedCategories.splice(draggedCategoryIndex, 1);
    updatedCategories.splice(dropIndex, 0, draggedItem);

    updatedCategories.forEach((category, idx) => {
      category.display_order = idx + 1;
    });

    setCategories(updatedCategories);
    setDraggedCategoryIndex(null);
    setDragOverCategoryIndex(null);

    try {
      await fetch('/api/admin/devices/categories', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categories: updatedCategories.map(cat => ({
            id: cat.id,
            display_order: cat.display_order
          }))
        })
      });
    } catch (error) {
      console.error('Error updating category order:', error);
    }
  };

  // 기종 드래그 앤 드롭 핸들러
  const handleTypeDragStart = (e: React.DragEvent, index: number) => {
    const target = e.target as HTMLElement;
    if (!target.closest('.drag-handle')) {
      e.preventDefault();
      return;
    }
    setDraggedTypeIndex(index);
  };

  const handleTypeDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverTypeIndex(index);
  };

  const handleTypeDragLeave = () => {
    setDragOverTypeIndex(null);
  };

  const handleTypeDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    
    if (draggedTypeIndex === null || draggedTypeIndex === dropIndex) {
      setDraggedTypeIndex(null);
      setDragOverTypeIndex(null);
      return;
    }

    const categoryTypes = deviceTypes
      .filter(t => t.category_id === selectedCategory?.id)
      .sort((a, b) => (a.display_order ?? 999) - (b.display_order ?? 999));

    const updatedTypes = [...categoryTypes];
    const [draggedItem] = updatedTypes.splice(draggedTypeIndex, 1);
    updatedTypes.splice(dropIndex, 0, draggedItem);

    updatedTypes.forEach((type, idx) => {
      type.display_order = idx + 1;
    });

    const allUpdatedTypes = deviceTypes.map(t => {
      const updated = updatedTypes.find(ut => ut.id === t.id);
      return updated || t;
    });

    setDeviceTypes(allUpdatedTypes);
    setDraggedTypeIndex(null);
    setDragOverTypeIndex(null);

    try {
      for (const type of updatedTypes) {
        await fetch('/api/admin/devices/types', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: type.id,
            display_order: type.display_order
          })
        });
      }
    } catch (error) {
      console.error('Error updating type order:', error);
    }
  };

  // 카테고리 뷰
  if (view === 'categories') {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-2">
            <button
              onClick={() => router.push('/admin')}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            </button>
            <h1 className="text-2xl font-bold dark:text-white">기기 관리</h1>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 ml-11">
            카테고리, 기종, 개별 기기를 관리합니다
          </p>
        </div>

        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold dark:text-white">카테고리 관리</h2>
          <button
            onClick={() => setIsAddingCategory(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            카테고리 추가
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {isAddingCategory && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-800 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 p-4"
            >
              <form onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const name = formData.get('name') as string;
                
                try {
                  await fetch('/api/admin/devices/categories', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                      name,
                      display_order: categories.length + 1
                    })
                  });
                  
                  loadCategories();
                  setIsAddingCategory(false);
                } catch (error) {
                  console.error('Error creating category:', error);
                }
              }}>
                <input
                  name="name"
                  type="text"
                  placeholder="카테고리 이름"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-3"
                  required
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
                  >
                    추가
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAddingCategory(false)}
                    className="flex-1 px-3 py-1.5 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm rounded-lg transition-colors"
                  >
                    취소
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {categories.map((category, index) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              draggable="false"
              onDragOver={(e) => handleCategoryDragOver(e, index)}
              onDragLeave={handleCategoryDragLeave}
              onDrop={(e) => handleCategoryDrop(e, index)}
              className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-all cursor-pointer ${
                draggedCategoryIndex === index ? 'opacity-50' : ''
              } ${
                dragOverCategoryIndex === index ? 'ring-2 ring-blue-500' : ''
              }`}
              onClick={(e) => {
                const target = e.target as HTMLElement;
                if (!target.closest('.drag-handle') && !target.closest('button')) {
                  setSelectedCategory(category);
                  navigateTo('types');
                }
              }}
            >
              {editingCategory === category.id ? (
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  const name = formData.get('name') as string;
                  
                  try {
                    await fetch('/api/admin/devices/categories', {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ id: category.id, name })
                    });
                    
                    loadCategories();
                    setEditingCategory(null);
                  } catch (error) {
                    console.error('Error updating category:', error);
                  }
                }}>
                  <input
                    name="name"
                    type="text"
                    defaultValue={category.name}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-3"
                    required
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="flex-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
                    >
                      <Save className="w-4 h-4 mx-auto" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingCategory(null)}
                      className="flex-1 px-3 py-1.5 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm rounded-lg transition-colors"
                    >
                      <X className="w-4 h-4 mx-auto" />
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold dark:text-white">{category.name}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">카테고리</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex md:hidden flex-col gap-1">
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            if (index === 0) return;
                            
                            const updatedCategories = [...categories];
                            [updatedCategories[index - 1], updatedCategories[index]] = 
                            [updatedCategories[index], updatedCategories[index - 1]];
                            
                            updatedCategories.forEach((c, idx) => {
                              c.display_order = idx + 1;
                            });
                            
                            setCategories(updatedCategories);
                            
                            try {
                              await fetch('/api/admin/devices/categories', {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  categories: updatedCategories.map(cat => ({
                                    id: cat.id,
                                    display_order: cat.display_order
                                  }))
                                })
                              });
                            } catch (error) {
                              console.error('Error updating order:', error);
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
                            if (index === categories.length - 1) return;
                            
                            const updatedCategories = [...categories];
                            [updatedCategories[index], updatedCategories[index + 1]] = 
                            [updatedCategories[index + 1], updatedCategories[index]];
                            
                            updatedCategories.forEach((c, idx) => {
                              c.display_order = idx + 1;
                            });
                            
                            setCategories(updatedCategories);
                            
                            try {
                              await fetch('/api/admin/devices/categories', {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  categories: updatedCategories.map(cat => ({
                                    id: cat.id,
                                    display_order: cat.display_order
                                  }))
                                })
                              });
                            } catch (error) {
                              console.error('Error updating order:', error);
                            }
                          }}
                          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors disabled:opacity-50"
                          disabled={index === categories.length - 1}
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="hidden md:flex items-center gap-2">
                        <div 
                          className="drag-handle cursor-move p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded" 
                          title="드래그하여 순서 변경"
                          draggable="true"
                          onDragStart={(e) => handleCategoryDragStart(e, index)}
                        >
                          <GripVertical className="w-5 h-5 text-gray-400" />
                        </div>
                      </div>
                      <Building2 className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <Gamepad2 className="w-4 h-4" />
                      <span>{deviceTypes.filter(t => t.category_id === category.id).length}개 기종</span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingCategory(category.id);
                      }}
                      className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                    >
                      <Edit className="w-4 h-4 mx-auto" />
                    </button>
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (confirm('이 카테고리를 삭제하시겠습니까?')) {
                          try {
                            await fetch('/api/admin/devices/categories', {
                              method: 'DELETE',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ id: category.id })
                            });
                            
                            loadCategories();
                          } catch (error) {
                            console.error('Error deleting category:', error);
                          }
                        }
                      }}
                      className="flex-1 px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4 mx-auto" />
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  // 기종 뷰
  if (view === 'types' && selectedCategory) {
    const categoryTypes = deviceTypes
      .filter(t => t.category_id === selectedCategory.id)
      .sort((a, b) => (a.display_order ?? 999) - (b.display_order ?? 999));

    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-2">
            <button
              onClick={navigateBack}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            </button>
            <h1 className="text-2xl font-bold dark:text-white">{selectedCategory.name} 기종 관리</h1>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 ml-11">
            카테고리 내 기종을 관리합니다
          </p>
        </div>

        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold dark:text-white">기종 목록</h2>
          <button
            onClick={() => setIsAddingType(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            기종 추가
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {isAddingType && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-800 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 p-4 col-span-full"
            >
              <TypeEditForm
                categoryId={selectedCategory.id}
                onSubmit={async (data) => {
                  try {
                    // 기종 생성
                    const response = await fetch('/api/admin/devices/types', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        name: data.name,
                        description: data.description,
                        category_id: selectedCategory.id,
                        display_order: categoryTypes.length + 1,
                        is_rentable: data.is_rentable
                      })
                    });
                    
                    if (!response.ok) throw new Error('Failed to create device type');
                    const newType = await response.json();
                    
                    // 플레이 모드 추가
                    if (data.play_modes && data.play_modes.length > 0) {
                      await fetch(`/api/admin/devices/types/${newType.id}/play-modes`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ play_modes: data.play_modes })
                      });
                    }
                    
                    // 대여 설정 추가
                    if (data.is_rentable && data.rental_settings) {
                      await fetch(`/api/admin/devices/types/${newType.id}/rental-settings`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(data.rental_settings)
                      });
                    }
                    
                    loadDeviceTypes();
                    setIsAddingType(false);
                  } catch (error) {
                    console.error('Error creating device type:', error);
                    alert('기종 추가에 실패했습니다.');
                  }
                }}
                onCancel={() => setIsAddingType(false)}
              />
            </motion.div>
          )}

          {categoryTypes.map((type, index) => (
            <motion.div
              key={type.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              draggable="false"
              onDragOver={(e) => handleTypeDragOver(e, index)}
              onDragLeave={handleTypeDragLeave}
              onDrop={(e) => handleTypeDrop(e, index)}
              className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 ${
                editingType === type.id ? 'p-4 col-span-full' : 'p-6 hover:shadow-lg cursor-pointer'
              } transition-all ${
                draggedTypeIndex === index ? 'opacity-50' : ''
              } ${
                dragOverTypeIndex === index ? 'ring-2 ring-blue-500' : ''
              }`}
              onClick={(e) => {
                if (editingType === type.id) return;
                const target = e.target as HTMLElement;
                if (!target.closest('.drag-handle') && !target.closest('button')) {
                  setSelectedDeviceType(type);
                  navigateTo('devices');
                }
              }}
            >
              {editingType === type.id ? (
                <TypeEditForm
                  type={type}
                  onSubmit={async (data) => {
                    try {
                      // 기종 정보 업데이트
                      await fetch('/api/admin/devices/types', {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          id: type.id,
                          name: data.name,
                          description: data.description,
                          is_rentable: data.is_rentable
                        })
                      });
                      
                      // 플레이 모드 업데이트
                      if (data.play_modes) {
                        await fetch(`/api/admin/devices/types/${type.id}/play-modes`, {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ play_modes: data.play_modes })
                        });
                      }
                      
                      // 대여 설정 업데이트
                      if (data.is_rentable && data.rental_settings) {
                        await fetch(`/api/admin/devices/types/${type.id}/rental-settings`, {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify(data.rental_settings)
                        });
                      }
                      
                      loadDeviceTypes();
                      setEditingType(null);
                    } catch (error) {
                      console.error('Error updating device type:', error);
                      alert('기종 수정에 실패했습니다.');
                    }
                  }}
                  onCancel={() => setEditingType(null)}
                />
              ) : (
                <>
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold dark:text-white">{type.name}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{type.description || '설명 없음'}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex md:hidden flex-col gap-1">
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            if (index === 0) return;
                            
                            const updatedTypes = [...categoryTypes];
                            [updatedTypes[index - 1], updatedTypes[index]] = 
                            [updatedTypes[index], updatedTypes[index - 1]];
                            
                            updatedTypes.forEach((t, idx) => {
                              t.display_order = idx + 1;
                            });
                            
                            const allUpdatedTypes = deviceTypes.map(t => {
                              const updated = updatedTypes.find(ut => ut.id === t.id);
                              return updated || t;
                            });
                            
                            setDeviceTypes(allUpdatedTypes);
                            
                            try {
                              for (const type of updatedTypes) {
                                await fetch('/api/admin/devices/types', {
                                  method: 'PATCH',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({
                                    id: type.id,
                                    display_order: type.display_order
                                  })
                                });
                              }
                            } catch (error) {
                              console.error('Error updating order:', error);
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
                            if (index === categoryTypes.length - 1) return;
                            
                            const updatedTypes = [...categoryTypes];
                            [updatedTypes[index], updatedTypes[index + 1]] = 
                            [updatedTypes[index + 1], updatedTypes[index]];
                            
                            updatedTypes.forEach((t, idx) => {
                              t.display_order = idx + 1;
                            });
                            
                            const allUpdatedTypes = deviceTypes.map(t => {
                              const updated = updatedTypes.find(ut => ut.id === t.id);
                              return updated || t;
                            });
                            
                            setDeviceTypes(allUpdatedTypes);
                            
                            try {
                              for (const type of updatedTypes) {
                                await fetch('/api/admin/devices/types', {
                                  method: 'PATCH',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({
                                    id: type.id,
                                    display_order: type.display_order
                                  })
                                });
                              }
                            } catch (error) {
                              console.error('Error updating order:', error);
                            }
                          }}
                          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors disabled:opacity-50"
                          disabled={index === categoryTypes.length - 1}
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="hidden md:flex items-center gap-2">
                        <div 
                          className="drag-handle cursor-move p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded" 
                          title="드래그하여 순서 변경"
                          draggable="true"
                          onDragStart={(e) => handleTypeDragStart(e, index)}
                        >
                          <GripVertical className="w-5 h-5 text-gray-400" />
                        </div>
                      </div>
                      <Package className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <Hash className="w-4 h-4" />
                      <span>보유: {type.device_count || 0}대 / 활성: {type.active_count || 0}대</span>
                    </div>
                    {type.is_rentable && (
                      <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                        <CheckCircle className="w-4 h-4" />
                        <span>대여 가능</span>
                      </div>
                    )}
                    {type.play_modes && type.play_modes.length > 0 && (
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <DollarSign className="w-4 h-4" />
                        <span>{type.play_modes.map(m => `${m.name}: ${m.price.toLocaleString()}원`).join(', ')}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingType(type.id);
                      }}
                      className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                    >
                      <Edit className="w-4 h-4 mx-auto" />
                    </button>
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (confirm('이 기종을 삭제하시겠습니까?')) {
                          try {
                            await fetch(`/api/admin/devices/types/${type.id}`, {
                              method: 'DELETE'
                            });
                            
                            loadDeviceTypes();
                          } catch (error) {
                            console.error('Error deleting device type:', error);
                          }
                        }
                      }}
                      className="flex-1 px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4 mx-auto" />
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          ))}
        </div>

        {categoryTypes.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">이 카테고리에 기종이 없습니다.</p>
          </div>
        )}
      </div>
    );
  }

  // 개별 기기 뷰
  if (view === 'devices' && selectedDeviceType) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-2">
            <button
              onClick={navigateBack}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            </button>
            <h1 className="text-2xl font-bold dark:text-white">{selectedDeviceType.name} 개별 기기 관리</h1>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 ml-11">
            개별 기기의 상태를 관리합니다
          </p>
        </div>

        <div className="mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">전체</span>
                  <p className="text-2xl font-bold dark:text-white">{devices.length}</p>
                </div>
                <div>
                  <span className="text-sm text-green-600 dark:text-green-400">사용 가능</span>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {devices.filter(d => d.status === 'available').length}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-blue-600 dark:text-blue-400">사용 중</span>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {devices.filter(d => d.status === 'in_use').length}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-orange-600 dark:text-orange-400">점검 중</span>
                  <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    {devices.filter(d => d.status === 'maintenance').length}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-red-600 dark:text-red-400">사용 불가</span>
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {devices.filter(d => d.status === 'unavailable').length}
                  </p>
                </div>
              </div>
              <button
                onClick={async () => {
                  const count = prompt('추가할 기기 개수를 입력하세요:', '1');
                  if (count && parseInt(count) > 0) {
                    try {
                      const newDevices = Array.from({ length: parseInt(count) }, (_, i) => ({
                        device_type_id: selectedDeviceType.id,
                        device_number: devices.length + i + 1
                      }));
                      
                      for (const device of newDevices) {
                        await fetch('/api/admin/devices', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify(device)
                        });
                      }
                      
                      loadDevices(selectedDeviceType.id);
                      loadDeviceTypes();
                    } catch (error) {
                      console.error('Error adding devices:', error);
                    }
                  }
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4 inline mr-2" />
                기기 추가
              </button>
            </div>
          </div>
        </div>

        {isLoadingDevices ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white mx-auto"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {devices.map((device) => (
              <DeviceCard
                key={device.id}
                device={device}
                isEditing={editingDevice === device.id}
                onStatusChange={async (status) => {
                  try {
                    await fetch(`/api/admin/devices/${device.id}`, {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ status })
                    });
                    
                    setDevices(devices.map(d => 
                      d.id === device.id ? { ...d, status } : d
                    ));
                    loadDeviceTypes();
                  } catch (error) {
                    console.error('Error updating device status:', error);
                  }
                }}
                onEdit={() => setEditingDevice(device.id)}
                onSave={async (notes) => {
                  try {
                    await fetch(`/api/admin/devices/${device.id}`, {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ notes })
                    });
                    
                    setDevices(devices.map(d => 
                      d.id === device.id ? { ...d, notes } : d
                    ));
                    setEditingDevice(null);
                  } catch (error) {
                    console.error('Error updating device notes:', error);
                  }
                }}
                onCancel={() => setEditingDevice(null)}
                onDelete={async () => {
                  if (confirm('이 기기를 삭제하시겠습니까?')) {
                    try {
                      await fetch(`/api/admin/devices/${device.id}`, {
                        method: 'DELETE'
                      });
                      
                      loadDevices(selectedDeviceType.id);
                      loadDeviceTypes();
                    } catch (error) {
                      console.error('Error deleting device:', error);
                    }
                  }
                }}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return null;
}