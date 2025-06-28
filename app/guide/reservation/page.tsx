// 예약 이용안내 페이지
// 비전공자 설명: 예약 시스템 사용 방법을 상세히 안내하는 페이지입니다
'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, Clock, Calendar, CreditCard, AlertCircle, CheckCircle, XCircle, Edit2, Save, X, Plus, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type ReservationContent = {
  timeSlots: Array<{
    name: string;
    time: string;
  }>;
  reservationSteps: Array<{
    title: string;
    details: string[];
  }>;
  cancellationPolicy: Array<{
    icon: string;
    title: string;
    description: string;
    type: 'success' | 'warning' | 'error';
  }>;
  penalties: string[];
  checkIn: {
    steps: string[];
    payment: Array<{
      method: string;
      description?: string;
      steps?: string[];
    }>;
  };
  faqs: Array<{
    question: string;
    answer: string;
  }>;
};

export default function ReservationGuidePage() {
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [content, setContent] = useState<ReservationContent>({
    timeSlots: [
      { name: '조기영업', time: '07:00~12:00 (5시간)' },
      { name: '주간영업', time: '12:00~18:00 (6시간)' },
      { name: '야간영업', time: '18:00~24:00 (6시간)' },
      { name: '밤샘영업', time: '24:00~07:00 (7시간)' }
    ],
    reservationSteps: [
      {
        title: '회원가입',
        details: ['구글 계정으로 간편 로그인', '전화번호 인증 (SMS)', '닉네임 설정']
      },
      {
        title: '예약 신청',
        details: ['원하는 날짜 선택', '원하는 기기 종류 선택 (마이마이, 츄니즘, 발키리, 라이트닝)', '예약 가능 시간대 확인', '원하는 시간대와 대수 선택', '옵션 선택 (마이마이 2P: +10,000원)', '예약 신청 완료']
      },
      {
        title: '예약 확인',
        details: ['관리자 승인 대기 (평균 30분 이내)', '승인/거절 시 즉시 알림', '마이페이지에서 예약 상태 확인']
      }
    ],
    cancellationPolicy: [
      { icon: 'CheckCircle', title: '이용 24시간 전', description: '무료 취소 가능', type: 'success' },
      { icon: 'AlertCircle', title: '이용 24시간~6시간 전', description: '50% 취소 수수료', type: 'warning' },
      { icon: 'XCircle', title: '이용 6시간 이내', description: '취소 불가', type: 'error' }
    ],
    penalties: ['노쇼 2회: 1개월 예약 제한', '노쇼 3회: 블랙리스트 등록', '악의적 이용: 영구 이용 제한'],
    checkIn: {
      steps: ['예약 시간 10분 전부터 체크인 가능', '카운터에서 예약 확인', '기기 번호 배정', '결제 진행'],
      payment: [
        { method: '현금 결제', description: '카운터에서 직접 결제' },
        { method: '계좌이체', steps: ['체크인 시 계좌정보 알림 수신', '알림 클릭하여 계좌번호 복사', '이체 완료 후 확인'] }
      ]
    },
    faqs: [
      { question: '예약 없이도 이용 가능한가요?', answer: '네, 가능합니다. 예약은 대여 시에만 필요하며, 일반 이용은 자유롭게 가능합니다.' },
      { question: '친구와 함께 예약하고 싶어요.', answer: '각자 개별 예약을 하시되, 메모란에 함께 이용 희망을 적어주세요. 관리자가 확인 후 최대한 인접한 기기로 배정해드립니다.' },
      { question: '예약 승인은 얼마나 걸리나요?', answer: '보통 30분 이내 처리되며, 영업시간 외 신청은 다음 영업일에 처리됩니다.' },
      { question: '기기가 고장나면 어떻게 하나요?', answer: '즉시 직원에게 알려주시면 다른 기기로 변경해드립니다. 이용 시간은 보장됩니다.' },
      { question: '예약 시간을 연장할 수 있나요?', answer: '다음 예약이 없는 경우에만 현장에서 연장 가능합니다. 추가 요금이 발생합니다.' }
    ]
  });

  const [editingContent, setEditingContent] = useState<ReservationContent>(content);

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
        const response = await fetch('/api/admin/guide-content?pageSlug=guide/reservation');
        const data = await response.json();
        
        if (data.content) {
          setContent(data.content as ReservationContent);
          setEditingContent(data.content as ReservationContent);
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
          pageSlug: 'guide/reservation',
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

  // 시간대 편집
  const updateTimeSlot = (index: number, field: 'name' | 'time', value: string) => {
    const newTimeSlots = [...editingContent.timeSlots];
    const currentSlot = newTimeSlots[index];
    if (currentSlot) {
      newTimeSlots[index] = { ...currentSlot, [field]: value };
      setEditingContent({ ...editingContent, timeSlots: newTimeSlots });
    }
  };

  const addTimeSlot = () => {
    setEditingContent({
      ...editingContent,
      timeSlots: [...editingContent.timeSlots, { name: '', time: '' }]
    });
  };

  const removeTimeSlot = (index: number) => {
    const newTimeSlots = editingContent.timeSlots.filter((_, i) => i !== index);
    setEditingContent({ ...editingContent, timeSlots: newTimeSlots });
  };

  // 예약 단계 편집
  const updateStepDetail = (stepIndex: number, detailIndex: number, value: string) => {
    const newSteps = [...editingContent.reservationSteps];
    const step = newSteps[stepIndex];
    if (step && step.details) {
      step.details[detailIndex] = value;
      setEditingContent({ ...editingContent, reservationSteps: newSteps });
    }
  };

  const addStepDetail = (stepIndex: number) => {
    const newSteps = [...editingContent.reservationSteps];
    const step = newSteps[stepIndex];
    if (step && step.details) {
      step.details.push('');
      setEditingContent({ ...editingContent, reservationSteps: newSteps });
    }
  };

  const removeStepDetail = (stepIndex: number, detailIndex: number) => {
    const newSteps = [...editingContent.reservationSteps];
    const step = newSteps[stepIndex];
    if (step && step.details) {
      step.details = step.details.filter((_, i) => i !== detailIndex);
      setEditingContent({ ...editingContent, reservationSteps: newSteps });
    }
  };

  // 취소 정책 편집
  const updateCancellationPolicy = (index: number, field: string, value: string) => {
    const newPolicy = [...editingContent.cancellationPolicy];
    const currentPolicy = newPolicy[index];
    if (currentPolicy) {
      newPolicy[index] = { ...currentPolicy, [field]: value };
      setEditingContent({ ...editingContent, cancellationPolicy: newPolicy });
    }
  };

  // 패널티 편집
  const updatePenalty = (index: number, value: string) => {
    const newPenalties = [...editingContent.penalties];
    if (index >= 0 && index < newPenalties.length) {
      newPenalties[index] = value;
      setEditingContent({ ...editingContent, penalties: newPenalties });
    }
  };

  const addPenalty = () => {
    setEditingContent({
      ...editingContent,
      penalties: [...editingContent.penalties, '']
    });
  };

  const removePenalty = (index: number) => {
    const newPenalties = editingContent.penalties.filter((_, i) => i !== index);
    setEditingContent({ ...editingContent, penalties: newPenalties });
  };

  // 체크인 단계 편집
  const updateCheckInStep = (index: number, value: string) => {
    const newCheckIn = { ...editingContent.checkIn };
    if (index >= 0 && index < newCheckIn.steps.length) {
      newCheckIn.steps[index] = value;
      setEditingContent({ ...editingContent, checkIn: newCheckIn });
    }
  };

  const addCheckInStep = () => {
    const newCheckIn = { ...editingContent.checkIn };
    newCheckIn.steps.push('');
    setEditingContent({ ...editingContent, checkIn: newCheckIn });
  };

  const removeCheckInStep = (index: number) => {
    const newCheckIn = { ...editingContent.checkIn };
    newCheckIn.steps = newCheckIn.steps.filter((_, i) => i !== index);
    setEditingContent({ ...editingContent, checkIn: newCheckIn });
  };

  // FAQ 편집
  const updateFaq = (index: number, field: 'question' | 'answer', value: string) => {
    const newFaqs = [...editingContent.faqs];
    const currentFaq = newFaqs[index];
    if (currentFaq) {
      newFaqs[index] = { ...currentFaq, [field]: value };
      setEditingContent({ ...editingContent, faqs: newFaqs });
    }
  };

  const addFaq = () => {
    setEditingContent({
      ...editingContent,
      faqs: [...editingContent.faqs, { question: '', answer: '' }]
    });
  };

  const removeFaq = (index: number) => {
    const newFaqs = editingContent.faqs.filter((_, i) => i !== index);
    setEditingContent({ ...editingContent, faqs: newFaqs });
  };

  const toggleFaq = (id: string) => {
    setExpandedFaq(expandedFaq === id ? null : id);
  };

  const getIcon = (iconName: string, className: string = "") => {
    const icons: { [key: string]: any } = {
      CheckCircle,
      AlertCircle,
      XCircle
    };
    const Icon = icons[iconName] || AlertCircle;
    return <Icon className={className} />;
  };

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* 페이지 헤더 */}
      <section className="bg-white dark:bg-gray-900 py-8 px-5 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold dark:text-white">예약 안내</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">게임기 대여 예약 방법과 주의사항을 안내드립니다</p>
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
        {/* 예약 시스템 소개 */}
        <section className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800">
          <h2 className="text-xl font-bold mb-4 dark:text-white">예약 시스템 소개</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            광주 게임플라자는 편리한 웹 예약 시스템을 운영합니다.
          </p>
          <div className="grid gap-3 md:grid-cols-3">
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <Clock className="w-8 h-8 mx-auto mb-2 text-gray-700 dark:text-gray-300" />
              <p className="font-medium dark:text-white">24시간 예약</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">언제든 예약 가능</p>
            </div>
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <Calendar className="w-8 h-8 mx-auto mb-2 text-gray-700 dark:text-gray-300" />
              <p className="font-medium dark:text-white">실시간 현황</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">예약 상태 즉시 확인</p>
            </div>
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <CreditCard className="w-8 h-8 mx-auto mb-2 text-gray-700 dark:text-gray-300" />
              <p className="font-medium dark:text-white">모바일 최적화</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">PWA 지원</p>
            </div>
          </div>
        </section>

        {/* 예약 가능 시간대 */}
        <section className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800">
          <h2 className="text-xl font-bold mb-4 dark:text-white">예약 가능 시간대</h2>
          
          <div className="mb-4">
            <h3 className="font-semibold mb-3 dark:text-white">기본 시간대</h3>
            <div className="grid gap-2 md:grid-cols-2">
              {(isEditing ? editingContent : content).timeSlots.map((slot, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  {isEditing ? (
                    <>
                      <input
                        type="text"
                        value={slot.name}
                        onChange={(e) => updateTimeSlot(index, 'name', e.target.value)}
                        className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white mr-2"
                        placeholder="시간대 이름"
                      />
                      <input
                        type="text"
                        value={slot.time}
                        onChange={(e) => updateTimeSlot(index, 'time', e.target.value)}
                        className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white flex-1"
                        placeholder="시간 정보"
                      />
                      <button
                        onClick={() => removeTimeSlot(index)}
                        className="ml-2 text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="text-gray-600 dark:text-gray-400">{slot.name}</span>
                      <span className="font-medium dark:text-white">{slot.time}</span>
                    </>
                  )}
                </div>
              ))}
              {isEditing && (
                <button
                  onClick={addTimeSlot}
                  className="p-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-500 hover:text-gray-700 hover:border-gray-400 transition-colors"
                >
                  <Plus className="w-5 h-5 mx-auto" />
                </button>
              )}
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
            <h3 className="font-semibold mb-2 text-blue-900 dark:text-blue-300">커스텀 시간대</h3>
            <p className="text-sm text-blue-700 dark:text-blue-400">
              관리자가 특별히 설정한 시간대를 선택할 수 있습니다.<br />
              예시: 08:00~12:00, 14:00~20:00, 10:00~16:00 등
            </p>
          </div>
        </section>

        {/* 예약 방법 */}
        <section className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800">
          <h2 className="text-xl font-bold mb-4 dark:text-white">예약 방법</h2>
          
          {(isEditing ? editingContent : content).reservationSteps.map((step, stepIndex) => (
            <div key={stepIndex} className="mb-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-full flex items-center justify-center font-bold">
                  {stepIndex + 1}
                </div>
                <h3 className="font-semibold dark:text-white">{step.title}</h3>
              </div>
              <div className="ml-11 space-y-2 text-sm text-gray-600 dark:text-gray-400">
                {step.details.map((detail, detailIndex) => (
                  <div key={detailIndex} className="flex items-center gap-2">
                    {isEditing ? (
                      <>
                        <input
                          type="text"
                          value={detail}
                          onChange={(e) => updateStepDetail(stepIndex, detailIndex, e.target.value)}
                          className="flex-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                        <button
                          onClick={() => removeStepDetail(stepIndex, detailIndex)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <p>{detailIndex === step.details.length - 1 ? '• ' : `${detailIndex + 1}. `}{detail}</p>
                    )}
                  </div>
                ))}
                {isEditing && (
                  <button
                    onClick={() => addStepDetail(stepIndex)}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    + 항목 추가
                  </button>
                )}
              </div>
            </div>
          ))}
        </section>

        {/* 예약 규칙 */}
        <section className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800">
          <h2 className="text-xl font-bold mb-4 dark:text-white">예약 규칙</h2>
          
          {/* 24시간 룰 */}
          <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <h3 className="font-semibold mb-2 text-yellow-900 dark:text-yellow-300 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              24시간 룰
            </h3>
            <ul className="text-sm text-yellow-800 dark:text-yellow-400 space-y-1">
              <li>• 1인당 24시간 내 1회 예약만 가능</li>
              <li>• 이용 완료 후 24시간 뒤부터 다음 예약 가능</li>
              <li>• 취소 시에도 24시간 룰 적용</li>
            </ul>
          </div>

          {/* 예약 변경/취소 */}
          <div className="mb-6">
            <h3 className="font-semibold mb-3 dark:text-white">예약 변경/취소</h3>
            <div className="space-y-2">
              {(isEditing ? editingContent : content).cancellationPolicy.map((policy, index) => (
                <div key={index} className="flex items-start gap-3">
                  {getIcon(policy.icon, `w-5 h-5 mt-0.5 ${
                    policy.type === 'success' ? 'text-green-600 dark:text-green-400' :
                    policy.type === 'warning' ? 'text-yellow-600 dark:text-yellow-400' :
                    'text-red-600 dark:text-red-400'
                  }`)}
                  <div className="flex-1">
                    {isEditing ? (
                      <>
                        <input
                          type="text"
                          value={policy.title}
                          onChange={(e) => updateCancellationPolicy(index, 'title', e.target.value)}
                          className="w-full mb-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-medium"
                          placeholder="제목"
                        />
                        <input
                          type="text"
                          value={policy.description}
                          onChange={(e) => updateCancellationPolicy(index, 'description', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-sm"
                          placeholder="설명"
                        />
                      </>
                    ) : (
                      <>
                        <p className="font-medium dark:text-white">{policy.title}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{policy.description}</p>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 패널티 */}
          <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
            <h3 className="font-semibold mb-2 text-red-900 dark:text-red-300">패널티</h3>
            <ul className="text-sm text-red-800 dark:text-red-400 space-y-1">
              {(isEditing ? editingContent : content).penalties.map((penalty, index) => (
                <li key={index} className="flex items-center gap-2">
                  <span>•</span>
                  {isEditing ? (
                    <>
                      <input
                        type="text"
                        value={penalty}
                        onChange={(e) => updatePenalty(index, e.target.value)}
                        className="flex-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                      <button
                        onClick={() => removePenalty(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <span>{penalty}</span>
                  )}
                </li>
              ))}
              {isEditing && (
                <button
                  onClick={addPenalty}
                  className="text-sm text-blue-600 hover:text-blue-700 mt-2"
                >
                  + 항목 추가
                </button>
              )}
            </ul>
          </div>
        </section>

        {/* 체크인 및 결제 */}
        <section className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800">
          <h2 className="text-xl font-bold mb-4 dark:text-white">체크인 및 결제</h2>
          
          <div className="mb-6">
            <h3 className="font-semibold mb-3 dark:text-white">체크인 절차</h3>
            <ol className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              {(isEditing ? editingContent : content).checkIn.steps.map((step, index) => (
                <li key={index} className="flex items-center gap-2">
                  {!isEditing && <span>{index + 1}.</span>}
                  {isEditing ? (
                    <>
                      <input
                        type="text"
                        value={step}
                        onChange={(e) => updateCheckInStep(index, e.target.value)}
                        className="flex-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                      <button
                        onClick={() => removeCheckInStep(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <span>{step}</span>
                  )}
                </li>
              ))}
              {isEditing && (
                <button
                  onClick={addCheckInStep}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  + 항목 추가
                </button>
              )}
            </ol>
          </div>

          <div>
            <h3 className="font-semibold mb-3 dark:text-white">결제 방법</h3>
            <div className="grid gap-3 md:grid-cols-2">
              {content.checkIn.payment.map((method, index) => (
                <div key={index} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="font-medium mb-2 dark:text-white">{method.method}</p>
                  {method.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">{method.description}</p>
                  )}
                  {method.steps && (
                    <ol className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                      {method.steps.map((step, stepIndex) => (
                        <li key={stepIndex}>{stepIndex + 1}. {step}</li>
                      ))}
                    </ol>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800">
          <h2 className="text-xl font-bold mb-4 dark:text-white">자주 묻는 질문</h2>
          
          <div className="space-y-2">
            {(isEditing ? editingContent : content).faqs.map((faq, index) => (
              <div key={index} className="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
                {isEditing ? (
                  <div className="p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={faq.question}
                        onChange={(e) => updateFaq(index, 'question', e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-medium"
                        placeholder="질문"
                      />
                      <button
                        onClick={() => removeFaq(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                    <textarea
                      value={faq.answer}
                      onChange={(e) => updateFaq(index, 'answer', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      placeholder="답변"
                      rows={2}
                    />
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => toggleFaq(`faq-${index}`)}
                      className="w-full px-4 py-3 text-left flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <span className="font-medium dark:text-white">{faq.question}</span>
                      <ChevronDown 
                        className={`w-5 h-5 text-gray-500 transition-transform ${
                          expandedFaq === `faq-${index}` ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                    <AnimatePresence>
                      {expandedFaq === `faq-${index}` && (
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: 'auto' }}
                          exit={{ height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800">
                            {faq.answer}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </>
                )}
              </div>
            ))}
            {isEditing && (
              <button
                onClick={addFaq}
                className="w-full p-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-500 hover:text-gray-700 hover:border-gray-400 transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5" />
                FAQ 추가
              </button>
            )}
          </div>
        </section>

        {/* CTA */}
        <div className="text-center py-8">
          <p className="text-gray-600 dark:text-gray-400 mb-4">준비되셨나요?</p>
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