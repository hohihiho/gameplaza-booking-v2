// 기기 관리 페이지
// 비전공자 설명: 관리자가 카테고리, 기종, 개별 기기를 관리하는 페이지입니다
'use client';

import { useState, useEffect, useCallback, memo, useMemo } from 'react';
import { supabase, supabaseAdmin } from '@/lib/db/dummy-client'; // 임시 더미 클라이언트
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
  Hash,
  ChevronUp,
  ChevronDown,
  CheckCircle,
  XCircle,
  Wrench,
  GripVertical,
  Info
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
// Supabase 제거됨 - Cloudflare D1 사용

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
  model_name?: string;
  version_name?: string;
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
  status: 'available' | 'in_use' | 'maintenance' | 'broken';
  notes?: string;
  last_maintenance?: string;
};

type ViewType = 'categories' | 'types' | 'devices';

// 기종 편집 폼 컴포넌트
function TypeEditForm({ 
  type,
  onSubmit, 
  onCancel 
}: { 
  type?: DeviceType;
  onSubmit: (data: {
    name: string;
    description?: string;
    model_name?: string;
    version_name?: string;
    is_rentable: boolean;
    play_modes?: { name: string; price: number }[];
  }) => void;
  onCancel: () => void;
}) {
  const [playModes, setPlayModes] = useState(() => {
    const initialModes = type?.play_modes?.map(mode => ({ name: mode.name, price: mode.price })) || [];
    console.log('TypeEditForm 초기화 - type:', type);
    console.log('TypeEditForm 초기화 - play_modes:', type?.play_modes);
    console.log('TypeEditForm 초기화 - initialModes:', initialModes);
    return initialModes;
  });
  const [newModeName, setNewModeName] = useState('');
  const [newModePrice, setNewModePrice] = useState('');
  const [isRentable, setIsRentable] = useState(type?.is_rentable || false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    // 플레이 모드 필수 체크
    if (playModes.length === 0) {
      alert('최소 1개 이상의 플레이 모드를 추가해주세요.\n\n예: 스탠다드 1000원, DX모드 1500원');
      return;
    }
    
    console.log('TypeEditForm - 현재 playModes:', playModes);
    
    onSubmit({
      name: formData.get('name') as string,
      description: formData.get('description') as string || undefined,
      model_name: formData.get('model_name') as string || undefined,
      version_name: formData.get('version_name') as string || undefined,
      is_rentable: isRentable,
      play_modes: playModes
    });
  };

  const addPlayMode = () => {
    if (!newModeName || !newModePrice) {
      alert('모드명과 가격을 모두 입력해주세요');
      return;
    }
    
    const newMode = { 
      name: newModeName.trim(), 
      price: parseInt(newModePrice)
    };
    
    // 중복 체크
    if (playModes.some(mode => mode.name === newMode.name)) {
      alert('이미 동일한 모드명이 존재합니다');
      return;
    }
    
    console.log('TypeEditForm - 새 모드 추가:', newMode);
    const updatedModes = [...playModes, newMode];
    setPlayModes(updatedModes);
    setNewModeName('');
    setNewModePrice('');
    
    // 성공 피드백 (간단한 alert로 대체)
    // 나중에 toast library 추가 가능
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
      <div className="space-y-4">
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
              기체 설명 (선택)
            </label>
            <textarea
              name="description"
              defaultValue={type?.description}
              placeholder="기체에 대한 고객용 설명 (예: 최신 기체, LED 키보드 탑재 등)"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y min-h-[42px]"
              rows={1}
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              모델명
            </label>
            <input
              name="model_name"
              type="text"
              defaultValue={type?.model_name}
              placeholder="예: VALKYRIE model, LIGHTNING model"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              버전명
            </label>
            <input
              name="version_name"
              type="text"
              defaultValue={type?.version_name}
              placeholder="예: EXCEED GEAR, BISTROVER"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* 플레이 모드 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          플레이 모드별 가격 {playModes.length === 0 && <span className="text-red-500">*</span>}
        </label>
        
        {/* 기존 모드 목록 */}
        {playModes.length > 0 ? (
          <div className="space-y-2 mb-3">
            {playModes.map((mode, index) => (
            <div key={index} className="flex items-center gap-2">
              <input
                type="text"
                value={mode.name}
                onChange={(e) => {
                  const updated = [...playModes];
                  if (updated[index]) {
                    updated[index].name = e.target.value;
                    setPlayModes(updated);
                  }
                }}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="모드명"
              />
              <input
                type="number"
                value={mode.price}
                onChange={(e) => {
                  const updated = [...playModes];
                  if (updated[index]) {
                    updated[index].price = parseInt(e.target.value) || 0;
                    setPlayModes(updated);
                  }
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
        ) : (
          <div className="text-sm text-gray-500 dark:text-gray-400 mb-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <Info className="w-4 h-4 inline mr-1" />
            아직 플레이 모드가 없습니다. 아래에서 추가해주세요.
          </div>
        )}

        {/* 새 모드 추가 */}
        <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-3 bg-gray-50 dark:bg-gray-800/50">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            플레이 모드를 추가하려면 아래에 입력 후 Enter 또는 + 버튼을 눌러주세요
          </p>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newModeName}
              onChange={(e) => setNewModeName(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addPlayMode();
                }
              }}
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="예: 스탠다드, DX모드"
            />
            <input
              type="number"
              value={newModePrice}
              onChange={(e) => setNewModePrice(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addPlayMode();
                }
              }}
              className="w-32 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="1000"
            />
            <button
              type="button"
              onClick={addPlayMode}
              disabled={!newModeName || !newModePrice}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>추가</span>
            </button>
          </div>
        </div>
      </div>

      {/* 대여 설정 */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={isRentable}
            onChange={(e) => setIsRentable(e.target.checked)}
            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
          />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">대여 가능</span>
        </label>
        {isRentable && (
          <p className="text-xs text-gray-500 dark:text-gray-400 ml-6 mt-2">
            ※ 세부 대여 설정은 대여기기 관리 메뉴에서 설정하세요
          </p>
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

// 기기 카드 컴포넌트 - memo로 최적화
const DeviceCard = memo(function DeviceCard({ 
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
  onSave: (updates: { notes?: string }) => void;
  onCancel: () => void;
}) {
  const [notes, setNotes] = useState(device.notes || '');

  const statusConfig = {
    available: { color: 'text-green-600 dark:text-green-400', icon: CheckCircle, label: '사용 가능' },
    in_use: { color: 'text-blue-600 dark:text-blue-400', icon: Gamepad2, label: '대여중' },
    maintenance: { color: 'text-orange-600 dark:text-orange-400', icon: Wrench, label: '점검 중' },
    broken: { color: 'text-red-600 dark:text-red-400', icon: XCircle, label: '사용 불가' }
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
            <option value="in_use">대여중</option>
            <option value="maintenance">점검 중</option>
            <option value="broken">사용 불가</option>
          </select>
        </div>
      </div>

      {isEditing ? (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">메모</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="특이사항을 입력하세요..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
              rows={2}
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onSave({ notes })}
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
});

export default function DevicesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // const supabase = getDb() // D1 사용);
  
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

  // URL 파라미터에서 초기 상태 읽기
  const initialView = (searchParams.get('view') as ViewType) || 'categories';
  const initialCategoryId = searchParams.get('categoryId');
  const initialTypeId = searchParams.get('typeId');
  
  // 뷰 상태
  const [view, setView] = useState<ViewType>(initialView);

  // URL 업데이트 함수
  const updateURL = useCallback((params: { 
    view?: ViewType; 
    categoryId?: string | null; 
    typeId?: string | null 
  }) => {
    const url = new URL(window.location.href);
    
    if (params.view) url.searchParams.set('view', params.view);
    else url.searchParams.delete('view');
    
    if (params.categoryId) url.searchParams.set('categoryId', params.categoryId);
    else url.searchParams.delete('categoryId');
    
    if (params.typeId) url.searchParams.set('typeId', params.typeId);
    else url.searchParams.delete('typeId');
    
    window.history.pushState({}, '', url.toString());
  }, []);

  // 네비게이션 함수
  const navigateTo = useCallback((newView: ViewType) => {
    setView(newView);
    
    if (newView === 'types' && selectedCategory) {
      updateURL({ view: 'types', categoryId: selectedCategory.id });
    } else if (newView === 'devices' && selectedCategory && selectedDeviceType) {
      updateURL({ view: 'devices', categoryId: selectedCategory.id, typeId: selectedDeviceType.id });
    } else {
      updateURL({ view: newView });
    }
  }, [selectedCategory, selectedDeviceType, updateURL]);

  // useMemo 최적화: 선택된 카테고리의 기기 타입들
  const categoryTypes = useMemo(() => {
    if (!selectedCategory?.id) return [];
    return deviceTypes
      .filter(t => t.category_id === selectedCategory.id)
      .sort((a, b) => (a.display_order ?? 999) - (b.display_order ?? 999));
  }, [deviceTypes, selectedCategory?.id]);

  // useMemo 최적화: 카테고리별 기기 타입 개수
  const categoryTypeCount = useMemo(() => {
    const counts: { [categoryId: string]: number } = {};
    deviceTypes.forEach(type => {
      if (type.category_id) {
        counts[type.category_id] = (counts[type.category_id] || 0) + 1;
      }
    });
    return counts;
  }, [deviceTypes]);

  // useMemo 최적화: 기기 상태별 통계
  const deviceStats = useMemo(() => {
    const stats = {
      total: devices.length,
      available: devices.filter(d => d.status === 'available').length,
      maintenance: devices.filter(d => d.status === 'maintenance').length,
      broken: devices.filter(d => d.status === 'broken').length
    };
    return stats;
  }, [devices]);

  const navigateBack = useCallback(() => {
    if (view === 'devices') {
      setView('types');
      setSelectedDeviceType(null);
      updateURL({ view: 'types', categoryId: selectedCategory?.id });
    } else if (view === 'types') {
      setView('categories');
      setSelectedCategory(null);
      setSelectedDeviceType(null);
      updateURL({ view: 'categories' });
    } else {
      router.push('/admin');
    }
  }, [view, selectedCategory, router, updateURL]);

  // 브라우저 뒤로가기 버튼 핸들링
  useEffect(() => {
    const handlePopState = () => {
      // URL에서 현재 상태 읽기
      const params = new URLSearchParams(window.location.search);
      const urlView = params.get('view') as ViewType;
      const urlCategoryId = params.get('categoryId');
      const urlTypeId = params.get('typeId');
      
      // URL에 따라 뷰 상태 복원
      if (!urlView || urlView === 'categories') {
        setView('categories');
        setSelectedCategory(null);
        setSelectedDeviceType(null);
      } else if (urlView === 'types' && urlCategoryId) {
        setView('types');
        // 카테고리 찾아서 설정
        const category = categories.find(c => c.id === urlCategoryId);
        if (category) setSelectedCategory(category);
        setSelectedDeviceType(null);
      } else if (urlView === 'devices' && urlCategoryId && urlTypeId) {
        setView('devices');
        // 카테고리와 타입 찾아서 설정
        const category = categories.find(c => c.id === urlCategoryId);
        if (category) setSelectedCategory(category);
        const type = deviceTypes.find(t => t.id === urlTypeId);
        if (type) setSelectedDeviceType(type);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [categories, deviceTypes]);

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
      // API 엔드포인트 사용 (Supabase 직접 호출 대신)
      const response = await fetch('/api/admin/devices/types', {
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const types = await response.json();

      // 각 기종별 기기 수 계산 및 play_modes 정렬 (API에서 이미 처리됨)
      const typesWithCounts = (types || []).map(type => ({
        ...type,
        device_count: type.device_count || 0,
        active_count: type.active_count || 0,
        play_modes: type.play_modes ? type.play_modes.sort((a: any, b: any) => 
          (a.display_order || 0) - (b.display_order || 0)
        ) : []
      }));

      setDeviceTypes(typesWithCounts);
    } catch (error) {
      console.error('Error loading device types:', error);
      setDeviceTypes([]);
    }
  };;

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
  
  // 초기 URL 파라미터에 따라 상태 설정
  useEffect(() => {
    if (categories.length > 0 && deviceTypes.length > 0) {
      if (initialCategoryId) {
        const category = categories.find(c => c.id === initialCategoryId);
        if (category) {
          setSelectedCategory(category);
          if (initialTypeId) {
            const type = deviceTypes.find(t => t.id === initialTypeId);
            if (type) {
              setSelectedDeviceType(type);
            }
          }
        }
      }
    }
  }, [categories, deviceTypes, initialCategoryId, initialTypeId]);

  useEffect(() => {
    if (selectedDeviceType) {
      loadDevices(selectedDeviceType.id);
    }
  }, [selectedDeviceType]);

  // Realtime 구독으로 기기 상태 변경 감지 (최적화된 버전)
  useEffect(() => {
    // 기기 뷰에서만 Realtime 활성화
    if (view !== 'devices' || !selectedDeviceType) {
      return;
    }

    let retryCount = 0;
    const maxRetries = 3;
    let timeoutId: NodeJS.Timeout;

    const createChannel = () => {
      const channel = supabase
        .channel(`devices-status-${selectedDeviceType.id}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'devices',
            filter: `device_type_id=eq.${selectedDeviceType.id}`
          },
          (payload) => {
            if (payload.new && typeof payload.new === 'object' && 'id' in payload.new) {
              setDevices(prev => prev.map(device => 
                device.id === payload.new.id 
                  ? { ...device, ...payload.new as Device }
                  : device
              ));
            }
          }
        )
        .subscribe((status, err) => {
          if (status === 'CLOSED' && retryCount < maxRetries) {
            retryCount++;
            timeoutId = setTimeout(() => {
              createChannel();
            }, Math.pow(2, retryCount) * 1000); // 지수 백오프: 2초, 4초, 8초
          }
        });

      return channel;
    };

    const channel = createChannel();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      supabase.removeChannel(channel);
    };
  }, [view, selectedDeviceType, supabase]);

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
    if (draggedItem) {
      updatedCategories.splice(dropIndex, 0, draggedItem);
    }

    updatedCategories.forEach((category, idx) => {
      category.display_order = idx + 1;
    });

    setCategories(updatedCategories);
    setDraggedCategoryIndex(null);
    setDragOverCategoryIndex(null);

    try {
      const response = await fetch('/api/admin/devices/categories', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categories: updatedCategories.map(cat => ({
            id: cat.id,
            display_order: cat.display_order
          }))
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update category order');
      }
      
      console.log('카테고리 순서 업데이트 성공');
    } catch (error: any) {
      console.error('Error updating category order:', error);
      alert('카테고리 순서 변경 실패: ' + error.message);
      // 실패 시 원래 순서로 복구
      loadCategories();
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

    // categoryTypes는 이제 useMemo로 최적화된 값 사용
    const updatedTypes = [...categoryTypes];
    const [draggedItem] = updatedTypes.splice(draggedTypeIndex, 1);
    
    // draggedItem이 undefined가 아닌 경우에만 처리
    if (draggedItem) {
      updatedTypes.splice(dropIndex, 0, draggedItem);

      updatedTypes.forEach((type, idx) => {
        type.display_order = idx + 1;
      });
    }

    const allUpdatedTypes = deviceTypes.map(t => {
      const updated = updatedTypes.find(ut => ut.id === t.id);
      return updated || t;
    });

    setDeviceTypes(allUpdatedTypes);
    setDraggedTypeIndex(null);
    setDragOverTypeIndex(null);

    try {
      // 모든 업데이트를 병렬로 처리
      const updatePromises = updatedTypes.map(type => 
        fetch('/api/admin/devices/types', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: type.id,
            display_order: type.display_order
          })
        })
      );
      
      const responses = await Promise.all(updatePromises);
      const hasError = responses.some(r => !r.ok);
      
      if (hasError) {
        throw new Error('Failed to update some device types');
      }
      
      console.log('기종 순서 업데이트 성공');
    } catch (error: any) {
      console.error('Error updating type order:', error);
      alert('기종 순서 변경 실패: ' + error.message);
      // 실패 시 원래 순서로 복구
      loadDeviceTypes();
    }
  };

  // 카테고리 뷰
  if (view === 'categories') {
    return (
      <div className="px-4 sm:px-6 py-6 max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent mb-2">기기 관리</h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
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
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: index * 0.02 }}
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
                            const temp = updatedCategories[index];
                            const prev = updatedCategories[index - 1];
                            if (temp && prev) {
                              updatedCategories[index] = prev;
                              updatedCategories[index - 1] = temp;
                              
                              updatedCategories.forEach((c, idx) => {
                                c.display_order = idx + 1;
                              });
                            }
                            
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
                            const temp = updatedCategories[index];
                            const next = updatedCategories[index + 1];
                            if (temp && next) {
                              updatedCategories[index] = next;
                              updatedCategories[index + 1] = temp;
                              
                              updatedCategories.forEach((c, idx) => {
                                c.display_order = idx + 1;
                              });
                            }
                            
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
    // categoryTypes는 이제 useMemo로 최적화됨

    return (
      <div className="px-4 sm:px-6 py-6 max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-2">
            <button
              onClick={navigateBack}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            </button>
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent">{selectedCategory.name} 기종 관리</h1>
          </div>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 ml-11">
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
                onSubmit={async (data) => {
                  try {
                    // 기종 생성
                    const response = await fetch('/api/admin/device-types', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        name: data.name,
                        description: data.description,
                        model_name: data.model_name,
                        version_name: data.version_name,
                        category_id: selectedCategory.id,
                        is_rentable: data.is_rentable,
                        device_count: 0  // 기본값 0, 필요시 나중에 개별 기기 추가
                      })
                    });
                    
                    if (!response.ok) throw new Error('Failed to create device type');
                    const newType = await response.json();
                    
                    // play_modes 추가
                    if (data.play_modes && data.play_modes.length > 0) {
                      const playModesResponse = await fetch(`/api/admin/devices/types/${newType.id}/play-modes`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          play_modes: data.play_modes
                        })
                      });
                      
                      if (!playModesResponse.ok) {
                        console.error('Play modes 추가 실패');
                      }
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
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: index * 0.02 }}
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
                      console.log('기종 업데이트 데이터:', data);
                      
                      // 기종 정보 업데이트
                      const response = await fetch(`/api/admin/device-types/${type.id}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          name: data.name,
                          description: data.description,
                          model_name: data.model_name || null,
                          version_name: data.version_name || null,
                          is_rentable: data.is_rentable
                        })
                      });
                      
                      if (!response.ok) {
                        const error = await response.json();
                        console.error('API 응답 오류:', error);
                        throw new Error(error.error || '기종 업데이트 실패');
                      }
                      
                      const result = await response.json();
                      console.log('기종 업데이트 결과:', result);
                      
                      // play_modes 업데이트
                      console.log('Play modes 업데이트 시도:', data.play_modes);
                      if (data.play_modes && data.play_modes.length > 0) {
                        const playModesResponse = await fetch(`/api/admin/devices/types/${type.id}/play-modes`, {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            play_modes: data.play_modes
                          })
                        });
                        
                        const playModesResult = await playModesResponse.json();
                        
                        if (!playModesResponse.ok) {
                          console.error('Play modes 업데이트 오류:', playModesResult);
                          throw new Error(playModesResult.error || '플레이 모드 업데이트 실패');
                        }
                        
                        console.log('Play modes 업데이트 결과:', playModesResult);
                      } else {
                        // play_modes가 비어있으면 모든 모드 삭제
                        console.log('Play modes 삭제 (빈 배열)');
                        const playModesResponse = await fetch(`/api/admin/devices/types/${type.id}/play-modes`, {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            play_modes: []
                          })
                        });
                        
                        if (!playModesResponse.ok) {
                          console.error('Play modes 삭제 실패');
                        }
                      }
                      
                      // 데이터 다시 로드
                      await loadDeviceTypes();
                      setEditingType(null);
                    } catch (error: any) {
                      console.error('Error updating device type:', error);
                      alert(`기종 수정에 실패했습니다: ${error.message}`);
                    }
                  }}
                  onCancel={() => setEditingType(null)}
                />
              ) : (
                <>
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-lg font-semibold dark:text-white">{type.name}</h3>
                        {type.model_name && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                            {type.model_name}
                          </span>
                        )}
                      </div>
                      {type.version_name && (
                        <div className="flex flex-wrap gap-2 mt-1">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                            버전: {type.version_name}
                          </span>
                        </div>
                      )}
                      {type.description && (
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">{type.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex md:hidden flex-col gap-1">
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            if (index === 0) return;
                            
                            const updatedTypes = [...categoryTypes];
                            const temp = updatedTypes[index];
                            const prev = updatedTypes[index - 1];
                            if (temp && prev) {
                              updatedTypes[index] = prev;
                              updatedTypes[index - 1] = temp;
                              
                              updatedTypes.forEach((t, idx) => {
                                t.display_order = idx + 1;
                              });
                            }
                            
                            const allUpdatedTypes = deviceTypes.map(t => {
                              const updated = updatedTypes.find(ut => ut.id === t.id);
                              return updated || t;
                            });
                            
                            setDeviceTypes(allUpdatedTypes);
                            
                            try {
                              const updatePromises = updatedTypes.map(type => 
                                fetch('/api/admin/devices/types', {
                                  method: 'PATCH',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({
                                    id: type.id,
                                    display_order: type.display_order
                                  })
                                })
                              );
                              
                              const responses = await Promise.all(updatePromises);
                              const hasError = responses.some(r => !r.ok);
                              
                              if (hasError) {
                                throw new Error('Failed to update some device types');
                              }
                            } catch (error: any) {
                              console.error('Error updating order:', error);
                              alert('기종 순서 변경 실패: ' + error.message);
                              loadDeviceTypes();
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
                            const temp = updatedTypes[index];
                            const next = updatedTypes[index + 1];
                            if (temp && next) {
                              updatedTypes[index] = next;
                              updatedTypes[index + 1] = temp;
                              
                              updatedTypes.forEach((t, idx) => {
                                t.display_order = idx + 1;
                              });
                            }
                            
                            const allUpdatedTypes = deviceTypes.map(t => {
                              const updated = updatedTypes.find(ut => ut.id === t.id);
                              return updated || t;
                            });
                            
                            setDeviceTypes(allUpdatedTypes);
                            
                            try {
                              const updatePromises = updatedTypes.map(type => 
                                fetch('/api/admin/devices/types', {
                                  method: 'PATCH',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({
                                    id: type.id,
                                    display_order: type.display_order
                                  })
                                })
                              );
                              
                              const responses = await Promise.all(updatePromises);
                              const hasError = responses.some(r => !r.ok);
                              
                              if (hasError) {
                                throw new Error('Failed to update some device types');
                              }
                            } catch (error: any) {
                              console.error('Error updating order:', error);
                              alert('기종 순서 변경 실패: ' + error.message);
                              loadDeviceTypes();
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
      <div className="px-4 sm:px-6 py-6 max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-2">
            <button
              onClick={navigateBack}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            </button>
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent">{selectedDeviceType.name} 개별 기기 관리</h1>
          </div>
          <div className="ml-11">
            {selectedDeviceType.model_name && (
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">모델: {selectedDeviceType.model_name}</p>
            )}
            {selectedDeviceType.version_name && (
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">버전: {selectedDeviceType.version_name}</p>
            )}
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
              개별 기기의 상태를 관리합니다
            </p>
          </div>
        </div>

        {/* 도움말 */}
        <div className="mb-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800 dark:text-blue-200">
              <p className="font-medium mb-1">개별 기기 관리 안내</p>
              <ul className="space-y-1 text-blue-700 dark:text-blue-300">
                <li>• 각 기기의 상태를 변경하면 즉시 반영됩니다</li>
                <li>• 기기 상태: 사용 가능, 대여중, 점검 중, 사용 불가</li>
                <li>• 편집 버튼을 클릭하여 기기별 메모를 입력할 수 있습니다</li>
              </ul>
            </div>
          </div>
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
                  <span className="text-sm text-blue-600 dark:text-blue-400">대여 중</span>
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
                    {devices.filter(d => d.status === 'broken').length}
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
                    const response = await fetch(`/api/admin/devices/${device.id}`, {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ status })
                    });
                    
                    if (!response.ok) {
                      const error = await response.json();
                      throw new Error(error.error || 'Failed to update device status');
                    }
                    
                    const updatedDevice = await response.json();
                    
                    // 로컬 상태 즉시 업데이트
                    setDevices(prevDevices => 
                      prevDevices.map(d => 
                        d.id === device.id ? { ...d, ...updatedDevice } : d
                      )
                    );
                    
                    // 기종별 기기 수 업데이트를 위해 다시 로드
                    loadDeviceTypes();
                  } catch (error: any) {
                    console.error('Error updating device status:', error);
                    alert('기기 상태 변경 실패: ' + error.message);
                    // 실패 시 원래 상태로 복구
                    setDevices(prevDevices => 
                      prevDevices.map(d => 
                        d.id === device.id ? { ...d, status: device.status } : d
                      )
                    );
                  }
                }}
                onEdit={() => setEditingDevice(device.id)}
                onSave={async (updates) => {
                  try {
                    const response = await fetch(`/api/admin/devices/${device.id}`, {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(updates)
                    });
                    
                    if (!response.ok) {
                      const error = await response.json();
                      throw new Error(error.error || 'Failed to update device');
                    }
                    
                    const updatedDevice = await response.json();
                    
                    setDevices(prevDevices => 
                      prevDevices.map(d => 
                        d.id === device.id ? { ...d, ...updatedDevice } : d
                      )
                    );
                    setEditingDevice(null);
                  } catch (error: any) {
                    console.error('Error updating device:', error);
                    alert('기기 정보 저장 실패: ' + error.message);
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
