import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Metadata } from 'next';
import { Suspense } from 'react';
import { TermsSkeleton } from '@/app/components/ui/Skeleton';

// 메타데이터 생성 - 동적 메타데이터
export async function generateMetadata(): Promise<Metadata> {
  try {
    // API에서 개인정보처리방침 데이터 가져오기
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/terms?type=privacy_policy`, {
      next: { revalidate: 1800 } // 30분 캐싱
    });
    
    if (res.ok) {
      const result = await res.json();
      const privacy = result.data;
      
      return {
        title: `${privacy.title} - Privacy Policy | 광주 게임플라자`,
        description: `광주 게임플라자의 ${privacy.title}입니다. 개인정보의 수집, 이용, 보관 및 파기에 관한 사항을 안내합니다.`,
        keywords: ['개인정보처리방침', 'privacy policy', '개인정보보호', 'data protection', '게임플라자'],
        robots: {
          index: true,
          follow: true,
        },
        openGraph: {
          title: `${privacy.title} | 광주 게임플라자`,
          description: `광주 게임플라자의 ${privacy.title}입니다.`,
          type: 'article',
          locale: 'ko_KR',
        },
        other: {
          'last-modified': privacy.updated_at,
        }
      };
    }
  } catch (error) {
    console.error('메타데이터 생성 중 오류:', error);
  }
  
  // 폴백 메타데이터
  return {
    title: '개인정보처리방침 - Privacy Policy | 광주 게임플라자',
    description: '광주 게임플라자의 개인정보처리방침입니다. Privacy Policy for Gwangju Game Plaza.',
    keywords: ['개인정보처리방침', 'privacy policy', '개인정보보호', 'data protection'],
    robots: {
      index: true,
      follow: true,
    },
    openGraph: {
      title: '개인정보처리방침 - Privacy Policy | 광주 게임플라자',
      description: '광주 게임플라자의 개인정보처리방침입니다.',
      type: 'article',
      locale: 'ko_KR',
    }
  };
}

// 개인정보처리방침 데이터 가져오기 함수
async function getPrivacyData() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/terms?type=privacy_policy`, {
      next: { revalidate: 1800 }, // 30분 캐싱
      headers: {
        'Cache-Control': 'public, max-age=1800, stale-while-revalidate=3600'
      }
    });
    
    if (!res.ok) {
      throw new Error(`API 응답 오류: ${res.status}`);
    }
    
    const result = await res.json();
    return result.data;
  } catch (error) {
    console.error('개인정보처리방침 데이터 가져오기 오류:', error);
    
    // 폴백 데이터
    return {
      id: 2,
      type: 'privacy_policy',
      title: '개인정보처리방침',
      content: `
        <h1>개인정보 처리방침<br /><span style="font-size: 1.5rem; color: #6b7280; font-weight: normal;">Privacy Policy</span></h1>
        
        <p><strong>버전: 1.0</strong><br />
        <strong>시행일: 2025. 8. 15.</strong></p>
        
        <br />
        
        <p>광주 게임플라자(이하 "회사")는 「개인정보 보호법」 제30조에 따라 이용자의 개인정보를 보호하고 이와 관련한 고충을 신속하고 원활하게 처리할 수 있도록 하기 위하여 다음과 같이 개인정보 처리방침을 수립·공개합니다.</p>
        
        <br />
        
        <h2>제1장 총칙</h2>
        
        <br />
        
        <h3>제1조 (목적)</h3>
        <p>이 개인정보 처리방침은 회사가 제공하는 게임기기 예약 서비스를 이용하는 이용자의 개인정보를 보호하고, 개인정보와 관련한 이용자의 고충을 신속하고 원활하게 처리할 수 있도록 하는 것을 목적으로 합니다.</p>
        
        <br />
        
        <h3>제2조 (개인정보의 처리 목적)</h3>
        <p>회사는 다음의 목적을 위하여 개인정보를 처리합니다.</p>
        <ol>
          <li><strong>회원 가입 및 관리</strong>
            <ul>
              <li>회원 가입의사 확인</li>
              <li>회원제 서비스 제공에 따른 본인 식별·인증</li>
              <li>회원자격 유지·관리</li>
            </ul>
          </li>
          <li><strong>서비스 제공</strong>
            <ul>
              <li>게임기기 예약 서비스 제공</li>
              <li>예약 상태 확인 및 변경</li>
              <li>콘텐츠 제공</li>
            </ul>
          </li>
        </ol>
        
        <p><em>서비스 연결 오류로 인해 기본 개인정보처리방침을 표시하고 있습니다. 최신 방침은 관리자에게 문의해 주세요.</em></p>
      `,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      error: true
    };
  }
}

// 개인정보처리방침 콘텐츠 컴포넌트
function PrivacyContent({ privacy }: { privacy: any }) {
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
            "description": `광주 게임플라자의 ${privacy.title}`,
            "inLanguage": "ko-KR",
            "isPartOf": {
              "@type": "WebSite",
              "name": "광주 게임플라자",
              "url": "https://www.gameplaza.kr"
            },
            "datePublished": privacy.created_at,
            "dateModified": privacy.updated_at
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
          <div className="prose prose-slate max-w-none !text-gray-900 prose-headings:!text-gray-900 prose-p:!text-gray-900 prose-li:!text-gray-900 prose-strong:!text-black prose-a:!text-blue-600">
            {/* 에러 표시 */}
            {privacy.error && (
              <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">
                      연결 오류
                    </h3>
                    <div className="mt-2 text-sm text-yellow-700">
                      <p>서비스 연결 오류로 인해 기본 개인정보처리방침을 표시하고 있습니다. 최신 방침은 관리자에게 문의해 주세요.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* 동적 콘텐츠 렌더링 */}
            <div 
              dangerouslySetInnerHTML={{ 
                __html: privacy.content 
              }}
            />
          </div>
        </div>
      </div>
    </>
  );
}

// 메인 페이지 컴포넌트 - 서버 컴포넌트
export default async function PrivacyPage() {
  const privacy = await getPrivacyData();
  
  return (
    <Suspense fallback={<TermsSkeleton />}>
      <PrivacyContent privacy={privacy} />
    </Suspense>
  );
}