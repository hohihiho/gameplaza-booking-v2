'use client';

import { useState, useEffect } from 'react';
import { FileText, Plus, Edit, Trash2, Calendar, Save, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type TermsType = 'terms_of_service' | 'privacy_policy';

type Terms = {
  id: string;
  type: TermsType;
  title: string;
  content: string;
  version: string;
  effective_date: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
};

// 로컬 스토리지 키
const STORAGE_KEY = 'gameplaza_terms';

// 기본 약관 내용
const defaultTerms: Terms[] = [
  {
    id: '1',
    type: 'terms_of_service',
    title: '서비스 이용약관',
    content: `제1조 (목적)
이 약관은 게임플라자(이하 "회사")가 제공하는 게임장 예약 서비스(이하 "서비스")의 이용조건 및 절차, 회사와 회원 간의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.

제2조 (회원가입)
① 회원가입은 이용자가 약관의 내용에 대하여 동의를 한 다음 회원가입신청을 하고 회사가 이러한 신청에 대하여 승낙함으로써 완료됩니다.
② 회사는 다음 각호에 해당하는 신청에 대하여는 승낙을 하지 않을 수 있습니다.
- 타인의 명의를 이용한 경우
- 허위의 정보를 기재하거나, 회사가 제시하는 내용을 기재하지 않은 경우
- 14세 미만 아동이 신청한 경우

제3조 (예약 및 이용)
① 회원은 서비스를 통해 게임 기기를 예약할 수 있습니다.
② 예약은 선착순으로 진행되며, 예약 가능 시간은 오픈 시간부터 마감 시간까지입니다.
③ 예약 후 10분 이내에 도착하지 않을 경우 자동으로 취소될 수 있습니다.
④ 무단 불참(No-show)이 반복될 경우 서비스 이용이 제한될 수 있습니다.

제4조 (요금 및 결제)
① 기본 이용요금은 시간당 1,000원입니다.
② 프리미엄 기기의 경우 추가 요금이 발생할 수 있습니다.
③ 결제는 현장에서 현금 또는 카드로 가능합니다.

제5조 (회원의 의무)
회원은 다음 각호의 행위를 하여서는 안됩니다:
- 타인의 정보를 도용하는 행위
- 서비스의 운영을 고의로 방해하는 행위
- 기기를 고의로 파손하거나 훼손하는 행위
- 다른 이용자의 서비스 이용을 방해하는 행위
- 관계 법령에 위반되는 행위

제6조 (서비스 이용제한)
회사는 회원이 이 약관의 의무를 위반하거나 서비스의 정상적인 운영을 방해한 경우, 경고, 일시정지, 영구이용정지 등으로 서비스 이용을 단계적으로 제한할 수 있습니다.

제7조 (면책조항)
① 회사는 천재지변 또는 이에 준하는 불가항력으로 인하여 서비스를 제공할 수 없는 경우에는 서비스 제공에 관한 책임이 면제됩니다.
② 회사는 회원의 귀책사유로 인한 서비스 이용의 장애에 대하여는 책임을 지지 않습니다.`,
    version: '1.0',
    effective_date: '2025-01-01',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    is_active: true
  },
  {
    id: '2',
    type: 'privacy_policy',
    title: '개인정보 처리방침',
    content: `1. 수집하는 개인정보
필수 수집 항목:
- 이메일 주소 (구글 로그인 시 자동 수집)
- 닉네임
- 휴대전화번호
- 이름 (구글 계정에서 제공 시)

2. 개인정보 수집 및 이용 목적
- 회원 가입 및 관리
- 예약 서비스 제공 및 관리
- 본인 확인 및 인증
- 고지사항 전달 및 불만 처리
- 서비스 이용 통계 및 분석
- 마케팅 및 이벤트 정보 제공 (동의한 경우)

3. 개인정보 보유 및 이용 기간
개인정보는 수집 및 이용 목적이 달성될 때까지 보유하며, 회원 탈퇴 시 즉시 삭제합니다.
단, 관계 법령에 따라 보존이 필요한 경우 해당 기간 동안 보관합니다.

4. 개인정보의 제3자 제공
게임플라자는 원칙적으로 이용자의 개인정보를 제3자에게 제공하지 않습니다. 
다만, 이용자가 사전에 동의한 경우나 법령의 규정에 의한 경우는 예외로 합니다.

5. 이용자의 권리
이용자는 언제든지 자신의 개인정보를 열람, 정정, 삭제, 처리정지 요구할 수 있습니다.
권리 행사는 마이페이지를 통해 하실 수 있습니다.

6. 개인정보 보호책임자
개인정보 보호책임자
성명: 홍길동
직책: 대표
연락처: privacy@gameplaza.kr`,
    version: '1.0',
    effective_date: '2025-01-01',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    is_active: true
  }
];

export default function AdminTermsPage() {
  const [terms, setTerms] = useState<Terms[]>([]);
  const [selectedType, setSelectedType] = useState<TermsType>('terms_of_service');
  const [isEditing, setIsEditing] = useState(false);
  const [editingTerms, setEditingTerms] = useState<Terms | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  // 로컬 스토리지에서 약관 불러오기
  useEffect(() => {
    const savedTerms = localStorage.getItem(STORAGE_KEY);
    if (savedTerms) {
      setTerms(JSON.parse(savedTerms));
    } else {
      // 처음 실행 시 기본 약관 설정
      setTerms(defaultTerms);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultTerms));
    }
  }, []);

  // 약관 저장
  const saveTerms = (updatedTerms: Terms[]) => {
    setTerms(updatedTerms);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedTerms));
  };

  // 현재 활성화된 약관 가져오기
  const getActiveTerms = (type: TermsType) => {
    return terms.find(t => t.type === type && t.is_active);
  };

  // 약관 생성/수정
  const handleSave = () => {
    if (!editingTerms) return;

    const now = new Date().toISOString();
    
    if (editingTerms.id) {
      // 수정
      const updatedTerms = terms.map(t => 
        t.id === editingTerms.id 
          ? { ...editingTerms, updated_at: now }
          : t
      );
      saveTerms(updatedTerms);
    } else {
      // 신규 생성
      const newTerms: Terms = {
        ...editingTerms,
        id: Date.now().toString(),
        created_at: now,
        updated_at: now
      };
      
      // 같은 타입의 기존 약관 비활성화
      const updatedTerms = terms.map(t => 
        t.type === newTerms.type && t.is_active
          ? { ...t, is_active: false }
          : t
      );
      
      saveTerms([...updatedTerms, newTerms]);
    }
    
    setIsEditing(false);
    setEditingTerms(null);
  };

  // 약관 삭제
  const handleDelete = (id: string) => {
    const updatedTerms = terms.filter(t => t.id !== id);
    saveTerms(updatedTerms);
    setShowDeleteConfirm(null);
  };

  // 약관 활성화
  const handleActivate = (id: string) => {
    const term = terms.find(t => t.id === id);
    if (!term) return;
    
    const updatedTerms = terms.map(t => ({
      ...t,
      is_active: t.id === id ? true : (t.type === term.type ? false : t.is_active)
    }));
    saveTerms(updatedTerms);
  };

  const termTypeLabels = {
    terms_of_service: '서비스 이용약관',
    privacy_policy: '개인정보 처리방침'
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* 헤더 */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold dark:text-white">약관 관리</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          서비스 이용약관과 개인정보 처리방침을 관리합니다.
        </p>
      </div>

      {/* 탭 */}
      <div className="flex gap-4 mb-6">
        {Object.entries(termTypeLabels).map(([type, label]) => (
          <button
            key={type}
            onClick={() => setSelectedType(type as TermsType)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedType === type
                ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* 현재 활성 약관 */}
      {!isEditing && (
        <div className="mb-8">
          {(() => {
            const activeTerms = getActiveTerms(selectedType);
            if (!activeTerms) {
              return (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                  <p className="text-yellow-800 dark:text-yellow-200">
                    활성화된 {termTypeLabels[selectedType]}이 없습니다.
                  </p>
                </div>
              );
            }
            
            return (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h2 className="text-xl font-semibold dark:text-white">{activeTerms.title}</h2>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-600 dark:text-gray-400">
                        <span>버전: {activeTerms.version}</span>
                        <span>시행일: {activeTerms.effective_date}</span>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                          활성
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setEditingTerms(activeTerms);
                        setIsEditing(true);
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                      수정
                    </button>
                  </div>
                  
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <pre className="whitespace-pre-wrap text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                      {activeTerms.content}
                    </pre>
                  </div>
                </div>
              </motion.div>
            );
          })()}
        </div>
      )}

      {/* 편집 폼 */}
      {isEditing && editingTerms && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-8"
        >
          <h2 className="text-xl font-semibold dark:text-white mb-6">
            {editingTerms.id ? '약관 수정' : '새 약관 작성'}
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                제목
              </label>
              <input
                type="text"
                value={editingTerms.title}
                onChange={(e) => setEditingTerms({ ...editingTerms, title: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white dark:bg-gray-900 dark:text-white"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  버전
                </label>
                <input
                  type="text"
                  value={editingTerms.version}
                  onChange={(e) => setEditingTerms({ ...editingTerms, version: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white dark:bg-gray-900 dark:text-white"
                  placeholder="예: 1.0"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  시행일
                </label>
                <input
                  type="date"
                  value={editingTerms.effective_date}
                  onChange={(e) => setEditingTerms({ ...editingTerms, effective_date: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white dark:bg-gray-900 dark:text-white"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                내용
              </label>
              <textarea
                value={editingTerms.content}
                onChange={(e) => setEditingTerms({ ...editingTerms, content: e.target.value })}
                rows={20}
                className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white dark:bg-gray-900 dark:text-white font-mono text-sm"
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={() => {
                setIsEditing(false);
                setEditingTerms(null);
              }}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              취소
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
            >
              <Save className="w-4 h-4" />
              저장
            </button>
          </div>
        </motion.div>
      )}

      {/* 버전 목록 */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold dark:text-white">버전 이력</h3>
          <button
            onClick={() => {
              setEditingTerms({
                id: '',
                type: selectedType,
                title: termTypeLabels[selectedType],
                content: '',
                version: '',
                effective_date: new Date().toISOString().split('T')[0],
                created_at: '',
                updated_at: '',
                is_active: true
              });
              setIsEditing(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
          >
            <Plus className="w-4 h-4" />
            새 버전 작성
          </button>
        </div>
        
        <div className="space-y-3">
          {terms
            .filter(t => t.type === selectedType)
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .map((term) => (
              <motion.div
                key={term.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="font-medium dark:text-white">버전 {term.version}</span>
                      {term.is_active && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                          활성
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-600 dark:text-gray-400">
                      <span>시행일: {term.effective_date}</span>
                      <span>생성일: {new Date(term.created_at).toLocaleDateString('ko-KR')}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {!term.is_active && (
                      <button
                        onClick={() => handleActivate(term.id)}
                        className="px-3 py-1.5 text-sm bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                      >
                        활성화
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setEditingTerms(term);
                        setIsEditing(true);
                      }}
                      className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(term.id)}
                      className="p-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                      disabled={term.is_active}
                    >
                      <Trash2 className={`w-4 h-4 ${term.is_active ? 'opacity-50' : ''}`} />
                    </button>
                  </div>
                </div>
                
                {/* 삭제 확인 */}
                <AnimatePresence>
                  {showDeleteConfirm === term.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700"
                    >
                      <p className="text-sm text-red-600 dark:text-red-400 mb-3">
                        이 버전을 삭제하시겠습니까?
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleDelete(term.id)}
                          className="px-3 py-1.5 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                        >
                          삭제
                        </button>
                        <button
                          onClick={() => setShowDeleteConfirm(null)}
                          className="px-3 py-1.5 text-sm bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
                        >
                          취소
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
        </div>
      </div>
    </div>
  );
}