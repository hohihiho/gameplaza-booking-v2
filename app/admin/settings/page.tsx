// 설정 페이지
// 비전공자 설명: 시스템 전반의 설정을 관리하는 페이지입니다
'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Banknote,
  Save,
  Copy,
  Edit,
  User,
  Shield,
  Upload,
  QrCode,
  X,
  Bell,
  Smartphone,
  Send
} from 'lucide-react';
import { useSession } from 'next-auth/react';

type BankAccount = {
  bank: string;
  accountNumber: string;
  accountHolder: string;
  qrCodeUrl?: string;
};

type SystemSettings = {
  bankAccount: BankAccount;
  pushNotificationTemplates: {
    // 예약 관련 알림
    reservationApproved: string;
    reservationRejected: string;
    reservationReminder1Hour: string;
    reservationReminder1Day: string;
    checkInAvailable: string;
    
    // 관리자 알림
    newReservationAdmin: string;
    paymentReceived: string;
    deviceStatusChanged: string;
    
    // 시스템 알림
    maintenanceNotice: string;
    emergencyNotice: string;
  };
};

export default function SettingsPage() {
  const { data: session } = useSession();
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [settings, setSettings] = useState<SystemSettings>({
    bankAccount: {
      bank: '',
      accountNumber: '',
      accountHolder: '',
      qrCodeUrl: ''
    },
    pushNotificationTemplates: {
      // 예약 관련 알림
      reservationApproved: '🎮 예약 승인! {date} {time} {device} 예약이 확정되었습니다.',
      reservationRejected: '❌ 예약 거절됨. {reason} 다른 시간대로 다시 예약해주세요.',
      reservationReminder1Hour: '⏰ 1시간 후 예약! {device} 이용 시간이 다가오고 있어요.',
      reservationReminder1Day: '📅 내일 예약 있음! {date} {time} {device} 예약을 잊지 마세요.',
      checkInAvailable: '✅ 체크인 가능! 지금 바로 체크인하고 게임을 시작하세요.',
      
      // 관리자 알림
      newReservationAdmin: '📝 신규 예약! {name}님이 {date} {time} {device} 예약했습니다.',
      paymentReceived: '💳 입금 확인! {name}님 예약 결제가 완료되었습니다.',
      deviceStatusChanged: '🔧 기기 상태 변경: {device}#{number}가 {status} 상태로 변경되었습니다.',
      
      // 시스템 알림
      maintenanceNotice: '🔧 시스템 점검 예정: {date} {time}에 시스템 점검이 있습니다.',
      emergencyNotice: '🚨 긴급 공지: {message}'
    }
  });

  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [tempSettings, setTempSettings] = useState<SystemSettings>(settings);
  const [isLoading, setIsLoading] = useState(false);
  // 항상 개인 계좌로 사용 (슈퍼관리자 전용)
  const [qrPreview, setQrPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // 설정 불러오기
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      // 슈퍼관리자 권한 확인
      const adminResponse = await fetch('/api/admin/check-super');
      if (adminResponse.ok) {
        const adminData = await adminResponse.json();
        setIsSuperAdmin(adminData.isSuperAdmin);
      }

      // 관리자 개인 계좌 정보 불러오기
      const bankResponse = await fetch('/api/admin/settings/bank-account');
      if (bankResponse.ok) {
        const bankData = await bankResponse.json();
        if (bankData.bankAccount) {
          setSettings(prev => ({
            ...prev,
            bankAccount: {
              bank: bankData.bankAccount.bank || '',
              accountNumber: bankData.bankAccount.account || '',
              accountHolder: bankData.bankAccount.holder || '',
              qrCodeUrl: bankData.bankAccount.qrCodeUrl || ''
            }
          }));
        }
      }

      // 푸시 알림 템플릿 불러오기 (로컬 스토리지에서)
      const savedTemplates = localStorage.getItem('pushNotificationTemplates');
      if (savedTemplates) {
        const parsedTemplates = JSON.parse(savedTemplates);
        setSettings(prev => ({
          ...prev,
          pushNotificationTemplates: parsedTemplates
        }));
      }

      // 기타 설정 불러오기 (WiFi, 운영시간 등)
      // TODO: API 구현 후 추가
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    
    try {
      if (editingSection === 'bankAccount') {
        // 계좌 정보 저장
        const response = await fetch('/api/admin/settings/bank-account', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bank: tempSettings.bankAccount.bank,
            account: tempSettings.bankAccount.accountNumber,
            holder: tempSettings.bankAccount.accountHolder,
            qrCodeUrl: tempSettings.bankAccount.qrCodeUrl,
            isPersonalAccount: true
          })
        });
        
        if (!response.ok) throw new Error('Failed to save bank account');
      } else if (editingSection === 'pushTemplates') {
        // 푸시 알림 템플릿 저장 (로컬 스토리지에 임시 저장)
        // TODO: 실제 API 구현 시 서버에 저장
        localStorage.setItem('pushNotificationTemplates', JSON.stringify(tempSettings.pushNotificationTemplates));
      }
      
      // 다른 설정 저장 로직 추가
      
      setSettings(tempSettings);
      setEditingSection(null);
      alert('설정이 저장되었습니다.');
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('설정 저장에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setTempSettings(settings);
    setEditingSection(null);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    alert(`${label}이(가) 클립보드에 복사되었습니다.`);
  };

  // 푸시 알림 테스트 함수
  const testPushNotification = async (templateKey: string, templateText: string) => {
    try {
      // Service Worker 등록 확인
      if (!('serviceWorker' in navigator)) {
        alert('이 브라우저는 푸시 알림을 지원하지 않습니다.');
        return;
      }

      // 알림 권한 요청
      if (Notification.permission === 'default') {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          alert('푸시 알림 권한이 거부되었습니다.');
          return;
        }
      } else if (Notification.permission === 'denied') {
        alert('푸시 알림 권한이 거부되어 있습니다. 브라우저 설정에서 권한을 허용해주세요.');
        return;
      }

      // 테스트용 샘플 데이터로 변수 치환
      const sampleData = {
        name: '홍길동',
        date: '2024-01-15',
        time: '14:00-16:00',
        device: 'DJMAX RESPECT V',
        reason: '이미 예약된 시간대입니다',
        number: '1',
        status: '사용 중',
        message: '시스템 업데이트가 있습니다'
      };

      // 템플릿 변수 치환
      let processedText = templateText;
      Object.entries(sampleData).forEach(([key, value]) => {
        processedText = processedText.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
      });

      // Service Worker를 통한 푸시 알림 표시
      const registration = await navigator.serviceWorker.ready;
      
      // 간단한 브라우저 알림으로 테스트 (Service Worker 푸시는 별도 설정 필요)
      new Notification('🎮 게임플라자 알림 테스트', {
        body: processedText,
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-96x96.png',
        tag: `test-${templateKey}`,
        requireInteraction: true,
        actions: [
          {
            action: 'view',
            title: '확인'
          }
        ]
      });

      alert(`푸시 알림 테스트가 전송되었습니다!\n\n내용: ${processedText}`);

    } catch (error) {
      console.error('Push notification test failed:', error);
      alert('푸시 알림 테스트에 실패했습니다. 콘솔을 확인해주세요.');
    }
  };

  // QR코드 업로드 함수
  const handleQrUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 이미지 파일 검증
    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 업로드 가능합니다.');
      return;
    }

    // 파일 크기 검증 (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('파일 크기는 5MB 이하여야 합니다.');
      return;
    }

    setIsUploading(true);
    
    try {
      // Base64로 변환하여 미리보기
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setQrPreview(result);
        setTempSettings(prev => ({
          ...prev,
          bankAccount: { ...prev.bankAccount, qrCodeUrl: result }
        }));
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('QR코드 업로드 실패:', error);
      alert('QR코드 업로드에 실패했습니다.');
    } finally {
      setIsUploading(false);
    }
  };

  // QR코드 제거 함수
  const handleQrRemove = () => {
    setQrPreview(null);
    setTempSettings(prev => ({
      ...prev,
      bankAccount: { ...prev.bankAccount, qrCodeUrl: '' }
    }));
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* 헤더 */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold dark:text-white mb-2">설정</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          시스템 설정 관리
        </p>
      </div>

      <div className="space-y-6">
        {/* 계좌 정보 설정 - 슈퍼관리자만 */}
        {isSuperAdmin && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6"
          >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Banknote className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <h2 className="text-lg font-semibold dark:text-white">계좌 정보</h2>
              <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs rounded-full flex items-center gap-1">
                <User className="w-3 h-3" />
                슈퍼관리자 전용
              </span>
            </div>
            {editingSection === 'bankAccount' ? (
              <div className="flex gap-2">
                <button
                  onClick={() => handleCancel()}
                  className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={() => handleSave()}
                  disabled={isLoading}
                  className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  저장
                </button>
              </div>
            ) : (
              <button
                onClick={() => setEditingSection('bankAccount')}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <Edit className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </button>
            )}
          </div>

          {editingSection === 'bankAccount' ? (
            <div className="space-y-4">
              {/* 계좌 안내 메시지 */}
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span className="font-medium text-blue-900 dark:text-blue-300">
                    슈퍼관리자 개인 계좌
                  </span>
                </div>
                <p className="text-sm text-blue-800 dark:text-blue-300">
                  {session?.user?.name} 관리자님의 개인 계좌로 입금받습니다
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  은행명
                </label>
                <input
                  type="text"
                  value={tempSettings.bankAccount.bank}
                  onChange={(e) => setTempSettings({
                    ...tempSettings,
                    bankAccount: { ...tempSettings.bankAccount, bank: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  계좌번호
                </label>
                <input
                  type="text"
                  value={tempSettings.bankAccount.accountNumber}
                  onChange={(e) => setTempSettings({
                    ...tempSettings,
                    bankAccount: { ...tempSettings.bankAccount, accountNumber: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  예금주
                </label>
                <input
                  type="text"
                  value={tempSettings.bankAccount.accountHolder}
                  onChange={(e) => setTempSettings({
                    ...tempSettings,
                    bankAccount: { ...tempSettings.bankAccount, accountHolder: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              {/* QR코드 업로드 섹션 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  계좌 QR코드
                </label>
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4">
                  {qrPreview || tempSettings.bankAccount.qrCodeUrl ? (
                    <div className="flex flex-col items-center gap-3">
                      <img
                        src={qrPreview || tempSettings.bankAccount.qrCodeUrl}
                        alt="QR코드 미리보기"
                        className="w-24 h-24 object-contain border border-gray-200 dark:border-gray-600 rounded-lg"
                      />
                      <div className="flex gap-2">
                        <label className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg cursor-pointer transition-colors flex items-center gap-2">
                          <Upload className="w-4 h-4" />
                          변경
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleQrUpload}
                            className="hidden"
                          />
                        </label>
                        <button
                          onClick={handleQrRemove}
                          className="px-3 py-1.5 text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors flex items-center gap-2"
                        >
                          <X className="w-4 h-4" />
                          제거
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-3 py-4">
                      <QrCode className="w-12 h-12 text-gray-400" />
                      <div className="text-center">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          체크인 시 사용할 계좌 QR코드를 업로드하세요
                        </p>
                        <label className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg cursor-pointer transition-colors flex items-center gap-2 mx-auto w-fit">
                          <Upload className="w-4 h-4" />
                          {isUploading ? '업로드 중...' : 'QR코드 업로드'}
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleQrUpload}
                            className="hidden"
                            disabled={isUploading}
                          />
                        </label>
                      </div>
                      <p className="text-xs text-gray-500">
                        JPG, PNG, GIF 형식 • 최대 5MB
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">은행</span>
                <span className="font-medium dark:text-white">{settings.bankAccount.bank}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">계좌번호</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-medium dark:text-white">
                    {settings.bankAccount.accountNumber}
                  </span>
                  <button
                    onClick={() => copyToClipboard(
                      `${settings.bankAccount.bank} ${settings.bankAccount.accountNumber}`,
                      '계좌정보'
                    )}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                  >
                    <Copy className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">예금주</span>
                <span className="font-medium dark:text-white">{settings.bankAccount.accountHolder}</span>
              </div>
            </div>
          )}
          </motion.div>
        )}


        {/* 푸시 알림 템플릿 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <h2 className="text-lg font-semibold dark:text-white">푸시 알림 템플릿</h2>
            </div>
            {editingSection === 'pushTemplates' ? (
              <div className="flex gap-2">
                <button
                  onClick={() => handleCancel()}
                  className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={() => handleSave()}
                  disabled={isLoading}
                  className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  저장
                </button>
              </div>
            ) : (
              <button
                onClick={() => setEditingSection('pushTemplates')}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <Edit className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </button>
            )}
          </div>

          {editingSection === 'pushTemplates' ? (
            <div className="space-y-6">
              {/* 예약 관련 알림 */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">📱 예약 관련 알림</h3>
                <div className="space-y-4">
                  {[
                    { key: 'reservationApproved', label: '예약 승인', variables: '{date}, {time}, {device}' },
                    { key: 'reservationRejected', label: '예약 거절', variables: '{reason}' },
                    { key: 'reservationReminder1Hour', label: '1시간 전 리마인더', variables: '{device}' },
                    { key: 'reservationReminder1Day', label: '1일 전 리마인더', variables: '{date}, {time}, {device}' },
                    { key: 'checkInAvailable', label: '체크인 가능 알림', variables: '' }
                  ].map(({ key, label, variables }) => (
                    <div key={key}>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {label}
                      </label>
                      <textarea
                        value={tempSettings.pushNotificationTemplates[key as keyof typeof tempSettings.pushNotificationTemplates]}
                        onChange={(e) => setTempSettings({
                          ...tempSettings,
                          pushNotificationTemplates: {
                            ...tempSettings.pushNotificationTemplates,
                            [key]: e.target.value
                          }
                        })}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      />
                      {variables && (
                        <p className="text-xs text-gray-500 mt-1">사용 가능한 변수: {variables}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* 관리자 알림 */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">👤 관리자 알림</h3>
                <div className="space-y-4">
                  {[
                    { key: 'newReservationAdmin', label: '신규 예약 알림', variables: '{name}, {date}, {time}, {device}' },
                    { key: 'paymentReceived', label: '입금 확인 알림', variables: '{name}' },
                    { key: 'deviceStatusChanged', label: '기기 상태 변경', variables: '{device}, {number}, {status}' }
                  ].map(({ key, label, variables }) => (
                    <div key={key}>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {label}
                      </label>
                      <textarea
                        value={tempSettings.pushNotificationTemplates[key as keyof typeof tempSettings.pushNotificationTemplates]}
                        onChange={(e) => setTempSettings({
                          ...tempSettings,
                          pushNotificationTemplates: {
                            ...tempSettings.pushNotificationTemplates,
                            [key]: e.target.value
                          }
                        })}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      />
                      <p className="text-xs text-gray-500 mt-1">사용 가능한 변수: {variables}</p>
                    </div>
                  ))}
                </div>
              </div>


              {/* 시스템 알림 */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">🔧 시스템 알림</h3>
                <div className="space-y-4">
                  {[
                    { key: 'maintenanceNotice', label: '시스템 점검 공지', variables: '{date}, {time}' },
                    { key: 'emergencyNotice', label: '긴급 공지', variables: '{message}' }
                  ].map(({ key, label, variables }) => (
                    <div key={key}>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {label}
                      </label>
                      <textarea
                        value={tempSettings.pushNotificationTemplates[key as keyof typeof tempSettings.pushNotificationTemplates]}
                        onChange={(e) => setTempSettings({
                          ...tempSettings,
                          pushNotificationTemplates: {
                            ...tempSettings.pushNotificationTemplates,
                            [key]: e.target.value
                          }
                        })}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      />
                      <p className="text-xs text-gray-500 mt-1">사용 가능한 변수: {variables}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* 예약 관련 알림 */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">📱 예약 관련 알림</h3>
                <div className="space-y-3">
                  {[
                    { key: 'reservationApproved', label: '예약 승인' },
                    { key: 'reservationRejected', label: '예약 거절' },
                    { key: 'reservationReminder1Hour', label: '1시간 전 리마인더' },
                    { key: 'reservationReminder1Day', label: '1일 전 리마인더' },
                    { key: 'checkInAvailable', label: '체크인 가능 알림' }
                  ].map(({ key, label }) => (
                    <div key={key} className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 dark:text-white text-sm">{label}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {settings.pushNotificationTemplates[key as keyof typeof settings.pushNotificationTemplates]}
                        </p>
                      </div>
                      <div className="flex gap-1 ml-2 flex-shrink-0">
                        <button
                          onClick={() => testPushNotification(
                            key,
                            settings.pushNotificationTemplates[key as keyof typeof settings.pushNotificationTemplates]
                          )}
                          className="p-1 hover:bg-blue-100 dark:hover:bg-blue-900 rounded transition-colors text-blue-600 dark:text-blue-400"
                          title="테스트 전송"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => copyToClipboard(
                            settings.pushNotificationTemplates[key as keyof typeof settings.pushNotificationTemplates],
                            label
                          )}
                          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors text-gray-600 dark:text-gray-400"
                          title="복사"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 관리자 알림 */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">👤 관리자 알림</h3>
                <div className="space-y-3">
                  {[
                    { key: 'newReservationAdmin', label: '신규 예약 알림' },
                    { key: 'paymentReceived', label: '입금 확인 알림' },
                    { key: 'deviceStatusChanged', label: '기기 상태 변경' }
                  ].map(({ key, label }) => (
                    <div key={key} className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 dark:text-white text-sm">{label}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {settings.pushNotificationTemplates[key as keyof typeof settings.pushNotificationTemplates]}
                        </p>
                      </div>
                      <button
                        onClick={() => copyToClipboard(
                          settings.pushNotificationTemplates[key as keyof typeof settings.pushNotificationTemplates],
                          label
                        )}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors ml-2 flex-shrink-0"
                      >
                        <Copy className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>


              {/* 시스템 알림 */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">🔧 시스템 알림</h3>
                <div className="space-y-3">
                  {[
                    { key: 'maintenanceNotice', label: '시스템 점검 공지' },
                    { key: 'emergencyNotice', label: '긴급 공지' }
                  ].map(({ key, label }) => (
                    <div key={key} className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 dark:text-white text-sm">{label}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {settings.pushNotificationTemplates[key as keyof typeof settings.pushNotificationTemplates]}
                        </p>
                      </div>
                      <button
                        onClick={() => copyToClipboard(
                          settings.pushNotificationTemplates[key as keyof typeof settings.pushNotificationTemplates],
                          label
                        )}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors ml-2 flex-shrink-0"
                      >
                        <Copy className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </motion.div>

        {/* PWA 및 푸시 알림 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <Smartphone className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <h2 className="text-lg font-semibold dark:text-white">PWA 및 푸시 알림</h2>
          </div>

          <div className="space-y-4">
            {/* PWA 설치 테스트 */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-blue-600" />
                  <h3 className="font-medium dark:text-white">PWA 설치</h3>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      if ('serviceWorker' in navigator) {
                        navigator.serviceWorker.getRegistration().then(reg => {
                          if (reg) {
                            alert('Service Worker가 등록되어 있습니다.');
                          } else {
                            alert('Service Worker가 등록되지 않았습니다.');
                          }
                        });
                      } else {
                        alert('이 브라우저는 Service Worker를 지원하지 않습니다.');
                      }
                    }}
                    className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    SW 상태 확인
                  </button>
                  <button
                    onClick={() => {
                      // PWA 설치 이벤트 트리거
                      if ((window as any).deferredPrompt) {
                        (window as any).deferredPrompt.prompt();
                      } else {
                        alert('PWA 설치가 가능하지 않습니다. 모바일 브라우저에서 "홈 화면에 추가"를 사용해주세요.');
                      }
                    }}
                    className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    PWA 설치
                  </button>
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                PWA(Progressive Web App) 설치를 테스트합니다. 모바일에서는 브라우저 메뉴의 "홈 화면에 추가"를 사용하세요.
              </p>
            </div>

            {/* 트리거 기반 푸시 알림 테스트 */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-green-600" />
                  <h3 className="font-medium dark:text-white">트리거 기반 푸시 알림 테스트</h3>
                </div>
                <button
                  onClick={async () => {
                    if ('Notification' in window) {
                      const permission = await Notification.requestPermission();
                      alert(`알림 권한: ${permission === 'granted' ? '허용됨' : permission === 'denied' ? '거부됨' : '기본값'}`);
                    } else {
                      alert('이 브라우저는 푸시 알림을 지원하지 않습니다.');
                    }
                  }}
                  className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  알림 권한 요청
                </button>
              </div>
              
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                실제 이벤트를 시뮬레이션하여 푸시 알림을 테스트합니다. 각 버튼은 해당하는 상황을 가정하여 알림을 발송합니다.
              </p>

              {/* 예약 관련 트리거 */}
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">📱 예약 이벤트 트리거</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    <button
                      onClick={() => testPushNotification('reservationApproved', settings.pushNotificationTemplates.reservationApproved)}
                      className="px-3 py-2 text-sm bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                    >
                      예약 승인
                    </button>
                    <button
                      onClick={() => testPushNotification('reservationRejected', settings.pushNotificationTemplates.reservationRejected)}
                      className="px-3 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                    >
                      예약 거절
                    </button>
                    <button
                      onClick={() => testPushNotification('reservationReminder1Hour', settings.pushNotificationTemplates.reservationReminder1Hour)}
                      className="px-3 py-2 text-sm bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors"
                    >
                      1시간 전 알림
                    </button>
                    <button
                      onClick={() => testPushNotification('reservationReminder1Day', settings.pushNotificationTemplates.reservationReminder1Day)}
                      className="px-3 py-2 text-sm bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors"
                    >
                      1일 전 알림
                    </button>
                    <button
                      onClick={() => testPushNotification('checkInAvailable', settings.pushNotificationTemplates.checkInAvailable)}
                      className="px-3 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    >
                      체크인 가능
                    </button>
                  </div>
                </div>

                {/* 관리자 트리거 */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">👤 관리자 이벤트 트리거</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    <button
                      onClick={() => testPushNotification('newReservationAdmin', settings.pushNotificationTemplates.newReservationAdmin)}
                      className="px-3 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                    >
                      신규 예약
                    </button>
                    <button
                      onClick={() => testPushNotification('paymentReceived', settings.pushNotificationTemplates.paymentReceived)}
                      className="px-3 py-2 text-sm bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                    >
                      입금 확인
                    </button>
                    <button
                      onClick={() => testPushNotification('deviceStatusChanged', settings.pushNotificationTemplates.deviceStatusChanged)}
                      className="px-3 py-2 text-sm bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                    >
                      기기 상태 변경
                    </button>
                  </div>
                </div>

                {/* 시스템 트리거 */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">🔧 시스템 이벤트 트리거</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => testPushNotification('maintenanceNotice', settings.pushNotificationTemplates.maintenanceNotice)}
                      className="px-3 py-2 text-sm bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                    >
                      시스템 점검
                    </button>
                    <button
                      onClick={() => testPushNotification('emergencyNotice', settings.pushNotificationTemplates.emergencyNotice)}
                      className="px-3 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                    >
                      긴급 공지
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}