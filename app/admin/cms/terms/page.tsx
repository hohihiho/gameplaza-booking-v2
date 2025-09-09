'use client';

import { useState, useEffect } from 'react';
import { 
  FileText, 
  Edit3, 
  Eye, 
  Globe, 
  Clock,
  Plus,
  AlertTriangle
} from 'lucide-react';
import Link from 'next/link';

interface ContentPage {
  id: string;
  slug: string;
  title: string;
  content: string;
  contentType: 'markdown' | 'html';
  version: number;
  isPublished: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function TermsManagePage() {
  const [pages, setPages] = useState<ContentPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPages();
  }, []);

  const fetchPages = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/cms/terms');
      
      if (!response.ok) {
        throw new Error('약관 목록을 불러오는 데 실패했습니다.');
      }

      const data = await response.json();
      setPages(data.pages || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handlePublishToggle = async (slug: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/cms/terms/${slug}/publish`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ publish: !currentStatus }),
      });

      if (!response.ok) {
        throw new Error('발행 상태 변경에 실패했습니다.');
      }

      // 페이지 목록 새로고침
      fetchPages();
    } catch (err) {
      alert(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-64"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-800">
            <AlertTriangle className="w-5 h-5" />
            <span className="font-medium">오류 발생</span>
          </div>
          <p className="mt-2 text-red-700">{error}</p>
          <button
            onClick={fetchPages}
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            약관 관리
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            이용약관, 개인정보처리방침 등을 관리합니다.
          </p>
        </div>
        
        <Link
          href="/admin/cms/terms/new"
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          새 약관 추가
        </Link>
      </div>

      {/* 약관 목록 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6">
          <div className="space-y-4">
            {pages.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  등록된 약관이 없습니다
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  첫 번째 약관을 추가해보세요.
                </p>
                <Link
                  href="/admin/cms/terms/new"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  새 약관 추가
                </Link>
              </div>
            ) : (
              pages.map((page) => (
                <div
                  key={page.id}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {page.title}
                        </h3>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          ({page.slug})
                        </span>
                        <div className="flex items-center gap-2">
                          {page.isPublished ? (
                            <span className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                              <Globe className="w-3 h-3" />
                              발행됨
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
                              <Clock className="w-3 h-3" />
                              임시저장
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                        <p>버전: {page.version}</p>
                        <p>생성일: {formatDate(page.createdAt)}</p>
                        <p>수정일: {formatDate(page.updatedAt)}</p>
                        {page.publishedAt && (
                          <p>발행일: {formatDate(page.publishedAt)}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* 미리보기 버튼 */}
                      <Link
                        href={`/admin/cms/terms/${page.slug}/preview`}
                        className="flex items-center gap-1 px-3 py-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white border border-gray-300 dark:border-gray-600 rounded-lg hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        미리보기
                      </Link>

                      {/* 편집 버튼 */}
                      <Link
                        href={`/admin/cms/terms/${page.slug}`}
                        className="flex items-center gap-1 px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                      >
                        <Edit3 className="w-4 h-4" />
                        편집
                      </Link>

                      {/* 발행/발행취소 버튼 */}
                      <button
                        onClick={() => handlePublishToggle(page.slug, page.isPublished)}
                        className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                          page.isPublished
                            ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                        }`}
                      >
                        {page.isPublished ? '발행취소' : '발행'}
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}