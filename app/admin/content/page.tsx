// CMS 컨텐츠 관리 페이지
// 비전공자 설명: 관리자가 이용안내, 예약안내 등의 컨텐츠를 편집하는 페이지입니다
'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FileText,
  Save,
  X,
  ChevronLeft,
  Edit3,
  Eye,
  AlertCircle,
  Info,
  Calendar,
  Shield,
  Phone,
  Mail,
  MapPin,
  Clock,
  DollarSign
} from 'lucide-react';
import Link from 'next/link';

type ContentSection = {
  id: string;
  title: string;
  path: string;
  icon: React.ElementType;
  description: string;
  lastUpdated: string;
  content: {
    sections: {
      id: string;
      title: string;
      content: string;
      type: 'text' | 'list' | 'info';
    }[];
  };
};

export default function ContentManagementPage() {
  const [contentSections, setContentSections] = useState<ContentSection[]>([]);
  const [selectedSection, setSelectedSection] = useState<ContentSection | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingContent, setEditingContent] = useState<ContentSection['content'] | null>(null);
  const [isPreview, setIsPreview] = useState(false);

  // Mock 데이터
  useEffect(() => {
    setContentSections([
      {
        id: '1',
        title: '이용 안내',
        path: '/guide',
        icon: Info,
        description: '오락실 이용 규칙, 운영 시간, 요금 안내 등',
        lastUpdated: '2024-01-20',
        content: {
          sections: [
            {
              id: '1-1',
              title: '운영 시간',
              type: 'info',
              content: '평일: 10:00 - 24:00\n주말/공휴일: 10:00 - 02:00\n\n* 마지막 입장은 마감 1시간 전까지입니다.\n* 특별 운영 시간은 공지사항을 확인해주세요.'
            },
            {
              id: '1-2',
              title: '이용 요금',
              type: 'list',
              content: '• 일반 플레이: 게임별 상이 (500원 ~ 2,000원)\n• 대여: 시간당 40,000원 ~ 60,000원\n• 2인 플레이: 1.5배 요금\n• 청소년 할인: 평일 30% (학생증 지참)'
            },
            {
              id: '1-3',
              title: '이용 규칙',
              type: 'list',
              content: '• 음식물 반입 금지 (음료는 뚜껑 있는 것만 가능)\n• 흡연은 지정된 장소에서만 가능\n• 기기 파손 시 손해배상 청구\n• 타인에게 피해를 주는 행위 금지\n• 직원의 안내에 협조 부탁드립니다'
            }
          ]
        }
      },
      {
        id: '2',
        title: '예약 안내',
        path: '/guide/reservation',
        icon: Calendar,
        description: '예약 방법, 취소 규정, 주의사항 등',
        lastUpdated: '2024-01-18',
        content: {
          sections: [
            {
              id: '2-1',
              title: '예약 방법',
              type: 'text',
              content: '1. 회원가입 및 로그인\n2. 원하는 날짜와 기기 선택\n3. 시간대 선택 (2시간 단위)\n4. 크레딧 옵션 선택\n5. 예약 정보 확인 후 신청\n6. 관리자 승인 대기\n7. 승인 완료 시 문자 알림'
            },
            {
              id: '2-2',
              title: '취소 및 환불 규정',
              type: 'list',
              content: '• 이용 24시간 전: 100% 환불\n• 이용 12시간 전: 50% 환불\n• 이용 12시간 이내: 환불 불가\n• No-show 시: 다음 예약 제한\n• 천재지변 등 불가항력: 100% 환불'
            },
            {
              id: '2-3',
              title: '예약 시 주의사항',
              type: 'info',
              content: '• 예약은 최대 2주 전부터 가능합니다\n• 1인당 동시 예약은 최대 2건까지입니다\n• 단체 예약(4인 이상)은 전화 문의 바랍니다\n• 예약 시간에 늦을 경우 사전 연락 필수'
            }
          ]
        }
      },
      {
        id: '3',
        title: '회원 정책',
        path: '/guide/policy',
        icon: Shield,
        description: '회원 등급, 혜택, 이용 제한 등',
        lastUpdated: '2024-01-15',
        content: {
          sections: [
            {
              id: '3-1',
              title: '회원 등급',
              type: 'list',
              content: '• 일반 회원: 기본 예약 가능\n• 실버 회원: 월 10회 이상 이용, 5% 할인\n• 골드 회원: 월 20회 이상 이용, 10% 할인\n• VIP 회원: 별도 초대, 15% 할인 + 우선 예약'
            },
            {
              id: '3-2',
              title: '이용 제한',
              type: 'text',
              content: '다음의 경우 이용이 제한될 수 있습니다:\n\n1. 예약 후 무단 No-show 3회 이상\n2. 기기 파손 또는 고의적 훼손\n3. 다른 이용자에게 피해를 주는 행위\n4. 직원에 대한 폭언 또는 폭행\n5. 기타 운영에 심각한 지장을 주는 행위'
            }
          ]
        }
      },
      {
        id: '4',
        title: '오시는 길',
        path: '/guide/location',
        icon: MapPin,
        description: '주소, 대중교통, 주차 안내',
        lastUpdated: '2024-01-10',
        content: {
          sections: [
            {
              id: '4-1',
              title: '주소 및 연락처',
              type: 'info',
              content: '광주광역시 동구 금남로 123\n게임플라자 빌딩 3층\n\n전화: 062-123-4567\n이메일: info@gameplaza.kr\n카카오톡: @gameplaza'
            },
            {
              id: '4-2',
              title: '대중교통',
              type: 'list',
              content: '• 지하철: 금남로4가역 3번 출구 도보 5분\n• 버스: 금남로 정류장 하차\n  - 간선: 419, 518, 1187\n  - 지선: 222, 333, 444\n  - 마을: 동구1, 동구2'
            },
            {
              id: '4-3',
              title: '주차 안내',
              type: 'text',
              content: '건물 내 주차장 이용 가능 (B1~B2)\n\n주차 요금:\n• 최초 30분: 무료\n• 이용 고객: 2시간 무료 (주차권 지급)\n• 추가 10분당: 500원\n• 일일 최대: 15,000원'
            }
          ]
        }
      }
    ]);
  }, []);

  const handleSave = () => {
    if (!selectedSection || !editingContent) return;

    setContentSections(sections => 
      sections.map(section => 
        section.id === selectedSection.id
          ? { ...section, content: editingContent, lastUpdated: new Date().toISOString().split('T')[0] }
          : section
      )
    );

    setIsEditing(false);
    alert('컨텐츠가 저장되었습니다.');
  };

  const handleSectionContentChange = (sectionId: string, newContent: string) => {
    if (!editingContent) return;

    setEditingContent({
      sections: editingContent.sections.map(section =>
        section.id === sectionId ? { ...section, content: newContent } : section
      )
    });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* 헤더 */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-2">
          <Link
            href="/admin"
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          </Link>
          <h1 className="text-2xl font-bold dark:text-white">컨텐츠 관리</h1>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 ml-11">
          사이트에 표시되는 안내 페이지의 내용을 편집합니다
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 컨텐츠 목록 */}
        <div className="lg:col-span-1 space-y-4">
          {contentSections.map((section, index) => {
            const Icon = section.icon;
            return (
              <motion.div
                key={section.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`bg-white dark:bg-gray-800 rounded-xl border p-4 cursor-pointer transition-all ${
                  selectedSection?.id === section.id
                    ? 'border-blue-500 ring-2 ring-blue-500/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
                onClick={() => {
                  setSelectedSection(section);
                  setEditingContent(section.content);
                  setIsEditing(false);
                  setIsPreview(false);
                }}
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                    <Icon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium dark:text-white">{section.title}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {section.description}
                    </p>
                    <div className="flex items-center gap-2 mt-2 text-xs text-gray-500 dark:text-gray-500">
                      <Clock className="w-3 h-3" />
                      <span>최종 수정: {section.lastUpdated}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* 편집 영역 */}
        <div className="lg:col-span-2">
          {selectedSection ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
              {/* 편집 헤더 */}
              <div className="border-b border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold dark:text-white">
                    {selectedSection.title}
                  </h2>
                  <div className="flex items-center gap-2">
                    {!isEditing ? (
                      <>
                        <button
                          onClick={() => setIsPreview(!isPreview)}
                          className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                            isPreview
                              ? 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                          }`}
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setIsEditing(true)}
                          className="flex items-center gap-2 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                        >
                          <Edit3 className="w-4 h-4" />
                          편집
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => {
                            setIsEditing(false);
                            setEditingContent(selectedSection.content);
                          }}
                          className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        >
                          취소
                        </button>
                        <button
                          onClick={handleSave}
                          className="flex items-center gap-2 px-4 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
                        >
                          <Save className="w-4 h-4" />
                          저장
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* 편집 내용 */}
              <div className="p-6 space-y-6">
                {editingContent?.sections.map((section) => (
                  <div key={section.id} className="space-y-3">
                    <h3 className="font-medium dark:text-white">{section.title}</h3>
                    {isEditing ? (
                      <textarea
                        value={section.content}
                        onChange={(e) => handleSectionContentChange(section.id, e.target.value)}
                        className="w-full h-32 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      />
                    ) : (
                      <div className={`${
                        isPreview 
                          ? 'prose prose-sm dark:prose-invert max-w-none' 
                          : 'p-4 bg-gray-50 dark:bg-gray-900 rounded-lg'
                      }`}>
                        {isPreview ? (
                          <div 
                            dangerouslySetInnerHTML={{ 
                              __html: section.content
                                .replace(/\n/g, '<br>')
                                .replace(/•/g, '<li>')
                                .replace(/<li>/g, '<ul><li>')
                                .replace(/<\/li>(?!.*<\/li>)/g, '</li></ul>')
                            }} 
                          />
                        ) : (
                          <pre className="whitespace-pre-wrap text-sm text-gray-600 dark:text-gray-400">
                            {section.content}
                          </pre>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                편집할 컨텐츠를 선택하세요
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 안내 메시지 */}
      <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-1">
              컨텐츠 편집 안내
            </h4>
            <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
              <li>• 편집한 내용은 즉시 사이트에 반영됩니다</li>
              <li>• 줄바꿈은 Enter 키를 사용하세요</li>
              <li>• 목록은 • 기호로 시작하세요</li>
              <li>• 미리보기로 실제 표시될 모습을 확인하세요</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}