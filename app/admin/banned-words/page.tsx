'use client';

import { useState, useEffect } from 'react';
import { Trash2, Plus, AlertCircle, Search, Shield, Globe, ChevronLeft } from 'lucide-react';
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
  
  // 페이지네이션 상태
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20); // 페이지당 20개 항목
  
  // 필터 상태
  const [filterCategory, setFilterCategory] = useState<string>('all');

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
  const filteredWords = bannedWords.filter(word => {
    // 검색어 필터
    const matchesSearch = word.word.toLowerCase().includes(searchTerm.toLowerCase());
    
    // 카테고리 필터
    const matchesCategory = filterCategory === 'all' || word.category === filterCategory;
    
    return matchesSearch && matchesCategory;
  });

  // 페이지네이션 계산
  const totalPages = Math.ceil(filteredWords.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentWords = filteredWords.slice(startIndex, endIndex);

  // 검색어나 필터 변경 시 첫 페이지로 이동
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterCategory]);

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
    <div className="px-4 sm:px-6 py-6 max-w-7xl mx-auto">
      {/* 헤더 */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => window.history.back()}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-6 h-6 text-gray-700 dark:text-gray-300" />
          </button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              금지어 관리
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
              닉네임 및 채팅에서 사용할 수 없는 단어를 관리합니다
            </p>
          </div>
        </div>
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
        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl p-4 sm:p-6 mb-6 border border-gray-200/50 dark:border-gray-700/50 shadow-sm">
          <h2 className="text-lg font-semibold mb-4 dark:text-white">새 금지어 추가</h2>
        
        <div className="space-y-4">
          {/* 모바일: 세로 배치, 데스크톱: 가로 배치 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <input
              type="text"
              value={newWord}
              onChange={(e) => setNewWord(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addBannedWord()}
              placeholder="금지어 입력"
              className="px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition-all text-base"
            />
            
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition-all text-base"
            >
              <option value="custom">사용자 정의</option>
              <option value="profanity">비속어</option>
              <option value="offensive">공격적 표현</option>
            </select>
            
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition-all text-base"
            >
              <option value="ko">한국어</option>
              <option value="en">영어</option>
              <option value="all">모든 언어</option>
            </select>
            
            <select
              value={severity}
              onChange={(e) => setSeverity(Number(e.target.value))}
              className="px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition-all text-base"
            >
              <option value={1}>경고</option>
              <option value={2}>차단</option>
            </select>
          </div>
          
          {/* 추가 버튼 - 모바일에서 전체 너비 */}
          <button
            onClick={addBannedWord}
            className="w-full sm:w-auto px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all duration-200 flex items-center justify-center gap-2 font-medium shadow-sm hover:shadow-md text-base"
          >
            <Plus className="w-5 h-5" />
            금지어 추가
          </button>
        </div>
      </div>

        {/* 카테고리 필터 */}
        <div className="mb-6">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <button
              onClick={() => setFilterCategory('all')}
              className={`px-3 py-1.5 text-sm rounded-lg transition-all ${
                filterCategory === 'all'
                  ? 'bg-indigo-500 text-white shadow-sm'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              전체
            </button>
            
            <button
              onClick={() => setFilterCategory('custom')}
              className={`px-3 py-1.5 text-sm rounded-lg transition-all ${
                filterCategory === 'custom'
                  ? 'bg-indigo-500 text-white shadow-sm'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              사용자 정의
            </button>
            
            <button
              onClick={() => setFilterCategory('profanity')}
              className={`px-3 py-1.5 text-sm rounded-lg transition-all ${
                filterCategory === 'profanity'
                  ? 'bg-indigo-500 text-white shadow-sm'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              비속어
            </button>
            
            <button
              onClick={() => setFilterCategory('offensive')}
              className={`px-3 py-1.5 text-sm rounded-lg transition-all ${
                filterCategory === 'offensive'
                  ? 'bg-indigo-500 text-white shadow-sm'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              공격적 표현
            </button>
          </div>
        </div>

        {/* 검색 */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="금지어 검색..."
              className="w-full pl-12 pr-4 py-3.5 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition-all shadow-sm text-base"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                title="검색어 지우기"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          {(searchTerm || filterCategory !== 'all') && (
            <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              필터 결과: {filteredWords.length}개 / 전체 {bannedWords.length}개 {totalPages > 1 && `(페이지 ${currentPage}/${totalPages})`}
            </div>
          )}
        </div>


      {/* 금지어 목록 */}
      <div>
        {/* 데스크톱 테이블 뷰 - 큰 화면에서만 표시 */}
        <div className="hidden lg:block bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50/80 dark:bg-gray-800/80 border-b border-gray-200 dark:border-gray-700">
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
                {currentWords.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      {(searchTerm || filterCategory !== 'all')
                        ? '검색 조건에 맞는 금지어가 없습니다'
                        : '등록된 금지어가 없습니다'}
                    </td>
                  </tr>
                ) : (
                  currentWords.map((word) => (
                    <motion.tr
                      key={word.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className={`hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors ${!word.is_active ? 'opacity-50' : ''}`}
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
                          className="p-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
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

        {/* 모바일 카드 뷰 - 작은 화면에서만 표시 */}
        <div className="lg:hidden space-y-4">
          {currentWords.length === 0 ? (
            <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-sm p-8 text-center">
              <div className="text-gray-500 dark:text-gray-400">
                {(searchTerm || filterCategory !== 'all')
                  ? '검색 조건에 맞는 금지어가 없습니다'
                  : '등록된 금지어가 없습니다'}
              </div>
            </div>
          ) : (
            currentWords.map((word) => (
              <motion.div
                key={word.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-sm p-4 ${!word.is_active ? 'opacity-50' : ''}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-mono text-lg font-semibold dark:text-white mb-2">
                      {word.word}
                    </h3>
                    <div className="flex flex-wrap gap-2 mb-3">
                      <span className={`inline-flex px-2 py-1 text-xs rounded-full ${categoryColors[word.category as keyof typeof categoryColors]}`}>
                        {word.category === 'custom' ? '사용자 정의' : 
                         word.category === 'profanity' ? '비속어' : '공격적 표현'}
                      </span>
                      <span className={`inline-flex px-2 py-1 text-xs rounded-full ${severityColors[word.severity as keyof typeof severityColors]}`}>
                        {word.severity === 1 ? '경고' : '차단'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-3">
                    {/* 상태 토글 */}
                    <button
                      onClick={() => toggleBannedWord(word.id, word.is_active)}
                      className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                        word.is_active 
                          ? 'bg-green-600' 
                          : 'bg-gray-300 dark:bg-gray-700'
                      }`}
                      title={word.is_active ? '활성화됨' : '비활성화됨'}
                    >
                      <span
                        className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                          word.is_active ? 'translate-x-7' : 'translate-x-1'
                        }`}
                      />
                    </button>
                    
                    {/* 삭제 버튼 */}
                    <button
                      onClick={() => deleteBannedWord(word.id)}
                      className="p-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                      title="삭제"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center gap-1">
                    <Globe className="w-4 h-4" />
                    <span>
                      {word.language === 'ko' ? '한국어' : 
                       word.language === 'en' ? '영어' : '모든 언어'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Shield className="w-4 h-4" />
                    <span>{word.is_active ? '활성' : '비활성'}</span>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="mt-8">
          {/* 데스크톱 페이지네이션 */}
          <div className="hidden sm:flex items-center justify-between">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              전체 {filteredWords.length}개 중 {startIndex + 1}-{Math.min(endIndex, filteredWords.length)}개 표시
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 text-sm bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                이전
              </button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-10 h-10 rounded-lg text-sm font-medium transition-all ${
                        currentPage === pageNum
                          ? 'bg-indigo-500 text-white shadow-lg'
                          : 'bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-2 text-sm bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                다음
              </button>
            </div>
          </div>

          {/* 모바일 페이지네이션 */}
          <div className="sm:hidden flex flex-col gap-3">
            <div className="text-sm text-gray-600 dark:text-gray-400 text-center">
              {currentPage} / {totalPages} 페이지 (전체 {filteredWords.length}개)
            </div>
            
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="px-3 py-2 text-sm bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                처음
              </button>
              
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 text-sm bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                이전
              </button>
              
              <span className="px-4 py-2 text-sm bg-indigo-500 text-white rounded-lg font-medium">
                {currentPage}
              </span>
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 text-sm bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                다음
              </button>
              
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="px-3 py-2 text-sm bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                마지막
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 안내사항 */}
      <div className="mt-8 p-4 sm:p-6 bg-blue-50/80 dark:bg-blue-900/20 backdrop-blur-xl rounded-2xl border border-blue-200/50 dark:border-blue-700/50">
        <div className="flex items-start gap-3">
          <Shield className="w-6 h-6 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-3 text-base">
              금지어 시스템 안내
            </h3>
            <ul className="text-sm text-blue-800 dark:text-blue-400 space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-blue-600 dark:text-blue-400 font-bold">•</span>
                <span>AI 기반 검사와 함께 추가로 필터링됩니다</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 dark:text-blue-400 font-bold">•</span>
                <span><strong>경고:</strong> 사용자에게 경고 메시지만 표시</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 dark:text-blue-400 font-bold">•</span>
                <span><strong>차단:</strong> 해당 단어가 포함된 텍스트 사용 불가</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 dark:text-blue-400 font-bold">•</span>
                <span>비활성화된 금지어는 검사에서 제외됩니다</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}