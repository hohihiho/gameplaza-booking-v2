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
            <Link
              href="/admin"
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            </Link>
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
                  setView('types');
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
              onClick={() => {
                setView('categories');
                setSelectedCategory(null);
              }}
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
              <form onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                
                try {
                  await fetch('/api/admin/devices/types', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      name: formData.get('name'),
                      description: formData.get('description'),
                      category_id: selectedCategory.id,
                      display_order: categoryTypes.length + 1,
                      is_rentable: formData.get('is_rentable') === 'true'
                    })
                  });
                  
                  loadDeviceTypes();
                  setIsAddingType(false);
                } catch (error) {
                  console.error('Error creating device type:', error);
                }
              }}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <input
                    name="name"
                    type="text"
                    placeholder="기종 이름"
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                    autoFocus
                  />
                  <input
                    name="description"
                    type="text"
                    placeholder="설명 (선택사항)"
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="flex items-center gap-4 mb-4">
                  <label className="flex items-center gap-2">
                    <input
                      name="is_rentable"
                      type="checkbox"
                      value="true"
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">대여 가능</span>
                  </label>
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    추가
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAddingType(false)}
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg transition-colors"
                  >
                    취소
                  </button>
                </div>
              </form>
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
                  setView('devices');
                }
              }}
            >
              {editingType === type.id ? (
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  
                  try {
                    await fetch('/api/admin/devices/types', {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        id: type.id,
                        name: formData.get('name'),
                        description: formData.get('description'),
                        is_rentable: formData.get('is_rentable') === 'true'
                      })
                    });
                    
                    loadDeviceTypes();
                    setEditingType(null);
                  } catch (error) {
                    console.error('Error updating device type:', error);
                  }
                }}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <input
                      name="name"
                      type="text"
                      defaultValue={type.name}
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                    <input
                      name="description"
                      type="text"
                      defaultValue={type.description}
                      placeholder="설명 (선택사항)"
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div className="flex items-center gap-4 mb-4">
                    <label className="flex items-center gap-2">
                      <input
                        name="is_rentable"
                        type="checkbox"
                        value="true"
                        defaultChecked={type.is_rentable}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                      />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">대여 가능</span>
                    </label>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      저장
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingType(null)}
                      className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg transition-colors"
                    >
                      취소
                    </button>
                  </div>
                </form>
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
              onClick={() => {
                setView('types');
                setSelectedDeviceType(null);
              }}
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