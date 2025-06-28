// 설정 페이지
// 비전공자 설명: 시스템 전반의 설정을 관리하는 페이지입니다
'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Banknote,
  MessageSquare,
  Wifi,
  Calendar,
  ChevronLeft,
  Save,
  Copy,
  Edit,
  Clock
} from 'lucide-react';
import Link from 'next/link';

type BankAccount = {
  bank: string;
  accountNumber: string;
  accountHolder: string;
};

type SystemSettings = {
  bankAccount: BankAccount;
  wifiInfo: {
    ssid: string;
    password: string;
  };
  businessHours: {
    weekday: { open: string; close: string };
    weekend: { open: string; close: string };
  };
  reservationRules: {
    maxReservationsPerUser: number;
    advanceReservationDays: number;
    cancellationDeadlineHours: number;
  };
  messageTemplates: {
    reservationApproved: string;
    reservationRejected: string;
    paymentRequest: string;
    checkInComplete: string;
  };
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<SystemSettings>({
    bankAccount: {
      bank: '광주은행',
      accountNumber: '062-1234-5678-90',
      accountHolder: '게임플라자'
    },
    wifiInfo: {
      ssid: 'GamePlaza_5G',
      password: 'game1234'
    },
    businessHours: {
      weekday: { open: '10:00', close: '22:00' },
      weekend: { open: '10:00', close: '24:00' }
    },
    reservationRules: {
      maxReservationsPerUser: 3,
      advanceReservationDays: 7,
      cancellationDeadlineHours: 24
    },
    messageTemplates: {
      reservationApproved: '안녕하세요, {name}님!\n예약이 승인되었습니다.\n\n날짜: {date}\n시간: {time}\n기기: {device}\n\n이용 당일 시간에 맞춰 방문해주세요.',
      reservationRejected: '안녕하세요, {name}님.\n죄송하지만 예약이 거절되었습니다.\n\n사유: {reason}\n\n다른 시간대로 다시 예약해주세요.',
      paymentRequest: '[게임플라자 계좌이체 안내]\n\n안녕하세요, {name}님!\n예약해주신 {time} 시간대의 {device} 이용을 위해\n아래 계좌로 입금 부탁드립니다.\n\n금액: ₩{amount}\n계좌: {account}\n예금주: {holder}\n\n입금 확인 후 기기를 배정해드리겠습니다.\n감사합니다!',
      checkInComplete: '안녕하세요, {name}님!\n체크인이 완료되었습니다.\n\n배정 기기: {device} #{number}\nWiFi: {wifi_ssid} / {wifi_password}\n\n즐거운 시간 되세요!'
    }
  });

  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [tempSettings, setTempSettings] = useState<SystemSettings>(settings);
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    setIsLoading(true);
    
    // API 호출 시뮬레이션
    setTimeout(() => {
      setSettings(tempSettings);
      setEditingSection(null);
      setIsLoading(false);
      alert('설정이 저장되었습니다.');
    }, 1000);
  };

  const handleCancel = () => {
    setTempSettings(settings);
    setEditingSection(null);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    alert(`${label}이(가) 클립보드에 복사되었습니다.`);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* 헤더 */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-2">
          <Link
            href="/admin"
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          </Link>
          <h1 className="text-2xl font-bold dark:text-white">설정</h1>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 ml-11">
          시스템 설정 및 메시지 템플릿 관리
        </p>
      </div>

      <div className="space-y-6">
        {/* 계좌 정보 설정 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Banknote className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <h2 className="text-lg font-semibold dark:text-white">계좌 정보</h2>
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

        {/* WiFi 정보 설정 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Wifi className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <h2 className="text-lg font-semibold dark:text-white">WiFi 정보</h2>
            </div>
            {editingSection === 'wifi' ? (
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
                onClick={() => setEditingSection('wifi')}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <Edit className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </button>
            )}
          </div>

          {editingSection === 'wifi' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  SSID (네트워크 이름)
                </label>
                <input
                  type="text"
                  value={tempSettings.wifiInfo.ssid}
                  onChange={(e) => setTempSettings({
                    ...tempSettings,
                    wifiInfo: { ...tempSettings.wifiInfo, ssid: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  비밀번호
                </label>
                <input
                  type="text"
                  value={tempSettings.wifiInfo.password}
                  onChange={(e) => setTempSettings({
                    ...tempSettings,
                    wifiInfo: { ...tempSettings.wifiInfo, password: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">SSID</span>
                <span className="font-medium dark:text-white">{settings.wifiInfo.ssid}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">비밀번호</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-medium dark:text-white">
                    {settings.wifiInfo.password}
                  </span>
                  <button
                    onClick={() => copyToClipboard(
                      `WiFi: ${settings.wifiInfo.ssid} / 비밀번호: ${settings.wifiInfo.password}`,
                      'WiFi 정보'
                    )}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                  >
                    <Copy className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </motion.div>

        {/* 운영 시간 설정 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <h2 className="text-lg font-semibold dark:text-white">운영 시간</h2>
            </div>
            {editingSection === 'hours' ? (
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
                onClick={() => setEditingSection('hours')}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <Edit className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </button>
            )}
          </div>

          {editingSection === 'hours' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  평일 (월-금)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="time"
                    value={tempSettings.businessHours.weekday.open}
                    onChange={(e) => setTempSettings({
                      ...tempSettings,
                      businessHours: {
                        ...tempSettings.businessHours,
                        weekday: { ...tempSettings.businessHours.weekday, open: e.target.value }
                      }
                    })}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                  <span className="text-gray-600 dark:text-gray-400">~</span>
                  <input
                    type="time"
                    value={tempSettings.businessHours.weekday.close}
                    onChange={(e) => setTempSettings({
                      ...tempSettings,
                      businessHours: {
                        ...tempSettings.businessHours,
                        weekday: { ...tempSettings.businessHours.weekday, close: e.target.value }
                      }
                    })}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  주말 (토-일)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="time"
                    value={tempSettings.businessHours.weekend.open}
                    onChange={(e) => setTempSettings({
                      ...tempSettings,
                      businessHours: {
                        ...tempSettings.businessHours,
                        weekend: { ...tempSettings.businessHours.weekend, open: e.target.value }
                      }
                    })}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                  <span className="text-gray-600 dark:text-gray-400">~</span>
                  <input
                    type="time"
                    value={tempSettings.businessHours.weekend.close}
                    onChange={(e) => setTempSettings({
                      ...tempSettings,
                      businessHours: {
                        ...tempSettings.businessHours,
                        weekend: { ...tempSettings.businessHours.weekend, close: e.target.value }
                      }
                    })}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">평일</span>
                <span className="font-medium dark:text-white">
                  {settings.businessHours.weekday.open} ~ {settings.businessHours.weekday.close}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">주말</span>
                <span className="font-medium dark:text-white">
                  {settings.businessHours.weekend.open} ~ {settings.businessHours.weekend.close}
                </span>
              </div>
            </div>
          )}
        </motion.div>

        {/* 예약 규칙 설정 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <h2 className="text-lg font-semibold dark:text-white">예약 규칙</h2>
            </div>
            {editingSection === 'rules' ? (
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
                onClick={() => setEditingSection('rules')}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <Edit className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </button>
            )}
          </div>

          {editingSection === 'rules' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  사용자당 최대 예약 수
                </label>
                <input
                  type="number"
                  value={tempSettings.reservationRules.maxReservationsPerUser}
                  onChange={(e) => setTempSettings({
                    ...tempSettings,
                    reservationRules: {
                      ...tempSettings.reservationRules,
                      maxReservationsPerUser: parseInt(e.target.value)
                    }
                  })}
                  className="w-32 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  사전 예약 가능 일수
                </label>
                <input
                  type="number"
                  value={tempSettings.reservationRules.advanceReservationDays}
                  onChange={(e) => setTempSettings({
                    ...tempSettings,
                    reservationRules: {
                      ...tempSettings.reservationRules,
                      advanceReservationDays: parseInt(e.target.value)
                    }
                  })}
                  className="w-32 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  취소 가능 시간 (시간 전)
                </label>
                <input
                  type="number"
                  value={tempSettings.reservationRules.cancellationDeadlineHours}
                  onChange={(e) => setTempSettings({
                    ...tempSettings,
                    reservationRules: {
                      ...tempSettings.reservationRules,
                      cancellationDeadlineHours: parseInt(e.target.value)
                    }
                  })}
                  className="w-32 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">사용자당 최대 예약</span>
                <span className="font-medium dark:text-white">{settings.reservationRules.maxReservationsPerUser}건</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">사전 예약 가능</span>
                <span className="font-medium dark:text-white">{settings.reservationRules.advanceReservationDays}일 전까지</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">취소 가능 시간</span>
                <span className="font-medium dark:text-white">{settings.reservationRules.cancellationDeadlineHours}시간 전까지</span>
              </div>
            </div>
          )}
        </motion.div>

        {/* 메시지 템플릿 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <MessageSquare className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <h2 className="text-lg font-semibold dark:text-white">메시지 템플릿</h2>
            </div>
          </div>

          <div className="space-y-4">
            {Object.entries(settings.messageTemplates).map(([key, template]) => (
              <div key={key} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium dark:text-white">
                    {key === 'reservationApproved' && '예약 승인'}
                    {key === 'reservationRejected' && '예약 거절'}
                    {key === 'paymentRequest' && '결제 요청'}
                    {key === 'checkInComplete' && '체크인 완료'}
                  </h3>
                  <button
                    onClick={() => copyToClipboard(template, '메시지 템플릿')}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                  >
                    <Copy className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  </button>
                </div>
                <pre className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap font-sans">
                  {template}
                </pre>
                <div className="mt-2 text-xs text-gray-500">
                  사용 가능한 변수: {key === 'paymentRequest' 
                    ? '{name}, {time}, {device}, {amount}, {account}, {holder}'
                    : key === 'checkInComplete'
                    ? '{name}, {device}, {number}, {wifi_ssid}, {wifi_password}'
                    : key === 'reservationRejected'
                    ? '{name}, {reason}'
                    : '{name}, {date}, {time}, {device}'}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}