// 백업 관리 페이지
// 비전공자 설명: 시스템 데이터를 백업하고 복원하는 페이지입니다
'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { 
  Download,
  Upload,
  ChevronLeft,
  CloudDownload,
  FileArchive,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Shield,
  Smartphone,
  Mail,
  HardDrive,
  Info,
  AlertTriangle
} from 'lucide-react';

type BackupItem = {
  id: string;
  name: string;
  type: 'full' | 'partial' | 'auto';
  size: string;
  createdAt: string;
  status: 'completed' | 'failed' | 'pending';
  downloadUrl?: string;
};

type BackupSchedule = {
  enabled: boolean;
  frequency: 'daily' | 'weekly' | 'monthly';
  time: string;
  retention: number; // days
  destination: 'cloud' | 'email' | 'both';
};

export default function BackupPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<BackupItem | null>(null);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [backupInProgress, setBackupInProgress] = useState(false);

  // 백업 스케줄 설정
  const [schedule, setSchedule] = useState<BackupSchedule>({
    enabled: true,
    frequency: 'daily',
    time: '03:00',
    retention: 30,
    destination: 'both'
  });

  // 백업 이력 (실제로는 API에서 가져옴)
  const backupHistory: BackupItem[] = [
    {
      id: '1',
      name: '자동 백업 - 2024-01-26',
      type: 'auto',
      size: '125 MB',
      createdAt: '2024-01-26 03:00:00',
      status: 'completed'
    },
    {
      id: '2',
      name: '수동 백업 - 시스템 업데이트 전',
      type: 'full',
      size: '132 MB',
      createdAt: '2024-01-25 14:30:00',
      status: 'completed'
    },
    {
      id: '3',
      name: '자동 백업 - 2024-01-25',
      type: 'auto',
      size: '124 MB',
      createdAt: '2024-01-25 03:00:00',
      status: 'completed'
    },
    {
      id: '4',
      name: '자동 백업 - 2024-01-24',
      type: 'auto',
      size: '123 MB',
      createdAt: '2024-01-24 03:00:00',
      status: 'failed'
    },
    {
      id: '5',
      name: '자동 백업 - 2024-01-23',
      type: 'auto',
      size: '122 MB',
      createdAt: '2024-01-23 03:00:00',
      status: 'completed'
    }
  ];

  // 백업 통계
  const backupStats = {
    lastBackup: '2시간 전',
    totalSize: '2.4 GB',
    successRate: 95,
    nextScheduled: '내일 03:00'
  };

  const handleBackupNow = async () => {
    setBackupInProgress(true);
    
    // 백업 진행 시뮬레이션
    setTimeout(() => {
      setBackupInProgress(false);
      alert('백업이 완료되었습니다. 관리자 이메일로 백업 파일이 전송되었습니다.');
    }, 3000);
  };

  const handleRestore = (backup: BackupItem) => {
    setSelectedBackup(backup);
    setShowRestoreModal(true);
  };

  const confirmRestore = () => {
    if (!selectedBackup) return;
    
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setShowRestoreModal(false);
      alert(`${selectedBackup.name} 백업으로 복원이 완료되었습니다.`);
    }, 2000);
  };

  const handleScheduleUpdate = () => {
    alert('백업 스케줄이 업데이트되었습니다.');
  };

  const getStatusBadge = (status: BackupItem['status']) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
            <CheckCircle className="w-3 h-3" />
            완료
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400">
            <AlertCircle className="w-3 h-3" />
            실패
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">
            <Clock className="w-3 h-3" />
            대기중
          </span>
        );
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* 헤더 */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold dark:text-white mb-2">백업 관리</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          시스템 데이터를 안전하게 백업하고 복원합니다
        </p>
      </div>

      {/* 백업 상태 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6"
        >
          <div className="flex items-center justify-between mb-2">
            <Clock className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold dark:text-white mb-1">
            {backupStats.lastBackup}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">마지막 백업</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6"
        >
          <div className="flex items-center justify-between mb-2">
            <HardDrive className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold dark:text-white mb-1">
            {backupStats.totalSize}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">총 백업 크기</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6"
        >
          <div className="flex items-center justify-between mb-2">
            <CheckCircle className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold dark:text-white mb-1">
            {backupStats.successRate}%
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">성공률</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6"
        >
          <div className="flex items-center justify-between mb-2">
            <Calendar className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold dark:text-white mb-1">
            {backupStats.nextScheduled}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">다음 백업</p>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 백업 제어 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 즉시 백업 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6"
          >
            <h2 className="text-lg font-semibold dark:text-white mb-4">즉시 백업</h2>
            
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-800 dark:text-blue-200">
                    <p className="font-medium mb-1">백업 내용</p>
                    <ul className="list-disc list-inside space-y-1 text-blue-700 dark:text-blue-300">
                      <li>예약 데이터 및 고객 정보</li>
                      <li>기기 및 시스템 설정</li>
                      <li>매출 및 통계 데이터</li>
                      <li>콘텐츠 및 이미지 파일</li>
                    </ul>
                  </div>
                </div>
              </div>

              <button
                onClick={handleBackupNow}
                disabled={backupInProgress}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {backupInProgress ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    백업 진행중...
                  </>
                ) : (
                  <>
                    <CloudDownload className="w-5 h-5" />
                    지금 백업 시작
                  </>
                )}
              </button>

              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Shield className="w-4 h-4" />
                <span>백업 파일은 암호화되어 안전하게 저장됩니다</span>
              </div>
            </div>
          </motion.div>

          {/* 백업 이력 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6"
          >
            <h2 className="text-lg font-semibold dark:text-white mb-4">백업 이력</h2>
            
            <div className="space-y-3">
              {backupHistory.map((backup) => (
                <div
                  key={backup.id}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <FileArchive className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    <div>
                      <h3 className="font-medium dark:text-white">{backup.name}</h3>
                      <div className="flex items-center gap-3 mt-1 text-sm text-gray-600 dark:text-gray-400">
                        <span>{backup.createdAt}</span>
                        <span>•</span>
                        <span>{backup.size}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(backup.status)}
                    {backup.status === 'completed' && (
                      <>
                        <button
                          onClick={() => alert('백업 파일이 다운로드됩니다.')}
                          className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                          title="다운로드"
                        >
                          <Download className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        </button>
                        <button
                          onClick={() => handleRestore(backup)}
                          className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                          title="복원"
                        >
                          <Upload className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* 백업 설정 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="space-y-6"
        >
          {/* 자동 백업 설정 */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold dark:text-white mb-4">자동 백업 설정</h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium dark:text-white">자동 백업 활성화</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={schedule.enabled}
                    onChange={(e) => setSchedule({ ...schedule, enabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  백업 주기
                </label>
                <select
                  value={schedule.frequency}
                  onChange={(e) => setSchedule({ ...schedule, frequency: e.target.value as BackupSchedule['frequency'] })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  disabled={!schedule.enabled}
                >
                  <option value="daily">매일</option>
                  <option value="weekly">매주</option>
                  <option value="monthly">매월</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  백업 시간
                </label>
                <input
                  type="time"
                  value={schedule.time}
                  onChange={(e) => setSchedule({ ...schedule, time: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  disabled={!schedule.enabled}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  보관 기간
                </label>
                <select
                  value={schedule.retention}
                  onChange={(e) => setSchedule({ ...schedule, retention: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  disabled={!schedule.enabled}
                >
                  <option value="7">7일</option>
                  <option value="30">30일</option>
                  <option value="90">90일</option>
                  <option value="365">1년</option>
                </select>
              </div>

              <button
                onClick={handleScheduleUpdate}
                className="w-full px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-medium rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
              >
                설정 저장
              </button>
            </div>
          </div>

          {/* 백업 알림 설정 */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold dark:text-white mb-4">백업 알림</h2>
            
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                <Mail className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <div className="flex-1">
                  <p className="text-sm font-medium dark:text-white">이메일 알림</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    admin@gameplaza.kr
                  </p>
                </div>
                <CheckCircle className="w-5 h-5 text-green-500" />
              </div>

              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                <Smartphone className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <div className="flex-1">
                  <p className="text-sm font-medium dark:text-white">SMS 알림</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    010-****-5678
                  </p>
                </div>
                <CheckCircle className="w-5 h-5 text-green-500" />
              </div>

              <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                  <p className="text-xs text-yellow-800 dark:text-yellow-200">
                    백업 실패 시 즉시 알림이 발송됩니다
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* 복원 확인 모달 */}
      {showRestoreModal && selectedBackup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full"
          >
            <h3 className="text-lg font-semibold dark:text-white mb-4">백업 복원 확인</h3>
            
            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg mb-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-red-800 dark:text-red-200">
                  <p className="font-medium mb-1">주의사항</p>
                  <p>복원을 진행하면 현재 데이터가 선택한 백업 시점으로 덮어씌워집니다. 이 작업은 되돌릴 수 없습니다.</p>
                </div>
              </div>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              <strong className="dark:text-white">{selectedBackup.name}</strong>으로 복원하시겠습니까?
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowRestoreModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                취소
              </button>
              <button
                onClick={confirmRestore}
                disabled={isLoading}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                {isLoading ? '복원 중...' : '복원 시작'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}