/**
 * PWA 설치 프롬프트 컴포넌트
 * 사용자 친화적인 설치 유도 UI 제공
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, Download, Smartphone, CheckCircle } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface InstallStats {
  promptShown: number;
  lastPromptDate: string | null;
  installed: boolean;
  dismissed: boolean;
  dismissCount: number;
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [installStep, setInstallStep] = useState<'prompt' | 'installing' | 'success'>('prompt');
  const [platform, setPlatform] = useState<'android' | 'ios' | 'desktop' | 'unknown'>('unknown');
  const [stats, setStats] = useState<InstallStats>({
    promptShown: 0,
    lastPromptDate: null,
    installed: false,
    dismissed: false,
    dismissCount: 0
  });

  // 플랫폼 감지
  useEffect(() => {
    const detectPlatform = () => {
      const userAgent = navigator.userAgent.toLowerCase();

      if (/iphone|ipad|ipod/.test(userAgent)) {
        setPlatform('ios');
      } else if (/android/.test(userAgent)) {
        setPlatform('android');
      } else if (/windows|mac|linux/.test(userAgent) && !(/mobile/.test(userAgent))) {
        setPlatform('desktop');
      } else {
        setPlatform('unknown');
      }
    };

    detectPlatform();
  }, []);

  // 설치 통계 로드
  useEffect(() => {
    const loadStats = () => {
      const savedStats = localStorage.getItem('pwa-install-stats');
      if (savedStats) {
        setStats(JSON.parse(savedStats));
      }
    };

    loadStats();
  }, []);

  // 설치 상태 확인
  useEffect(() => {
    const checkInstalled = () => {
      // standalone 모드 확인
      if (window.matchMedia('(display-mode: standalone)').matches) {
        setIsInstalled(true);
        updateStats({ installed: true });
        return;
      }

      // iOS 홈 화면 확인
      if ((window.navigator as any).standalone === true) {
        setIsInstalled(true);
        updateStats({ installed: true });
        return;
      }

      // 설치 관련 API 확인 (Chrome 93+)
      if ('getInstalledRelatedApps' in navigator) {
        (navigator as any).getInstalledRelatedApps().then((apps: any[]) => {
          if (apps.length > 0) {
            setIsInstalled(true);
            updateStats({ installed: true });
          }
        });
      }
    };

    checkInstalled();
  }, []);

  // beforeinstallprompt 이벤트 처리
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);

      // 자동 프롬프트 표시 로직
      if (!isInstalled && !stats.dismissed && shouldShowPrompt()) {
        setTimeout(() => setShowPrompt(true), 3000); // 3초 후 표시
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, [isInstalled, stats]);

  // 프롬프트 표시 조건 확인
  const shouldShowPrompt = (): boolean => {
    // 이미 설치됨
    if (stats.installed) return false;

    // 너무 자주 거절함 (3번 이상)
    if (stats.dismissCount >= 3) return false;

    // 최근 7일 내에 표시함
    if (stats.lastPromptDate) {
      const lastDate = new Date(stats.lastPromptDate);
      const daysSince = (Date.now() - lastDate.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSince < 7) return false;
    }

    // 사용자가 3번 이상 방문 (세션 기준)
    const visitCount = parseInt(sessionStorage.getItem('visit-count') || '0');
    if (visitCount < 3) return false;

    return true;
  };

  // 통계 업데이트
  const updateStats = (updates: Partial<InstallStats>) => {
    const newStats = { ...stats, ...updates };
    setStats(newStats);
    localStorage.setItem('pwa-install-stats', JSON.stringify(newStats));
  };

  // 설치 처리
  const handleInstall = async () => {
    if (!deferredPrompt) return;

    setInstallStep('installing');

    try {
      // 설치 프롬프트 표시
      await deferredPrompt.prompt();

      // 사용자 선택 대기
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === 'accepted') {
        setInstallStep('success');
        updateStats({
          installed: true,
          lastPromptDate: new Date().toISOString()
        });

        // 성공 메시지 후 닫기
        setTimeout(() => {
          setShowPrompt(false);
          setIsInstalled(true);
        }, 3000);

        // 분석 이벤트 전송
        trackInstallEvent('accepted');
      } else {
        setShowPrompt(false);
        updateStats({
          dismissCount: stats.dismissCount + 1,
          lastPromptDate: new Date().toISOString()
        });

        trackInstallEvent('dismissed');
      }
    } catch (error) {
      console.error('설치 중 오류:', error);
      setShowPrompt(false);
    }

    setDeferredPrompt(null);
  };

  // 수동 설치 안내
  const handleManualInstall = () => {
    // 플랫폼별 설치 가이드 페이지로 이동
    window.location.href = '/install-guide';
  };

  // 닫기 처리
  const handleDismiss = () => {
    setShowPrompt(false);
    updateStats({
      dismissed: true,
      dismissCount: stats.dismissCount + 1,
      lastPromptDate: new Date().toISOString()
    });

    trackInstallEvent('dismissed');
  };

  // 분석 이벤트 추적
  const trackInstallEvent = (action: string) => {
    // Google Analytics 또는 다른 분석 도구로 이벤트 전송
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'pwa_install', {
        action,
        platform,
        dismiss_count: stats.dismissCount
      });
    }
  };

  // 이미 설치된 경우 표시하지 않음
  if (isInstalled) return null;

  // iOS 수동 설치 안내
  if (platform === 'ios' && showPrompt) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center">
        <div className="bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md p-6 animate-slide-up">
          <button
            onClick={handleDismiss}
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Smartphone className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold mb-2">앱으로 설치하기</h3>
            <p className="text-gray-600 dark:text-gray-400">
              홈 화면에 추가하여 앱처럼 사용하세요
            </p>
          </div>

          <div className="space-y-4 mb-6">
            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm font-bold">
                1
              </span>
              <p className="text-sm">
                Safari 하단의 공유 버튼
                <span className="inline-block w-4 h-4 ml-1 align-middle">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M8 12h8m-4-4v8m-7 6h14a2 2 0 002-2V4a2 2 0 00-2-2H5a2 2 0 00-2 2v16a2 2 0 002 2z" />
                  </svg>
                </span>
                을 탭하세요
              </p>
            </div>

            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm font-bold">
                2
              </span>
              <p className="text-sm">
                "홈 화면에 추가"를 선택하세요
              </p>
            </div>

            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm font-bold">
                3
              </span>
              <p className="text-sm">
                우측 상단 "추가"를 탭하세요
              </p>
            </div>
          </div>

          <button
            onClick={handleDismiss}
            className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
          >
            확인
          </button>
        </div>
      </div>
    );
  }

  // Android/Desktop 설치 프롬프트
  if (!showPrompt || !deferredPrompt) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center">
      <div className="bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md p-6 animate-slide-up">
        {installStep === 'prompt' && (
          <>
            <button
              onClick={handleDismiss}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Download className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">게임플라자 앱 설치</h3>
              <p className="text-gray-600 dark:text-gray-400">
                더 빠르고 편리하게 이용하세요
              </p>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                <span className="text-sm">오프라인에서도 사용 가능</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                <span className="text-sm">실시간 알림 받기</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                <span className="text-sm">홈 화면에서 바로 실행</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleDismiss}
                className="flex-1 py-3 border border-gray-300 rounded-xl font-medium hover:bg-gray-50 transition-colors"
              >
                나중에
              </button>
              <button
                onClick={handleInstall}
                className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
              >
                설치하기
              </button>
            </div>
          </>
        )}

        {installStep === 'installing' && (
          <div className="text-center py-8">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-lg font-medium">설치 중...</p>
          </div>
        )}

        {installStep === 'success' && (
          <div className="text-center py-8">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">설치 완료!</h3>
            <p className="text-gray-600 dark:text-gray-400">
              홈 화면에서 앱을 실행하세요
            </p>
          </div>
        )}
      </div>
    </div>
  );
}