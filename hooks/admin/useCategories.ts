// 카테고리 관리 커스텀 훅
import { useState, useCallback } from 'react';
import { createAdminClient } from '@/lib/db';
import type { Category, CategoryFormData, UseCategoriesResult, ApiResponse } from '@/types/admin/devices';

const initialFormData: CategoryFormData = {
  name: ''
};

export function useCategories(): UseCategoriesResult {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<CategoryFormData>(initialFormData);
  const [draggedItem, setDraggedItem] = useState<Category | null>(null);

  const supabaseAdmin = createAdminClient();

  const loadCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabaseAdmin
        .from('device_categories')
        .select('*')
        .order('display_order', { ascending: true });

      if (fetchError) throw fetchError;

      setCategories(data || []);
    } catch (err) {
      console.error('카테고리 로드 실패:', err);
      setError(err instanceof Error ? err.message : '카테고리를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  const startEdit = useCallback((category: Category) => {
    setEditingId(category.id);
    setFormData({
      name: category.name
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
    setFormData(initialFormData);
    setShowForm(true);
  }, []);

  const updateFormData = useCallback((updates: Partial<CategoryFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  }, []);

  const saveCategory = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (!formData.name.trim()) {
        throw new Error('카테고리 이름을 입력해주세요.');
      }

      if (editingId) {
        // 수정
        const { data, error: updateError } = await supabaseAdmin
          .from('device_categories')
          .update({ name: formData.name.trim() })
          .eq('id', editingId)
          .select()
          .single();

        if (updateError) throw updateError;

        setCategories(prev =>
          prev.map(cat => cat.id === editingId ? { ...cat, ...data } : cat)
        );
      } else {
        // 새로 생성
        const nextDisplayOrder = Math.max(...categories.map(c => c.display_order || 0), 0) + 1;

        const { data, error: insertError } = await supabaseAdmin
          .from('device_categories')
          .insert({
            name: formData.name.trim(),
            display_order: nextDisplayOrder
          })
          .select()
          .single();

        if (insertError) throw insertError;

        setCategories(prev => [...prev, data]);
      }

      cancelEdit();
    } catch (err) {
      console.error('카테고리 저장 실패:', err);
      setError(err instanceof Error ? err.message : '카테고리 저장 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, [editingId, formData, categories, cancelEdit]);

  const deleteCategory = useCallback(async (id: string) => {
    if (!confirm('이 카테고리를 삭제하시겠습니까? 관련된 기기 타입도 함께 삭제됩니다.')) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { error: deleteError } = await supabaseAdmin
        .from('device_categories')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      setCategories(prev => prev.filter(cat => cat.id !== id));
    } catch (err) {
      console.error('카테고리 삭제 실패:', err);
      setError(err instanceof Error ? err.message : '카테고리 삭제 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  const reorderCategories = useCallback(async (startIndex: number, endIndex: number) => {
    try {
      const reorderedCategories = [...categories];
      const [movedItem] = reorderedCategories.splice(startIndex, 1);
      reorderedCategories.splice(endIndex, 0, movedItem);

      // 화면에 즉시 반영
      setCategories(reorderedCategories);

      // 서버에 순서 업데이트
      const updates = reorderedCategories.map((category, index) => ({
        id: category.id,
        display_order: index + 1
      }));

      for (const update of updates) {
        await supabaseAdmin
          .from('device_categories')
          .update({ display_order: update.display_order })
          .eq('id', update.id);
      }
    } catch (err) {
      console.error('카테고리 순서 변경 실패:', err);
      setError('카테고리 순서 변경 중 오류가 발생했습니다.');
      // 오류 시 다시 로드
      loadCategories();
    }
  }, [categories, loadCategories]);

  const handleDragStart = useCallback((category: Category) => {
    setDraggedItem(category);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggedItem(null);
  }, []);

  return {
    categories,
    loading,
    error,
    editingId,
    showForm,
    formData,
    draggedItem,
    loadCategories,
    startEdit,
    cancelEdit,
    showCreateForm,
    updateFormData,
    saveCategory,
    deleteCategory,
    reorderCategories,
    handleDragStart,
    handleDragEnd
  };
}