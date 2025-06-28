// 대여 이용안내 관리 페이지
'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  // X, 
  ChevronLeft,
  AlertCircle,
  Eye,
  EyeOff,
  GripVertical
} from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase';
import { getKSTNow } from '@/lib/utils/date';

type ReservationRule = {
  id: string;
  content: string;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
};

export default function ReservationRulesPage() {
  const [rules, setRules] = useState<ReservationRule[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingRule, setEditingRule] = useState<string | null>(null);
  const [isAddingRule, setIsAddingRule] = useState(false);
  const [supabase] = useState(() => createClient());

  // 새 규칙 폼 상태
  const [newRule, setNewRule] = useState({
    content: ''
  });

  // 편집 중인 규칙 상태
  const [editForm, setEditForm] = useState({
    content: ''
  });

  // 규칙 목록 불러오기
  const loadRules = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('reservation_rules')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) {
        // 테이블이 없으면 생성
        if (error.code === '42P01') {
          console.log('테이블이 없습니다. 생성 중...');
          await createTableAndSeedData();
          return;
        }
        throw error;
      }

      setRules(data || []);
    } catch (error) {
      console.error('규칙 불러오기 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 테이블 생성 및 초기 데이터
  const createTableAndSeedData = async () => {
    try {
      // 테이블 생성은 API를 통해 수행
      const response = await fetch('/api/admin/reservation-rules/setup', {
        method: 'POST'
      });

      if (response.ok) {
        // 다시 불러오기
        await loadRules();
      }
    } catch (error) {
      console.error('테이블 생성 실패:', error);
    }
  };

  useEffect(() => {
    loadRules();
  }, []);

  // 규칙 추가
  const handleAddRule = async () => {
    if (!newRule.content) {
      alert('내용을 입력해주세요.');
      return;
    }

    try {
      setIsLoading(true);
      
      // 현재 최대 display_order 찾기
      const maxOrder = Math.max(...rules.map(r => r.display_order), 0);
      
      const { error } = await supabase
        .from('reservation_rules')
        .insert({
          content: newRule.content,
          display_order: maxOrder + 1
        });

      if (error) throw error;

      // 성공 후 다시 불러오기
      await loadRules();
      setIsAddingRule(false);
      setNewRule({ content: '' });
    } catch (error) {
      console.error('규칙 추가 실패:', error);
      alert('규칙 추가에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 규칙 수정
  const handleUpdateRule = async (id: string) => {
    if (!editForm.content) {
      alert('내용을 입력해주세요.');
      return;
    }

    try {
      setIsLoading(true);
      
      const { error } = await supabase
        .from('reservation_rules')
        .update({
          content: editForm.content,
          updated_at: getKSTNow()
        })
        .eq('id', id);

      if (error) throw error;

      // 성공 후 다시 불러오기
      await loadRules();
      setEditingRule(null);
    } catch (error) {
      console.error('규칙 수정 실패:', error);
      alert('규칙 수정에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 규칙 삭제
  const handleDeleteRule = async (id: string) => {
    if (!confirm('이 규칙을 삭제하시겠습니까?')) return;

    try {
      const { error } = await supabase
        .from('reservation_rules')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // 성공 후 목록 업데이트
      setRules(rules.filter(rule => rule.id !== id));
    } catch (error) {
      console.error('규칙 삭제 실패:', error);
      alert('규칙 삭제에 실패했습니다.');
    }
  };

  // 활성화/비활성화 토글
  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('reservation_rules')
        .update({
          is_active: !currentStatus,
          updated_at: getKSTNow()
        })
        .eq('id', id);

      if (error) throw error;

      // 성공 후 목록 업데이트
      setRules(rules.map(rule => 
        rule.id === id ? { ...rule, is_active: !currentStatus } : rule
      ));
    } catch (error) {
      console.error('상태 변경 실패:', error);
      alert('상태 변경에 실패했습니다.');
    }
  };

  // 순서 변경
  const handleReorder = async (newOrder: ReservationRule[]) => {
    setRules(newOrder);

    // DB 업데이트
    try {
      for (let i = 0; i < newOrder.length; i++) {
        await supabase
          .from('reservation_rules')
          .update({ display_order: i })
          .eq('id', newOrder[i]?.id || '');
      }
    } catch (error) {
      console.error('순서 변경 실패:', error);
      // 실패 시 다시 불러오기
      await loadRules();
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-2">
          <Link
            href="/admin/content"
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          </Link>
          <h1 className="text-2xl font-bold dark:text-white">대여 이용안내 관리</h1>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 ml-11">
          예약 시 사용자에게 보여줄 이용 안내사항을 관리합니다
        </p>
      </div>

      {/* 규칙 목록 */}
      <Reorder.Group
        axis="y"
        values={rules}
        onReorder={handleReorder}
        className="space-y-4 mb-6"
      >
        <AnimatePresence>
          {rules.map((rule) => (
            <Reorder.Item
              key={rule.id}
              value={rule}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6"
            >
              {editingRule === rule.id ? (
                // 편집 모드
                <div className="space-y-4">
                  <textarea
                    value={editForm.content}
                    onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    rows={2}
                    placeholder="확인사항 내용"
                  />
                  <div className="flex gap-3 justify-end">
                    <button
                      onClick={() => setEditingRule(null)}
                      className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      취소
                    </button>
                    <button
                      onClick={() => handleUpdateRule(rule.id)}
                      disabled={isLoading}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
                    >
                      <Save className="w-4 h-4" />
                      저장
                    </button>
                  </div>
                </div>
              ) : (
                // 보기 모드
                <div className="flex items-start gap-4">
                  <div className="cursor-move p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                    <GripVertical className="w-5 h-5 text-gray-400" />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <p className="text-gray-700 dark:text-gray-300">
                        • {rule.content}
                      </p>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        rule.is_active
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                      }`}>
                        {rule.is_active ? '활성' : '비활성'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleActive(rule.id, rule.is_active)}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                      title={rule.is_active ? '비활성화' : '활성화'}
                    >
                      {rule.is_active ? (
                        <Eye className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      ) : (
                        <EyeOff className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setEditingRule(rule.id);
                        setEditForm({ content: rule.content });
                      }}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      <Edit className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    </button>
                    <button
                      onClick={() => handleDeleteRule(rule.id)}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                    </button>
                  </div>
                </div>
              )}
            </Reorder.Item>
          ))}
        </AnimatePresence>
      </Reorder.Group>

      {/* 규칙 추가 */}
      {!isAddingRule ? (
        <button
          onClick={() => setIsAddingRule(true)}
          className="w-full py-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl hover:border-gray-400 dark:hover:border-gray-500 transition-colors flex items-center justify-center gap-2 text-gray-600 dark:text-gray-400"
        >
          <Plus className="w-5 h-5" />
          <span>새 안내사항 추가</span>
        </button>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6"
        >
          <h3 className="text-lg font-semibold dark:text-white mb-4">새 안내사항 추가</h3>
          
          <div className="space-y-4">
            <textarea
              value={newRule.content}
              onChange={(e) => setNewRule({ ...newRule, content: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              rows={2}
              placeholder="안내사항 (예: 예약한 시간에 맞춰 방문해주세요. 10분 이상 늦을 경우 예약이 자동 취소될 수 있습니다.)"
            />
          </div>

          <div className="flex gap-3 mt-6 justify-end">
            <button
              onClick={() => {
                setIsAddingRule(false);
                setNewRule({ content: '' });
              }}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              취소
            </button>
            <button
              onClick={handleAddRule}
              disabled={isLoading || !newRule.content}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              추가하기
            </button>
          </div>
        </motion.div>
      )}

      {/* 안내 메시지 */}
      <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-1">
              이용 안내 관리
            </h4>
            <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
              <li>• 활성화된 안내사항만 예약 페이지에 표시됩니다</li>
              <li>• 드래그하여 표시 순서를 변경할 수 있습니다</li>
              <li>• 사용자가 예약 시 이용 안내를 확인할 수 있습니다</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}