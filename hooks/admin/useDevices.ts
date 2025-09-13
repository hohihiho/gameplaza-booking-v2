// 개별 기기 관리 커스텀 훅
import { useState, useCallback, useMemo } from 'react';
import { createAdminClient } from '@/lib/db';
import type {
  Device,
  DeviceType,
  DeviceFormData,
  UseDevicesResult
} from '@/types/admin/devices';

const initialFormData: DeviceFormData = {
  device_type_id: '',
  device_number: 1,
  name: '',
  status: 'available',
  notes: ''
};

export function useDevices(): UseDevicesResult {
  const [devices, setDevices] = useState<Device[]>([]);
  const [deviceTypes, setDeviceTypes] = useState<DeviceType[]>([]);
  const [selectedTypeId, setSelectedTypeId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<DeviceFormData>(initialFormData);

  const supabaseAdmin = createAdminClient();

  // 필터링된 기기 목록
  const filteredDevices = useMemo(() => {
    if (!selectedTypeId) return devices;
    return devices.filter(device => device.device_type_id === selectedTypeId);
  }, [devices, selectedTypeId]);

  const loadDevices = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // 기기 타입과 개별 기기를 병렬로 로드
      const [typesResponse, devicesResponse] = await Promise.all([
        fetch('/api/admin/devices/types?no-cache=true').then(res => res.json()),
        supabaseAdmin
          .from('devices')
          .select('*')
          .order('device_number', { ascending: true })
      ]);

      if (devicesResponse.error) throw devicesResponse.error;

      setDeviceTypes(typesResponse || []);
      setDevices(devicesResponse.data || []);
    } catch (err) {
      console.error('기기 로드 실패:', err);
      setError(err instanceof Error ? err.message : '기기 데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  const selectDeviceType = useCallback((typeId: string | null) => {
    setSelectedTypeId(typeId);
  }, []);

  const startEdit = useCallback((device: Device) => {
    setEditingId(device.id);
    setFormData({
      device_type_id: device.device_type_id,
      device_number: device.device_number,
      name: device.name,
      status: device.status,
      notes: device.notes || ''
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

    // 선택된 기기 타입이 있으면 해당 타입에서 다음 기기 번호 자동 설정
    let nextDeviceNumber = 1;
    if (selectedTypeId) {
      const typeDevices = devices.filter(device => device.device_type_id === selectedTypeId);
      const maxNumber = Math.max(...typeDevices.map(d => d.device_number), 0);
      nextDeviceNumber = maxNumber + 1;
    }

    setFormData({
      ...initialFormData,
      device_type_id: selectedTypeId || '',
      device_number: nextDeviceNumber
    });
    setShowForm(true);
  }, [selectedTypeId, devices]);

  const updateFormData = useCallback((updates: Partial<DeviceFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  }, []);

  const saveDevice = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (!formData.name.trim()) {
        throw new Error('기기 이름을 입력해주세요.');
      }

      if (!formData.device_type_id) {
        throw new Error('기기 타입을 선택해주세요.');
      }

      if (formData.device_number <= 0) {
        throw new Error('기기 번호는 1 이상이어야 합니다.');
      }

      // 동일한 타입에서 기기 번호 중복 확인
      if (!editingId) {
        const duplicateDevice = devices.find(device =>
          device.device_type_id === formData.device_type_id &&
          device.device_number === formData.device_number
        );

        if (duplicateDevice) {
          throw new Error('이미 존재하는 기기 번호입니다.');
        }
      }

      const payload = {
        device_type_id: formData.device_type_id,
        device_number: formData.device_number,
        name: formData.name.trim(),
        status: formData.status,
        notes: formData.notes?.trim() || null
      };

      if (editingId) {
        // 수정
        const { data, error: updateError } = await supabaseAdmin
          .from('devices')
          .update(payload)
          .eq('id', editingId)
          .select()
          .single();

        if (updateError) throw updateError;

        setDevices(prev =>
          prev.map(device => device.id === editingId ? { ...device, ...data } : device)
        );
      } else {
        // 새로 생성
        const { data, error: insertError } = await supabaseAdmin
          .from('devices')
          .insert(payload)
          .select()
          .single();

        if (insertError) throw insertError;

        setDevices(prev => [...prev, data]);
      }

      cancelEdit();
    } catch (err) {
      console.error('기기 저장 실패:', err);
      setError(err instanceof Error ? err.message : '기기 저장 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, [editingId, formData, devices, cancelEdit]);

  const deleteDevice = useCallback(async (id: string) => {
    if (!confirm('이 기기를 삭제하시겠습니까?')) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { error: deleteError } = await supabaseAdmin
        .from('devices')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      setDevices(prev => prev.filter(device => device.id !== id));
    } catch (err) {
      console.error('기기 삭제 실패:', err);
      setError(err instanceof Error ? err.message : '기기 삭제 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  const updateDeviceStatus = useCallback(async (id: string, status: Device['status']) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: updateError } = await supabaseAdmin
        .from('devices')
        .update({ status })
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;

      setDevices(prev =>
        prev.map(device => device.id === id ? { ...device, status } : device)
      );
    } catch (err) {
      console.error('기기 상태 변경 실패:', err);
      setError(err instanceof Error ? err.message : '기기 상태 변경 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    devices,
    filteredDevices,
    deviceTypes,
    selectedTypeId,
    loading,
    error,
    editingId,
    showForm,
    formData,
    loadDevices,
    selectDeviceType,
    startEdit,
    cancelEdit,
    showCreateForm,
    updateFormData,
    saveDevice,
    deleteDevice,
    updateDeviceStatus
  };
}