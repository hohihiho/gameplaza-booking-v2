'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Activity, Wifi, WifiOff, RefreshCw, Zap, Clock, Database } from 'lucide-react';
import { useOptimizedRealtime } from '@/hooks/useOptimizedRealtime';
import { RealtimeIndicator, LoadingButton, AnimatedCard } from '@/app/components/mobile';

export default function RealtimeDemoPage() {
  const [testData, setTestData] = useState<any[]>([]);
  const [isTestRunning, setIsTestRunning] = useState(false);

  // 실시간 연결 테스트
  const realtimeState = useOptimizedRealtime({
    channel: 'demo-channel',
    table: 'reservations',
    event: '*',
    debounceMs: 300,
    onUpdate: (payload) => {
      setTestData(prev => [{
        id: Date.now(),
        type: payload.eventType,
        table: payload.table,
        timestamp: new Date(),
        data: payload.new || payload.old
      }, ...prev].slice(0, 10));
    },
    onConnect: () => {
      console.log('✅ 실시간 연결 성공');
    },
    onDisconnect: () => {
      console.log('❌ 실시간 연결 끊김');
    },
    onError: (error) => {
      console.error('실시간 에러:', error);
    }
  });

  // 연결 테스트
  const handleConnectionTest = useCallback(async () => {
    setIsTestRunning(true);
    
    // 강제 재연결
    realtimeState.reconnect();
    
    setTimeout(() => {
      setIsTestRunning(false);
    }, 3000);
  }, [realtimeState]);

  // 성능 지표
  const metrics = {
    연결상태: realtimeState.isConnected ? '연결됨' : '연결 끊김',
    재연결중: realtimeState.isReconnecting ? '예' : '아니오',
    마지막업데이트: realtimeState.lastUpdate 
      ? new Date().getTime() - realtimeState.lastUpdate.getTime() < 60000
        ? `${Math.floor((new Date().getTime() - realtimeState.lastUpdate.getTime()) / 1000)}초 전`
        : '1분 이상'
      : '없음',
    총업데이트: realtimeState.updateCount
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-8">
      <div className="max-w-4xl mx-auto px-5">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            실시간 업데이트 모니터링
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Supabase 실시간 연결 상태와 성능을 모니터링합니다
          </p>
        </div>

        {/* 연결 상태 카드 */}
        <AnimatedCard className="p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Activity className="w-5 h-5" />
              연결 상태
            </h2>
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${
              realtimeState.isConnected 
                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' 
                : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
            }`}>
              {realtimeState.isConnected ? (
                <>
                  <Wifi className="w-4 h-4" />
                  <span className="text-sm font-medium">연결됨</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-4 h-4" />
                  <span className="text-sm font-medium">연결 끊김</span>
                </>
              )}
            </div>
          </div>

          {/* 메트릭스 그리드 */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            {Object.entries(metrics).map(([key, value]) => (
              <div key={key} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{key}</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">{value}</p>
              </div>
            ))}
          </div>

          {/* 테스트 버튼 */}
          <LoadingButton
            onClick={handleConnectionTest}
            isLoading={isTestRunning}
            loadingText="테스트 중..."
            icon={<RefreshCw className="w-4 h-4" />}
            fullWidth
          >
            연결 테스트
          </LoadingButton>
        </AnimatedCard>

        {/* 실시간 업데이트 로그 */}
        <AnimatedCard className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Database className="w-5 h-5" />
            실시간 업데이트 로그
          </h2>

          {testData.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="w-12 h-12 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400">
                아직 업데이트가 없습니다
              </p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                다른 탭에서 예약을 생성하거나 수정해보세요
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {testData.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <div className={`p-2 rounded-lg ${
                    item.type === 'INSERT' ? 'bg-green-100 dark:bg-green-900/30' :
                    item.type === 'UPDATE' ? 'bg-blue-100 dark:bg-blue-900/30' :
                    'bg-red-100 dark:bg-red-900/30'
                  }`}>
                    <Zap className={`w-4 h-4 ${
                      item.type === 'INSERT' ? 'text-green-600 dark:text-green-400' :
                      item.type === 'UPDATE' ? 'text-blue-600 dark:text-blue-400' :
                      'text-red-600 dark:text-red-400'
                    }`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-sm font-medium ${
                        item.type === 'INSERT' ? 'text-green-700 dark:text-green-300' :
                        item.type === 'UPDATE' ? 'text-blue-700 dark:text-blue-300' :
                        'text-red-700 dark:text-red-300'
                      }`}>
                        {item.type}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {item.table}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {item.timestamp.toLocaleTimeString('ko-KR')}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </AnimatedCard>

        {/* 성능 최적화 정보 */}
        <AnimatedCard className="p-6 mt-6 bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800">
          <h3 className="text-lg font-semibold text-indigo-900 dark:text-indigo-100 mb-3">
            실시간 업데이트 최적화 기능
          </h3>
          <ul className="space-y-2 text-sm text-indigo-700 dark:text-indigo-300">
            <li className="flex items-start gap-2">
              <span className="text-indigo-500">•</span>
              <span>디바운싱: 빈번한 업데이트를 그룹화하여 처리</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-indigo-500">•</span>
              <span>자동 재연결: 연결이 끊어지면 자동으로 재연결 시도</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-indigo-500">•</span>
              <span>백그라운드 감지: 탭이 백그라운드로 갈 때 연결 관리</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-indigo-500">•</span>
              <span>네트워크 상태: 오프라인/온라인 전환 자동 감지</span>
            </li>
          </ul>
        </AnimatedCard>
      </div>

      {/* 실시간 인디케이터 */}
      <RealtimeIndicator
        isConnected={realtimeState.isConnected}
        isReconnecting={realtimeState.isReconnecting}
        lastUpdate={realtimeState.lastUpdate}
        updateCount={realtimeState.updateCount}
        onReconnect={realtimeState.reconnect}
        position="bottom-right"
        showDetails={true}
      />
    </div>
  );
}