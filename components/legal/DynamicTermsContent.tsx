'use client';

import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

interface DynamicTermsContentProps {
  type: 'terms_of_service' | 'privacy_policy';
}

interface Terms {
  id: string;
  type: string;
  title: string;
  content: string;
  version: string;
  effective_date: string;
  is_active: boolean;
}

export default function DynamicTermsContent({ type }: DynamicTermsContentProps) {
  const [terms, setTerms] = useState<Terms | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTerms = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/terms?type=${type}`);
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || '약관을 불러올 수 없습니다.');
        }

        setTerms(result.data);
      } catch (err) {
        console.error('약관 조회 오류:', err);
        setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchTerms();
  }, [type]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        <span className="ml-2 text-gray-600 dark:text-gray-400">약관을 불러오는 중...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <p className="text-red-600 dark:text-red-400">
          약관을 불러오는 중 오류가 발생했습니다: {error}
        </p>
      </div>
    );
  }

  if (!terms) {
    return (
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
        <p className="text-yellow-800 dark:text-yellow-200">
          현재 약관이 설정되지 않았습니다.
        </p>
      </div>
    );
  }

  return (
    <div className="prose prose-gray dark:prose-invert max-w-none">
      <div className="mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
        <h1 className="text-2xl font-bold mb-2">{terms.title}</h1>
        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
          <span>버전: {terms.version}</span>
          <span>시행일: {new Date(terms.effective_date).toLocaleDateString('ko-KR')}</span>
        </div>
      </div>
      
      <div className="whitespace-pre-wrap text-gray-700 dark:text-gray-300 leading-relaxed">
        {terms.content}
      </div>
    </div>
  );
}