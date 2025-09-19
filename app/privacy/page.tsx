'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface TermsData {
  id: string;
  type: string;
  title: string;
  content: string;
  version: string;
  effective_date: string;
  created_at: string;
  updated_at: string;
}

export default function PrivacyPage() {
  const [privacy, setPrivacy] = useState<TermsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPrivacy = async () => {
      try {
        const response = await fetch('/api/terms?type=privacy_policy');
        if (!response.ok) throw new Error('개인정보처리방침을 불러올 수 없습니다.');
        
        const result = await response.json();
        setPrivacy(result.data);
      } catch (err) {
        console.error('개인정보처리방침 조회 오류:', err);
        setError(err instanceof Error ? err.message : '개인정보처리방침을 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchPrivacy();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-gray-600" />
          <span className="text-gray-600">개인정보처리방침을 불러오는 중...</span>
        </div>
      </div>
    );
  }

  if (error || !privacy) {
    return (
      <div className="min-h-screen bg-white">
        <div className="fixed top-4 left-4 z-50">
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg shadow-lg hover:bg-indigo-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            홈으로
          </Link>
        </div>
        <div className="max-w-4xl mx-auto px-6 py-16">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-red-800 mb-2">오류 발생</h2>
            <p className="text-red-600">{error || '개인정보처리방침을 불러올 수 없습니다.'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* JSON-LD 구조화 데이터 */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            "name": privacy.title,
            "alternateName": "Privacy Policy",
            "url": "https://www.gameplaza.kr/privacy",
            "description": "광주 게임플라자의 개인정보처리방침",
            "inLanguage": "ko-KR",
            "isPartOf": {
              "@type": "WebSite",
              "name": "광주 게임플라자",
              "url": "https://www.gameplaza.kr"
            },
            "datePublished": privacy.effective_date,
            "dateModified": privacy.updated_at.split('T')[0]
          })
        }}
      />
      
      <div className="min-h-screen bg-white text-gray-900">
        {/* 홈으로 버튼 - 상단 고정 */}
        <div className="fixed top-4 left-4 z-50">
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg shadow-lg hover:bg-indigo-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            홈으로
          </Link>
        </div>

        {/* 내용 */}
        <div className="max-w-4xl mx-auto px-6 py-16">
          <div className="mb-6">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              {privacy.title}
            </h1>
            <div className="text-gray-600">
              <p>버전: {privacy.version}</p>
              <p>시행일: {privacy.effective_date}</p>
            </div>
          </div>

          <div className="prose prose-slate max-w-none prose-headings:text-gray-900 prose-p:text-gray-700">
            <ReactMarkdown>{privacy.content}</ReactMarkdown>
          </div>
        </div>
      </div>
    </>
  );
}