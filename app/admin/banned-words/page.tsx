'use client';

import { useState, useEffect } from 'react';
import { Trash2, Plus, AlertCircle, Search, Shield, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type BannedWord = {
  id: string;
  word: string;
  category: string;
  language: string;
  severity: number;
  is_active: boolean;
  created_at: string;
};

export default function BannedWordsPage() {
  const [bannedWords, setBannedWords] = useState<BannedWord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newWord, setNewWord] = useState('');
  const [category, setCategory] = useState('custom');
  const [language, setLanguage] = useState('ko');
  const [severity, setSeverity] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // 금지어 목록 불러오기
  const loadBannedWords = async () => {
    try {
      const response = await fetch('/api/admin/banned-words');
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '금지어 목록을 불러올 수 없습니다');
      }

      setBannedWords(result.data || []);
    } catch (error: any) {
      console.error('금지어 로드 오류:', error);
      setError(error.message || '금지어 목록을 불러오는데 실패했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBannedWords();
  }, []);

  // 금지어 추가
  const addBannedWord = async () => {
    if (!newWord.trim()) {
      setError('금지어를 입력해주세요');
      return;
    }

    try {
      const response = await fetch('/api/admin/banned-words', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          word: newWord.trim().toLowerCase(),
          category,
          language,
          severity,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        if (response.status === 409) {
          setError('이미 등록된 금지어입니다');
        } else {
          throw new Error(result.error || '금지어 추가에 실패했습니다');
        }
        return;
      }

      setSuccess('금지어가 추가되었습니다');
      setNewWord('');
      loadBannedWords();
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (error: any) {
      console.error('금지어 추가 오류:', error);
      setError(error.message || '금지어 추가에 실패했습니다');
    }
  };

  // 금지어 토글 (활성/비활성)
  const toggleBannedWord = async (id: string, isActive: boolean) => {
    try {
      const response = await fetch('/api/admin/banned-words', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id,
          is_active: !isActive,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '상태 변경에 실패했습니다');
      }

      loadBannedWords();
    } catch (error: any) {
      console.error('금지어 토글 오류:', error);
      setError(error.message || '상태 변경에 실패했습니다');
    }
  };

  // 금지어 삭제
  const deleteBannedWord = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;

    try {
      const response = await fetch(`/api/admin/banned-words?id=${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '삭제에 실패했습니다');
      }

      loadBannedWords();
      setSuccess('금지어가 삭제되었습니다');
      setTimeout(() => setSuccess(null), 3000);
    } catch (error: any) {
      console.error('금지어 삭제 오류:', error);
      setError(error.message || '삭제에 실패했습니다');
    }
  };

  // 필터링된 금지어 목록
  const filteredWords = bannedWords.filter(word =>
    word.word.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const categoryColors = {
    custom: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
    profanity: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    offensive: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300'
  };

  const severityColors = {
    1: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    2: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2 dark:text-white">금지어 관리</h1>
        <p className="text-gray-600 dark:text-gray-400">
          닉네임 및 채팅에서 사용할 수 없는 단어를 관리합니다
        </p>
      </div>

      {/* 알림 메시지 */}
      <AnimatePresence>
        {(error || success) && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
              error 
                ? 'bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-300' 
                : 'bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-300'
            }`}
          >
            <AlertCircle className="w-5 h-5" />
            {error || success}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 금지어 추가 폼 */}
      <div className="bg-white dark:bg-gray-900 rounded-xl p-6 mb-6 border border-gray-200 dark:border-gray-800">
        <h2 className="text-lg font-semibold mb-4 dark:text-white">새 금지어 추가</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <input
            type="text"
            value={newWord}
            onChange={(e) => setNewWord(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addBannedWord()}
            placeholder="금지어 입력"
            className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white dark:bg-gray-800 dark:text-white"
          />
          
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white dark:bg-gray-800 dark:text-white"
          >
            <option value="custom">사용자 정의</option>
            <option value="profanity">비속어</option>
            <option value="offensive">공격적 표현</option>
          </select>
          
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white dark:bg-gray-800 dark:text-white"
          >
            <option value="ko">한국어</option>
            <option value="en">영어</option>
            <option value="all">모든 언어</option>
          </select>
          
          <select
            value={severity}
            onChange={(e) => setSeverity(Number(e.target.value))}
            className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white dark:bg-gray-800 dark:text-white"
          >
            <option value={1}>경고</option>
            <option value={2}>차단</option>
          </select>
          
          <button
            onClick={addBannedWord}
            className="px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            추가
          </button>
        </div>
      </div>

      {/* 검색 */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="금지어 검색..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white dark:bg-gray-800 dark:text-white"
          />
        </div>
      </div>

      {/* 금지어 목록 */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  금지어
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  카테고리
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  언어
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  심각도
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  상태
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  작업
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredWords.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    {searchTerm ? '검색 결과가 없습니다' : '등록된 금지어가 없습니다'}
                  </td>
                </tr>
              ) : (
                filteredWords.map((word) => (
                  <motion.tr
                    key={word.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`${!word.is_active ? 'opacity-50' : ''}`}
                  >
                    <td className="px-6 py-4">
                      <span className="font-mono text-sm dark:text-white">
                        {word.word}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs rounded-full ${categoryColors[word.category as keyof typeof categoryColors]}`}>
                        {word.category === 'custom' ? '사용자 정의' : 
                         word.category === 'profanity' ? '비속어' : '공격적 표현'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <Globe className="w-4 h-4 text-gray-400" />
                        <span className="text-sm dark:text-gray-300">
                          {word.language === 'ko' ? '한국어' : 
                           word.language === 'en' ? '영어' : '모든 언어'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs rounded-full ${severityColors[word.severity as keyof typeof severityColors]}`}>
                        {word.severity === 1 ? '경고' : '차단'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => toggleBannedWord(word.id, word.is_active)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          word.is_active 
                            ? 'bg-green-600' 
                            : 'bg-gray-300 dark:bg-gray-700'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            word.is_active ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => deleteBannedWord(word.id)}
                        className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                        title="삭제"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 안내사항 */}
      <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
          <div>
            <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-1">
              금지어 시스템 안내
            </h3>
            <ul className="text-sm text-blue-800 dark:text-blue-400 space-y-1">
              <li>• AI 기반 검사와 함께 추가로 필터링됩니다</li>
              <li>• 경고: 사용자에게 경고 메시지만 표시</li>
              <li>• 차단: 해당 단어가 포함된 텍스트 사용 불가</li>
              <li>• 비활성화된 금지어는 검사에서 제외됩니다</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}