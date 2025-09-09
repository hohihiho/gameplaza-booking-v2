'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  Save, 
  X, 
  Eye, 
  History, 
  AlertTriangle,
  ArrowLeft,
  Globe,
  FileText
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

interface Version {
  id: string;
  version: number;
  title: string;
  content: string;
  changeLog: string;
  createdAt: string;
}

export default function TermEditPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;
  
  const [page, setPage] = useState<ContentPage | null>(null);
  const [versions, setVersions] = useState<Version[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 편집 폼 상태
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [contentType, setContentType] = useState<'markdown' | 'html'>('markdown');
  const [changeLog, setChangeLog] = useState('');
  
  // UI 상태
  const [showVersions, setShowVersions] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const isNew = slug === 'new';

  useEffect(() => {
    if (!isNew) {
      fetchPage();
      fetchVersions();
    } else {
      setLoading(false);
    }
  }, [slug, isNew]);

  useEffect(() => {
    // 변경사항 감지
    if (page) {
      const hasChanges = title !== page.title || content !== page.content || contentType !== page.contentType;
      setHasUnsavedChanges(hasChanges);
    }
  }, [title, content, contentType, page]);

  const fetchPage = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/cms/terms/${slug}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          setError('요청한 약관을 찾을 수 없습니다.');
        } else {
          throw new Error('약관을 불러오는 데 실패했습니다.');
        }
        return;
      }

      const data = await response.json();
      const pageData = data.page;
      
      setPage(pageData);
      setTitle(pageData.title);
      setContent(pageData.content);
      setContentType(pageData.contentType);
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const fetchVersions = async () => {
    try {
      const response = await fetch(`/api/admin/cms/terms/${slug}/versions`);
      if (response.ok) {
        const data = await response.json();
        setVersions(data.versions || []);
      }
    } catch (err) {
      console.error('버전 히스토리를 불러오는 데 실패했습니다:', err);
    }
  };

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      alert('제목과 내용을 모두 입력해주세요.');
      return;
    }

    try {
      setSaving(true);
      
      const url = isNew ? '/api/admin/cms/terms' : `/api/admin/cms/terms/${slug}`;
      const method = isNew ? 'POST' : 'PUT';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          slug: isNew ? slug : undefined,
          title: title.trim(),
          content: content.trim(),
          contentType,
          changeLog: changeLog.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '저장에 실패했습니다.');
      }

      const data = await response.json();
      
      if (isNew) {
        // 새 약관 생성 후 편집 페이지로 이동
        router.push(`/admin/cms/terms/${data.page.slug}`);
      } else {
        // 기존 약관 업데이트
        setPage(data.page);
        setHasUnsavedChanges(false);
        setChangeLog('');
        fetchVersions(); // 버전 히스토리 새로고침
        
        // 성공 알림
        const notification = document.createElement('div');
        notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
        notification.textContent = '저장되었습니다.';
        document.body.appendChild(notification);
        setTimeout(() => {
          document.body.removeChild(notification);
        }, 3000);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : '저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!page) return;

    if (hasUnsavedChanges) {
      alert('발행하기 전에 변경사항을 저장해주세요.');
      return;
    }

    try {
      const response = await fetch(`/api/admin/cms/terms/${slug}/publish`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ publish: !page.isPublished }),
      });

      if (!response.ok) {
        throw new Error('발행 상태 변경에 실패했습니다.');
      }

      const data = await response.json();
      setPage(data.page);
    } catch (err) {
      alert(err instanceof Error ? err.message : '발행 상태 변경에 실패했습니다.');
    }
  };

  const loadVersion = (version: Version) => {
    if (hasUnsavedChanges) {
      if (!confirm('저장하지 않은 변경사항이 있습니다. 정말로 이전 버전을 불러오시겠습니까?')) {
        return;
      }
    }
    
    setTitle(version.title);
    setContent(version.content);
    setChangeLog(`버전 ${version.version}에서 복원`);
    setShowVersions(false);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-64"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-96 bg-gray-200 rounded"></div>
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
          <Link
            href="/admin/cms/terms"
            className="mt-3 inline-block px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            목록으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/cms/terms"
            className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white border border-gray-300 dark:border-gray-600 rounded-lg hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            목록으로
          </Link>
          
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {isNew ? '새 약관 작성' : '약관 편집'}
            </h1>
            {page && (
              <div className="flex items-center gap-2 mt-2">
                <span className="text-gray-600 dark:text-gray-400">
                  {page.slug} • 버전 {page.version}
                </span>
                {page.isPublished ? (
                  <span className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                    <Globe className="w-3 h-3" />
                    발행됨
                  </span>
                ) : (
                  <span className="flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
                    <FileText className="w-3 h-3" />
                    임시저장
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* 버전 히스토리 버튼 */}
          {!isNew && versions.length > 0 && (
            <button
              onClick={() => setShowVersions(!showVersions)}
              className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white border border-gray-300 dark:border-gray-600 rounded-lg hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
            >
              <History className="w-4 h-4" />
              히스토리
            </button>
          )}

          {/* 미리보기 버튼 */}
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white border border-gray-300 dark:border-gray-600 rounded-lg hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
          >
            <Eye className="w-4 h-4" />
            {showPreview ? '편집' : '미리보기'}
          </button>

          {/* 발행/발행취소 버튼 */}
          {!isNew && page && (
            <button
              onClick={handlePublish}
              className={`px-4 py-2 rounded-lg transition-colors ${
                page.isPublished
                  ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                  : 'bg-green-100 text-green-700 hover:bg-green-200'
              }`}
            >
              {page.isPublished ? '발행취소' : '발행'}
            </button>
          )}

          {/* 저장 버튼 */}
          <button
            onClick={handleSave}
            disabled={saving || (!isNew && !hasUnsavedChanges)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Save className="w-4 h-4" />
            {saving ? '저장 중...' : '저장'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* 버전 히스토리 사이드바 */}
        {showVersions && !isNew && (
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sticky top-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                버전 히스토리
              </h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {versions.map((version) => (
                  <div
                    key={version.id}
                    className="p-3 border border-gray-200 dark:border-gray-600 rounded-lg cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-500 transition-colors"
                    onClick={() => loadVersion(version)}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        v{version.version}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(version.createdAt).toLocaleDateString('ko-KR')}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                      {version.changeLog || '변경사항 없음'}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 메인 편집 영역 */}
        <div className={showVersions && !isNew ? 'lg:col-span-3' : 'lg:col-span-4'}>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="p-6">
              {/* 기본 정보 */}
              <div className="space-y-6">
                {/* 제목 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    제목 *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="약관 제목을 입력하세요"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                {/* 슬러그 (새 약관인 경우만) */}
                {isNew && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      슬러그 *
                    </label>
                    <input
                      type="text"
                      value={slug}
                      placeholder="예: terms, privacy"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                      readOnly
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      URL 경로에 사용될 고유한 식별자입니다.
                    </p>
                  </div>
                )}

                {/* 콘텐츠 타입 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    콘텐츠 타입
                  </label>
                  <select
                    value={contentType}
                    onChange={(e) => setContentType(e.target.value as 'markdown' | 'html')}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="markdown">Markdown</option>
                    <option value="html">HTML</option>
                  </select>
                </div>

                {/* 변경 로그 */}
                {!isNew && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      변경사항 설명
                    </label>
                    <input
                      type="text"
                      value={changeLog}
                      onChange={(e) => setChangeLog(e.target.value)}
                      placeholder="이번 수정의 주요 변경사항을 간단히 설명해주세요"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                )}

                {/* 내용 편집/미리보기 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    내용 *
                  </label>
                  
                  {showPreview ? (
                    <div className="min-h-[400px] p-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900">
                      {contentType === 'markdown' ? (
                        <div 
                          className="prose dark:prose-invert max-w-none"
                          dangerouslySetInnerHTML={{
                            __html: content // 실제로는 마크다운 파서가 필요
                              .replace(/\n/g, '<br>')
                              .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                              .replace(/\*(.*?)\*/g, '<em>$1</em>')
                          }}
                        />
                      ) : (
                        <div 
                          className="prose dark:prose-invert max-w-none"
                          dangerouslySetInnerHTML={{ __html: content }}
                        />
                      )}
                    </div>
                  ) : (
                    <textarea
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder={`${contentType === 'markdown' ? 'Markdown' : 'HTML'} 형식으로 내용을 입력하세요`}
                      className="w-full h-96 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white font-mono text-sm"
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}