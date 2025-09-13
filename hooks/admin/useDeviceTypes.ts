// 기기 타입 관리 커스텀 훅
import { useState, useCallback, useEffect, useMemo } from 'react';
import { createAdminClient } from '@/lib/db';
import type {
  DeviceType,
  Category,
  DeviceTypeFormData,
  PlayMode,
  UseDeviceTypesResult
} from '@/types/admin/devices';

const initialFormData: DeviceTypeFormData = {
  category_id: '',
  name: '',
  description: '',
  model_name: '',
  version_name: '',
  device_count: 1,
  is_rentable: true,
  play_modes: [{ name: '기본', price: 0 }],
  rental_settings: {
    max_rental_hours: 4,
    min_rental_minutes: 30,
    pricing_type: 'hourly',
    base_price: 0
  }
};

export function useDeviceTypes(): UseDeviceTypesResult {
  const [deviceTypes, setDeviceTypes] = useState<DeviceType[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<DeviceTypeFormData>(initialFormData);
  const [draggedItem, setDraggedItem] = useState<DeviceType | null>(null);

  const supabaseAdmin = createAdminClient();

  // 필터링된 기기 타입 목록
  const filteredTypes = useMemo(() => {
    if (!selectedCategoryId) return deviceTypes;
    return deviceTypes.filter(type => type.category_id === selectedCategoryId);
  }, [deviceTypes, selectedCategoryId]);

  const loadDeviceTypes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // 카테고리와 기기 타입을 병렬로 로드
      const [categoriesResponse, typesResponse] = await Promise.all([
        supabaseAdmin
          .from('device_categories')
          .select('*')
          .order('display_order', { ascending: true }),

        fetch('/api/admin/devices/types?no-cache=true').then(res => res.json())
      ]);

      if (categoriesResponse.error) throw categoriesResponse.error;

      setCategories(categoriesResponse.data || []);
      setDeviceTypes(typesResponse || []);
    } catch (err) {
      console.error('기기 타입 로드 실패:', err);
      setError(err instanceof Error ? err.message : '데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  const selectCategory = useCallback((categoryId: string | null) => {
    setSelectedCategoryId(categoryId);
  }, []);

  const startEdit = useCallback((deviceType: DeviceType) => {
    setEditingId(deviceType.id);
    setFormData({
      category_id: deviceType.category_id,
      name: deviceType.name,
      description: deviceType.description || '',
      model_name: deviceType.model_name || '',
      version_name: deviceType.version_name || '',
      device_count: deviceType.device_count || 1,
      is_rentable: deviceType.is_rentable,
      play_modes: deviceType.play_modes.length > 0 ? deviceType.play_modes : [{ name: '기본', price: 0 }],
      rental_settings: deviceType.rental_settings || initialFormData.rental_settings
    });
    setShowForm(true);
  }, []);

  const cancelEdit = useCallback(() => {
    setEditingId(null);
    setShowForm(false);
    setFormData(initialFormData);
    setError(null);
  }, []);

  const showCreateForm = useCallback(() => {
    setEditingId(null);
    setFormData({
      ...initialFormData,
      category_id: selectedCategoryId || ''
    });
    setShowForm(true);
  }, [selectedCategoryId]);

  const updateFormData = useCallback((updates: Partial<DeviceTypeFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  }, []);

  const saveDeviceType = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (!formData.name.trim()) {
        throw new Error('기기 타입 이름을 입력해주세요.');
      }

      if (!formData.category_id) {
        throw new Error('카테고리를 선택해주세요.');
      }

      const payload = {
        category_id: formData.category_id,
        name: formData.name.trim(),
        description: formData.description?.trim() || null,
        model_name: formData.model_name?.trim() || null,
        version_name: formData.version_name?.trim() || null,
        is_rentable: formData.is_rentable,
        play_modes: formData.play_modes.filter(pm => pm.name.trim()),
        rental_settings: formData.rental_settings
      };

      if (editingId) {
        // 수정
        const response = await fetch('/api/admin/devices/types', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingId, ...payload })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || '기기 타입 수정에 실패했습니다.');
        }

        const updatedType = await response.json();
        setDeviceTypes(prev =>
          prev.map(type => type.id === editingId ? { ...type, ...updatedType } : type)
        );
      } else {
        // 새로 생성
        const response = await fetch('/api/admin/devices/types', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...payload, device_count: formData.device_count })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || '기기 타입 생성에 실패했습니다.');
        }

        const newType = await response.json();
        setDeviceTypes(prev => [...prev, newType]);
      }

      cancelEdit();
    } catch (err) {
      console.error('기기 타입 저장 실패:', err);
      setError(err instanceof Error ? err.message : '기기 타입 저장 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, [editingId, formData, cancelEdit]);

  const deleteDeviceType = useCallback(async (id: string) => {
    if (!confirm('이 기기 타입을 삭제하시겠습니까? 관련된 개별 기기도 함께 삭제됩니다.')) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/admin/devices/types/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '기기 타입 삭제에 실패했습니다.');
      }

      setDeviceTypes(prev => prev.filter(type => type.id !== id));
    } catch (err) {
      console.error('기기 타입 삭제 실패:', err);
      setError(err instanceof Error ? err.message : '기기 타입 삭제 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  const toggleRentable = useCallback(async (id: string) => {
    try {
      const deviceType = deviceTypes.find(type => type.id === id);
      if (!deviceType) return;

      const newRentableStatus = !deviceType.is_rentable;

      const response = await fetch('/api/admin/devices/types', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          is_rentable: newRentableStatus
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '대여 가능 상태 변경에 실패했습니다.');
      }

      setDeviceTypes(prev =>
        prev.map(type =>
          type.id === id
            ? { ...type, is_rentable: newRentableStatus }
            : type
        )
      );
    } catch (err) {
      console.error('대여 가능 상태 변경 실패:', err);
      setError(err instanceof Error ? err.message : '대여 가능 상태 변경 중 오류가 발생했습니다.');
    }
  }, [deviceTypes]);

  // 플레이 모드 관리
  const addPlayMode = useCallback(() => {
    setFormData(prev => ({
      ...prev,
      play_modes: [...prev.play_modes, { name: '', price: 0 }]
    }));
  }, []);

  const updatePlayMode = useCallback((index: number, updates: Partial<PlayMode>) => {
    setFormData(prev => ({
      ...prev,
      play_modes: prev.play_modes.map((pm, i) =>
        i === index ? { ...pm, ...updates } : pm
      )
    }));
  }, []);

  const removePlayMode = useCallback((index: number) => {
    setFormData(prev => ({
      ...prev,
      play_modes: prev.play_modes.filter((_, i) => i !== index)
    }));
  }, []);

  const reorderDeviceTypes = useCallback(async (startIndex: number, endIndex: number) => {
    try {
      const typesToReorder = [...filteredTypes];
      const [movedItem] = typesToReorder.splice(startIndex, 1);
      typesToReorder.splice(endIndex, 0, movedItem);

      // 화면에 즉시 반영
      setDeviceTypes(prev => {
        const otherTypes = prev.filter(type => type.category_id !== selectedCategoryId);
        return [...otherTypes, ...typesToReorder];
      });

      // 서버에 순서 업데이트
      const updates = typesToReorder.map((type, index) => ({
        id: type.id,
        display_order: index + 1
      }));

      for (const update of updates) {
        await fetch('/api/admin/devices/types', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: update.id,
            display_order: update.display_order
          })
        });
      }
    } catch (err) {
      console.error('기기 타입 순서 변경 실패:', err);
      setError('기기 타입 순서 변경 중 오류가 발생했습니다.');
      loadDeviceTypes();
    }
  }, [filteredTypes, selectedCategoryId, loadDeviceTypes]);

  const handleDragStart = useCallback((deviceType: DeviceType) => {
    setDraggedItem(deviceType);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggedItem(null);
  }, []);

  return {
    deviceTypes,
    filteredTypes,
    categories,
    selectedCategoryId,
    loading,
    error,
    editingId,
    showForm,
    formData,
    draggedItem,
    loadDeviceTypes,
    selectCategory,
    startEdit,
    cancelEdit,
    showCreateForm,
    updateFormData,
    saveDeviceType,
    deleteDeviceType,
    toggleRentable,
    addPlayMode,
    updatePlayMode,
    removePlayMode,
    reorderDeviceTypes,
    handleDragStart,
    handleDragEnd
  };
}