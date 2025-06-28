// 오락실 이용안내 페이지
// 비전공자 설명: 오락실 운영 정보와 이용 방법을 안내하는 페이지입니다
'use client';

import { useState, useEffect } from 'react';
import { Clock, MapPin, Phone, CreditCard, Users, Shield, Gift, ChevronRight, Calendar, Edit2, Save, X } from 'lucide-react';

type GuideContent = {
  hours: string;
  address: string;
  phone: string;
  prices: {
    rhythm: string;
    arcade: string;
    fighting: string;
    rental_early: string;
    rental_normal: string;
    rental_overnight: string;
  };
  facilities: {
    rhythm: string[];
    arcade: string[];
    amenities: string[];
  };
  rules: {
    basic: string[];
    prohibited: string[];
    safety: string[];
  };
  services: Array<{
    icon: string;
    title: string;
    description: string;
  }>;
};

export default function GuidePage() {
  const [content, setContent] = useState<GuideContent>({
    hours: '오전 10:00 - 익일 오전 2:00 (연중무휴)',
    address: '광주광역시 서구 게임로 123',
    phone: '062-123-4567 (카카오톡 채널 우선)',
    prices: {
      rhythm: '500원/1곡, 1,000원/3곡',
      arcade: '500원~1,000원/1플레이',
      fighting: '500원/1판',
      rental_early: '30,000원~',
      rental_normal: '40,000원~',
      rental_overnight: '60,000원~'
    },
    facilities: {
      rhythm: ['유비트, 사운드 볼텍스, 팝픈뮤직', '댄스댄스레볼루션, 펌프잇업', '마이마이, 츄니즘, 왓카 등'],
      arcade: ['슈팅게임, 퍼즐게임', '대전격투게임', '레트로 게임기'],
      amenities: ['무료 WiFi', '충전 스테이션', '음료 자판기', '휴게 공간', '짐 보관함', '흡연구역']
    },
    rules: {
      basic: ['큰 소리로 떠들거나 욕설 금지', '다른 이용자에게 피해 주지 않기', '기기 파손 시 배상 책임'],
      prohibited: ['음주 후 이용 금지', '흡연 금지 (흡연구역 이용)', '음식물 반입 금지 (음료는 가능)', '기기 임의 조작 금지'],
      safety: ['젖은 손으로 기기 조작 금지', '과도한 힘 사용 금지', '어린이는 보호자 동반 필수']
    },
    services: [
      { icon: 'Users', title: '초보자 가이드', description: '처음 오신 분들을 위한 게임 설명' },
      { icon: 'Calendar', title: '이벤트', description: '월별 토너먼트, 스코어 챌린지' },
      { icon: 'CreditCard', title: '멤버십', description: '단골 고객 할인 혜택' },
      { icon: 'Gift', title: '생일 할인', description: '생일 당일 20% 할인' }
    ]
  });
  
  const [isEditing, setIsEditing] = useState(false);
  const [editingContent, setEditingContent] = useState<GuideContent>(content);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // 관리자 권한 체크
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/session');
        const session = await response.json();
        
        if (session?.user) {
          const adminEmails = ['admin@gameplaza.kr', 'ndz5496@gmail.com'];
          setIsAdmin(adminEmails.includes(session.user.email || ''));
        }
      } catch (error) {
        console.error('Failed to check auth:', error);
      }
    };
    
    checkAuth();
  }, []);

  // 콘텐츠 로드
  useEffect(() => {
    const loadContent = async () => {
      try {
        const response = await fetch('/api/admin/guide-content?pageSlug=guide');
        const data = await response.json();
        
        if (data.content) {
          setContent(data.content as GuideContent);
          setEditingContent(data.content as GuideContent);
        }
      } catch (error) {
        console.error('Failed to load content:', error);
      }
    };
    
    loadContent();
  }, []);

  // 콘텐츠 저장
  const saveContent = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/admin/guide-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pageSlug: 'guide',
          content: editingContent
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || '저장 실패');
      }
      
      console.log('Save successful:', data);
      setContent(editingContent);
      setIsEditing(false);
      alert('저장되었습니다.');
    } catch (error: any) {
      console.error('Failed to save content:', error);
      alert(`저장에 실패했습니다: ${error.message || '알 수 없는 오류'}`);
    } finally {
      setIsSaving(false);
    }
  };

  // 편집 취소
  const cancelEdit = () => {
    setEditingContent(content);
    setIsEditing(false);
  };

  // 텍스트 편집 헬퍼
  const updateText = (path: string, value: string) => {
    const keys = path.split('.');
    const newContent = { ...editingContent };
    let current: any = newContent;
    
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (key !== undefined) {
        current = current[key];
      }
    }
    
    const lastKey = keys[keys.length - 1];
    if (lastKey !== undefined) {
      current[lastKey] = value;
    }
    setEditingContent(newContent);
  };

  // 배열 편집 헬퍼
  const updateArray = (path: string, index: number, value: string) => {
    const keys = path.split('.');
    const newContent = { ...editingContent };
    let current: any = newContent;
    
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      if (key !== undefined) {
        current = current[key];
      }
    }
    
    current[index] = value;
    setEditingContent(newContent);
  };

  // 배열 아이템 추가
  const addArrayItem = (path: string) => {
    const keys = path.split('.');
    const newContent = { ...editingContent };
    let current: any = newContent;
    
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      if (key !== undefined) {
        current = current[key];
      }
    }
    
    current.push('');
    setEditingContent(newContent);
  };

  // 배열 아이템 삭제
  const removeArrayItem = (path: string, index: number) => {
    const keys = path.split('.');
    const newContent = { ...editingContent };
    let current: any = newContent;
    
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      if (key !== undefined) {
        current = current[key];
      }
    }
    
    current.splice(index, 1);
    setEditingContent(newContent);
  };

  // 서비스 편집 헬퍼
  const updateService = (index: number, field: string, value: string) => {
    const newServices = [...editingContent.services];
    const currentService = newServices[index];
    if (currentService) {
      newServices[index] = { ...currentService, [field]: value };
      setEditingContent({ ...editingContent, services: newServices });
    }
  };

  const getIcon = (iconName: string) => {
    const icons: { [key: string]: any } = {
      Users,
      Calendar,
      CreditCard,
      Gift
    };
    const Icon = icons[iconName] || Users;
    return <Icon className="w-5 h-5 text-gray-500 mt-0.5" />;
  };

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* 페이지 헤더 */}
      <section className="bg-white dark:bg-gray-900 py-8 px-5 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold dark:text-white">오락실 이용안내</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">광주 게임플라자의 모든 것을 안내드립니다</p>
          </div>
          {isAdmin && (
            <div>
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                  편집
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={cancelEdit}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                    취소
                  </button>
                  <button
                    onClick={saveContent}
                    disabled={isSaving}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    {isSaving ? '저장 중...' : '저장'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-5 py-8 space-y-8">
        {/* 영업 정보 */}
        <section className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800">
          <h2 className="text-xl font-bold mb-4 dark:text-white">영업 정보</h2>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-gray-500 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium dark:text-white">영업시간</p>
                {isEditing ? (
                  <input
                    type="text"
                    value={editingContent.hours}
                    onChange={(e) => updateText('hours', e.target.value)}
                    className="w-full mt-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                ) : (
                  <p className="text-gray-600 dark:text-gray-400">{content.hours}</p>
                )}
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-gray-500 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium dark:text-white">위치</p>
                {isEditing ? (
                  <input
                    type="text"
                    value={editingContent.address}
                    onChange={(e) => updateText('address', e.target.value)}
                    className="w-full mt-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                ) : (
                  <p className="text-gray-600 dark:text-gray-400">{content.address}</p>
                )}
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Phone className="w-5 h-5 text-gray-500 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium dark:text-white">연락처</p>
                {isEditing ? (
                  <input
                    type="text"
                    value={editingContent.phone}
                    onChange={(e) => updateText('phone', e.target.value)}
                    className="w-full mt-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                ) : (
                  <p className="text-gray-600 dark:text-gray-400">{content.phone}</p>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* 이용 요금 */}
        <section className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800">
          <h2 className="text-xl font-bold mb-4 dark:text-white">이용 요금</h2>
          
          {/* 일반 이용 */}
          <div className="mb-6">
            <h3 className="font-semibold mb-3 dark:text-white flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              일반 이용 (자유 이용)
            </h3>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">리듬게임</span>
                {isEditing ? (
                  <input
                    type="text"
                    value={editingContent.prices.rhythm}
                    onChange={(e) => updateText('prices.rhythm', e.target.value)}
                    className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                ) : (
                  <span className="font-medium dark:text-white">{content.prices.rhythm}</span>
                )}
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">아케이드게임</span>
                {isEditing ? (
                  <input
                    type="text"
                    value={editingContent.prices.arcade}
                    onChange={(e) => updateText('prices.arcade', e.target.value)}
                    className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                ) : (
                  <span className="font-medium dark:text-white">{content.prices.arcade}</span>
                )}
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">대전게임</span>
                {isEditing ? (
                  <input
                    type="text"
                    value={editingContent.prices.fighting}
                    onChange={(e) => updateText('prices.fighting', e.target.value)}
                    className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                ) : (
                  <span className="font-medium dark:text-white">{content.prices.fighting}</span>
                )}
              </div>
            </div>
          </div>

          {/* 대여 예약 */}
          <div>
            <h3 className="font-semibold mb-3 dark:text-white flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              대여 예약 (기기별 시간대)
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              대여 가능 기종: 마이마이, 츄니즘, 발키리, 라이트닝
            </p>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">조기영업 시간대</span>
                {isEditing ? (
                  <input
                    type="text"
                    value={editingContent.prices.rental_early}
                    onChange={(e) => updateText('prices.rental_early', e.target.value)}
                    className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                ) : (
                  <span className="font-medium dark:text-white">{content.prices.rental_early}</span>
                )}
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">일반 영업 시간대</span>
                {isEditing ? (
                  <input
                    type="text"
                    value={editingContent.prices.rental_normal}
                    onChange={(e) => updateText('prices.rental_normal', e.target.value)}
                    className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                ) : (
                  <span className="font-medium dark:text-white">{content.prices.rental_normal}</span>
                )}
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">밤샘영업 시간대</span>
                {isEditing ? (
                  <input
                    type="text"
                    value={editingContent.prices.rental_overnight}
                    onChange={(e) => updateText('prices.rental_overnight', e.target.value)}
                    className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                ) : (
                  <span className="font-medium dark:text-white">{content.prices.rental_overnight}</span>
                )}
              </div>
            </div>
            <a 
              href="/guide/reservation" 
              className="inline-flex items-center gap-1 text-sm text-gray-900 dark:text-white font-medium mt-3 hover:underline"
            >
              예약 방법 자세히 보기
              <ChevronRight className="w-4 h-4" />
            </a>
          </div>
        </section>

        {/* 시설 안내 */}
        <section className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800">
          <h2 className="text-xl font-bold mb-4 dark:text-white">시설 안내</h2>
          
          <div className="grid gap-4 md:grid-cols-2">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <h3 className="font-semibold mb-2 dark:text-white">리듬게임 Zone</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">최신 리듬게임 20대 보유</p>
              <ul className="text-sm text-gray-500 dark:text-gray-500 space-y-1">
                {(isEditing ? editingContent : content).facilities.rhythm.map((item, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <span>•</span>
                    {isEditing ? (
                      <div className="flex-1 flex items-center gap-1">
                        <input
                          type="text"
                          value={item}
                          onChange={(e) => updateArray('facilities.rhythm', index, e.target.value)}
                          className="flex-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                        />
                        <button
                          onClick={() => removeArrayItem('facilities.rhythm', index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <span>{item}</span>
                    )}
                  </li>
                ))}
                {isEditing && (
                  <button
                    onClick={() => addArrayItem('facilities.rhythm')}
                    className="text-sm text-blue-600 hover:text-blue-700 mt-2"
                  >
                    + 항목 추가
                  </button>
                )}
              </ul>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <h3 className="font-semibold mb-2 dark:text-white">아케이드 Zone</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">클래식 & 최신 아케이드</p>
              <ul className="text-sm text-gray-500 dark:text-gray-500 space-y-1">
                {(isEditing ? editingContent : content).facilities.arcade.map((item, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <span>•</span>
                    {isEditing ? (
                      <div className="flex-1 flex items-center gap-1">
                        <input
                          type="text"
                          value={item}
                          onChange={(e) => updateArray('facilities.arcade', index, e.target.value)}
                          className="flex-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                        />
                        <button
                          onClick={() => removeArrayItem('facilities.arcade', index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <span>{item}</span>
                    )}
                  </li>
                ))}
                {isEditing && (
                  <button
                    onClick={() => addArrayItem('facilities.arcade')}
                    className="text-sm text-blue-600 hover:text-blue-700 mt-2"
                  >
                    + 항목 추가
                  </button>
                )}
              </ul>
            </div>
          </div>

          <div className="mt-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
            <h3 className="font-semibold mb-2 text-blue-900 dark:text-blue-300">편의시설</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm text-blue-700 dark:text-blue-400">
              {(isEditing ? editingContent : content).facilities.amenities.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span>•</span>
                  {isEditing ? (
                    <div className="flex-1 flex items-center gap-1">
                      <input
                        type="text"
                        value={item}
                        onChange={(e) => updateArray('facilities.amenities', index, e.target.value)}
                        className="flex-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                      />
                      <button
                        onClick={() => removeArrayItem('facilities.amenities', index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <span>{item}</span>
                  )}
                </div>
              ))}
              {isEditing && (
                <button
                  onClick={() => addArrayItem('facilities.amenities')}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  + 항목 추가
                </button>
              )}
            </div>
          </div>
        </section>

        {/* 이용 규칙 */}
        <section className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800">
          <h2 className="text-xl font-bold mb-4 dark:text-white flex items-center gap-2">
            <Shield className="w-5 h-5" />
            이용 규칙
          </h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2 dark:text-white">기본 예절</h3>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                {(isEditing ? editingContent : content).rules.basic.map((item, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <span>•</span>
                    {isEditing ? (
                      <div className="flex-1 flex items-center gap-1">
                        <input
                          type="text"
                          value={item}
                          onChange={(e) => updateArray('rules.basic', index, e.target.value)}
                          className="flex-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                        />
                        <button
                          onClick={() => removeArrayItem('rules.basic', index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <span>{item}</span>
                    )}
                  </li>
                ))}
                {isEditing && (
                  <button
                    onClick={() => addArrayItem('rules.basic')}
                    className="text-sm text-blue-600 hover:text-blue-700 mt-2"
                  >
                    + 항목 추가
                  </button>
                )}
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2 dark:text-white">금지 사항</h3>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                {(isEditing ? editingContent : content).rules.prohibited.map((item, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <span>•</span>
                    {isEditing ? (
                      <div className="flex-1 flex items-center gap-1">
                        <input
                          type="text"
                          value={item}
                          onChange={(e) => updateArray('rules.prohibited', index, e.target.value)}
                          className="flex-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                        />
                        <button
                          onClick={() => removeArrayItem('rules.prohibited', index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <span>{item}</span>
                    )}
                  </li>
                ))}
                {isEditing && (
                  <button
                    onClick={() => addArrayItem('rules.prohibited')}
                    className="text-sm text-blue-600 hover:text-blue-700 mt-2"
                  >
                    + 항목 추가
                  </button>
                )}
              </ul>
            </div>

            <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
              <h3 className="font-semibold mb-2 text-red-900 dark:text-red-300">안전 수칙</h3>
              <ul className="text-sm text-red-700 dark:text-red-400 space-y-1">
                {(isEditing ? editingContent : content).rules.safety.map((item, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <span>•</span>
                    {isEditing ? (
                      <div className="flex-1 flex items-center gap-1">
                        <input
                          type="text"
                          value={item}
                          onChange={(e) => updateArray('rules.safety', index, e.target.value)}
                          className="flex-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                        />
                        <button
                          onClick={() => removeArrayItem('rules.safety', index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <span>{item}</span>
                    )}
                  </li>
                ))}
                {isEditing && (
                  <button
                    onClick={() => addArrayItem('rules.safety')}
                    className="text-sm text-blue-600 hover:text-blue-700 mt-2"
                  >
                    + 항목 추가
                  </button>
                )}
              </ul>
            </div>
          </div>
        </section>

        {/* 특별 서비스 */}
        <section className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800">
          <h2 className="text-xl font-bold mb-4 dark:text-white flex items-center gap-2">
            <Gift className="w-5 h-5" />
            특별 서비스
          </h2>
          
          <div className="grid gap-3 md:grid-cols-2">
            {(isEditing ? editingContent : content).services.map((service, index) => (
              <div key={index} className="flex items-start gap-3">
                {getIcon(service.icon)}
                <div className="flex-1">
                  {isEditing ? (
                    <>
                      <input
                        type="text"
                        value={service.title}
                        onChange={(e) => updateService(index, 'title', e.target.value)}
                        className="w-full mb-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-medium"
                        placeholder="제목"
                      />
                      <input
                        type="text"
                        value={service.description}
                        onChange={(e) => updateService(index, 'description', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-sm"
                        placeholder="설명"
                      />
                    </>
                  ) : (
                    <>
                      <p className="font-medium dark:text-white">{service.title}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{service.description}</p>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <div className="text-center py-8">
          <p className="text-gray-600 dark:text-gray-400 mb-4">게임을 예약하고 싶으신가요?</p>
          <a 
            href="/reservations/new" 
            className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
          >
            지금 예약하기
            <ChevronRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    </main>
  );
}