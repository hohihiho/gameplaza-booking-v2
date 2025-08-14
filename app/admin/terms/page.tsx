'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Save, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type TermsType = 'terms_of_service' | 'privacy_policy';

type Terms = {
  id: string;
  type: TermsType;
  title: string;
  content: string;
  version: string;
  effective_date: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
};


export default function AdminTermsPage() {
  const [terms, setTerms] = useState<Terms[]>([]);
  const [selectedType, setSelectedType] = useState<TermsType>('terms_of_service');
  const [isEditing, setIsEditing] = useState(false);
  const [editingTerms, setEditingTerms] = useState<Terms | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 데이터베이스에서 약관 불러오기
  const fetchTerms = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/admin/terms');
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '약관을 불러올 수 없습니다.');
      }

      setTerms(result.data || []);
    } catch (err) {
      console.error('약관 조회 오류:', err);
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTerms();
  }, []);

  // 현재 활성화된 약관 가져오기
  const getActiveTerms = (type: TermsType) => {
    return terms.find(t => t.type === type && t.is_active);
  };

  // 약관 생성/수정
  const handleSave = async () => {
    if (!editingTerms) return;

    try {
      setLoading(true);
      
      if (editingTerms.id) {
        // 수정
        const response = await fetch('/api/admin/terms', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(editingTerms)
        });

        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.error || '약관 수정에 실패했습니다.');
        }
      } else {
        // 신규 생성
        const response = await fetch('/api/admin/terms', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(editingTerms)
        });

        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.error || '약관 생성에 실패했습니다.');
        }
      }

      // 데이터 새로고침
      await fetchTerms();
      setIsEditing(false);
      setEditingTerms(null);
    } catch (err) {
      console.error('약관 저장 오류:', err);
      setError(err instanceof Error ? err.message : '약관 저장 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 약관 삭제
  const handleDelete = async (id: string) => {
    try {
      setLoading(true);
      
      const response = await fetch(`/api/admin/terms?id=${id}`, {
        method: 'DELETE'
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || '약관 삭제에 실패했습니다.');
      }

      await fetchTerms();
      setShowDeleteConfirm(null);
    } catch (err) {
      console.error('약관 삭제 오류:', err);
      setError(err instanceof Error ? err.message : '약관 삭제 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 약관 활성화
  const handleActivate = async (id: string) => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/admin/terms/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || '약관 활성화에 실패했습니다.');
      }

      await fetchTerms();
    } catch (err) {
      console.error('약관 활성화 오류:', err);
      setError(err instanceof Error ? err.message : '약관 활성화 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const termTypeLabels = {
    terms_of_service: '서비스 이용약관',
    privacy_policy: '개인정보 처리방침'
  };

  if (loading && terms.length === 0) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          <span className="ml-3 text-gray-600 dark:text-gray-400">약관을 불러오는 중...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* 헤더 */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold dark:text-white">약관 관리</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          서비스 이용약관과 개인정보 처리방침을 관리합니다.
        </p>
      </div>

      {/* 오류 메시지 */}
      {error && (
        <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-600 dark:text-red-400">{error}</p>
          <button
            onClick={() => {
              setError(null);
              fetchTerms();
            }}
            className="mt-2 text-sm text-red-700 dark:text-red-300 hover:underline"
          >
            다시 시도
          </button>
        </div>
      )}

      {/* 탭 */}
      <div className="flex gap-4 mb-6">
        {Object.entries(termTypeLabels).map(([type, label]) => (
          <button
            key={type}
            onClick={() => setSelectedType(type as TermsType)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedType === type
                ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* 현재 활성 약관 */}
      {!isEditing && (
        <div className="mb-8">
          {(() => {
            const activeTerms = getActiveTerms(selectedType);
            if (!activeTerms) {
              return (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                  <p className="text-yellow-800 dark:text-yellow-200">
                    활성화된 {termTypeLabels[selectedType]}이 없습니다.
                  </p>
                </div>
              );
            }
            
            return (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h2 className="text-xl font-semibold dark:text-white">{activeTerms.title}</h2>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-600 dark:text-gray-400">
                        <span>버전: {activeTerms.version}</span>
                        <span>시행일: {activeTerms.effective_date}</span>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                          활성
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setEditingTerms(activeTerms);
                        setIsEditing(true);
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                      수정
                    </button>
                  </div>
                  
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <pre className="whitespace-pre-wrap text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                      {activeTerms.content}
                    </pre>
                  </div>
                </div>
              </motion.div>
            );
          })()}
        </div>
      )}

      {/* 편집 폼 */}
      {isEditing && editingTerms && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-8"
        >
          <h2 className="text-xl font-semibold dark:text-white mb-6">
            {editingTerms.id ? '약관 수정' : '새 약관 작성'}
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                제목
              </label>
              <input
                type="text"
                value={editingTerms.title}
                onChange={(e) => setEditingTerms({ ...editingTerms, title: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white dark:bg-gray-900 dark:text-white"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  버전
                </label>
                <input
                  type="text"
                  value={editingTerms.version}
                  onChange={(e) => setEditingTerms({ ...editingTerms, version: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white dark:bg-gray-900 dark:text-white"
                  placeholder="예: 1.0"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  시행일
                </label>
                <input
                  type="date"
                  value={editingTerms.effective_date}
                  onChange={(e) => setEditingTerms({ ...editingTerms, effective_date: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white dark:bg-gray-900 dark:text-white"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                내용
              </label>
              <textarea
                value={editingTerms.content}
                onChange={(e) => setEditingTerms({ ...editingTerms, content: e.target.value })}
                rows={20}
                className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white dark:bg-gray-900 dark:text-white font-mono text-sm"
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={() => {
                setIsEditing(false);
                setEditingTerms(null);
              }}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              취소
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
            >
              <Save className="w-4 h-4" />
              저장
            </button>
          </div>
        </motion.div>
      )}

      {/* 버전 목록 */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold dark:text-white">버전 이력</h3>
          <button
            onClick={() => {
              setEditingTerms({
                id: '',
                type: selectedType,
                title: termTypeLabels[selectedType],
                content: '',
                version: '1.0',
                effective_date: new Date().toISOString().split('T')[0] || '',
                created_at: '',
                updated_at: '',
                is_active: true
              });
              setIsEditing(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
          >
            <Plus className="w-4 h-4" />
            새 버전 작성
          </button>
        </div>
        
        <div className="space-y-3">
          {terms
            .filter(t => t.type === selectedType)
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .map((term) => (
              <motion.div
                key={term.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="font-medium dark:text-white">버전 {term.version}</span>
                      {term.is_active && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                          활성
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-600 dark:text-gray-400">
                      <span>시행일: {term.effective_date}</span>
                      <span>생성일: {new Date(term.created_at).toLocaleDateString('ko-KR')}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {!term.is_active && (
                      <button
                        onClick={() => handleActivate(term.id)}
                        className="px-3 py-1.5 text-sm bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                      >
                        활성화
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setEditingTerms(term);
                        setIsEditing(true);
                      }}
                      className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(term.id)}
                      className="p-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                      disabled={term.is_active}
                    >
                      <Trash2 className={`w-4 h-4 ${term.is_active ? 'opacity-50' : ''}`} />
                    </button>
                  </div>
                </div>
                
                {/* 삭제 확인 */}
                <AnimatePresence>
                  {showDeleteConfirm === term.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700"
                    >
                      <p className="text-sm text-red-600 dark:text-red-400 mb-3">
                        이 버전을 삭제하시겠습니까?
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleDelete(term.id)}
                          className="px-3 py-1.5 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                        >
                          삭제
                        </button>
                        <button
                          onClick={() => setShowDeleteConfirm(null)}
                          className="px-3 py-1.5 text-sm bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
                        >
                          취소
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
        </div>
      </div>
    </div>
  );
}