// 기기 현황 안내 관리 페이지
'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  ChevronLeft,
  AlertCircle,
  Eye,
  EyeOff,
  GripVertical
} from 'lucide-react';
import Link from 'next/link';

type MachineRule = {
  id: string;
  content: string;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
};

export default function MachineRulesPage() {
  const [rules, setRules] = useState<MachineRule[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingRule, setEditingRule] = useState<string | null>(null);
  const [isAddingRule, setIsAddingRule] = useState(false);

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
      const response = await fetch('/api/admin/machine-rules');
      const { rules: data, error } = await response.json();

      if (error) {
        throw new Error(error);
      }

      setRules(data || []);
    } catch (error) {
      console.error('규칙 불러오기 실패:', error);
      // 테이블이 없으면 생성
      await createTableAndSeedData();
    } finally {
      setIsLoading(false);
    }
  };

  // 테이블 생성 및 초기 데이터
  const createTableAndSeedData = async () => {
    try {
      // 먼저 마이그레이션 시도
      const migrateResponse = await fetch('/api/admin/machine-rules/migrate', {
        method: 'POST'
      });

      const migrateResult = await migrateResponse.json();
      
      if (!migrateResponse.ok) {
        console.error('마이그레이션 필요:', migrateResult);
        alert('기기 현황 안내사항 테이블이 없습니다.\n\nSupabase 대시보드에서 다음 파일의 SQL을 실행해주세요:\n/supabase/migrations/20250102_create_machine_rules.sql');
        return;
      }

      // 테이블 생성/초기화는 기존 API 호출
      const response = await fetch('/api/admin/machine-rules/setup', {
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
      
      const response = await fetch('/api/admin/machine-rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newRule.content,
          display_order: maxOrder + 1
        })
      });

      const { error } = await response.json();
      if (error) throw new Error(error);

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
      
      const response = await fetch('/api/admin/machine-rules', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          content: editForm.content
        })
      });

      const result = await response.json();
      console.log('서버 응답:', result);
      
      if (!response.ok || result.error) {
        throw new Error(result.error || '서버 에러');
      }

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
      const response = await fetch(`/api/admin/machine-rules?id=${id}`, {
        method: 'DELETE'
      });

      const { error } = await response.json();
      if (error) throw new Error(error);

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
      const response = await fetch('/api/admin/machine-rules', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          is_active: !currentStatus
        })
      });

      const { error } = await response.json();
      if (error) throw new Error(error);

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
  const handleReorder = async (newOrder: MachineRule[]) => {
    setRules(newOrder);

    // DB 업데이트
    try {
      for (let i = 0; i < newOrder.length; i++) {
        await fetch('/api/admin/machine-rules', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: newOrder[i]?.id,
            display_order: i
          })
        });
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
          <h1 className="text-2xl font-bold dark:text-white">기기 현황 안내 관리</h1>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 ml-11">
          기기 현황 페이지에 보여줄 안내사항을 관리합니다
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
                  <div>
                    <textarea
                      value={editForm.content}
                      onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      rows={3}
                      placeholder="안내사항 내용"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      줄바꿈은 Enter 키를 사용하세요
                    </p>
                  </div>
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
                    <div className="flex items-start gap-3">
                      <span className="text-gray-700 dark:text-gray-300 flex-shrink-0">•</span>
                      <div className="flex-1">
                        <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                          {rule.content}
                        </p>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full flex-shrink-0 ${
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
            <div>
              <textarea
                value={newRule.content}
                onChange={(e) => setNewRule({ ...newRule, content: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                rows={3}
                placeholder="안내사항 (예: 실시간 상태는 약 1분마다 업데이트됩니다)"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                줄바꿈은 Enter 키를 사용하세요
              </p>
            </div>
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
              기기 현황 안내 관리
            </h4>
            <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
              <li>• 활성화된 안내사항만 기기 현황 페이지에 표시됩니다</li>
              <li>• 드래그하여 표시 순서를 변경할 수 있습니다</li>
              <li>• 사용자가 기기 현황을 확인할 때 하단에 표시됩니다</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}