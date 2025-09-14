'use client';

import { useState, useEffect } from 'react';
import { useSession } from '@/lib/hooks/useAuth';
import { useRouter } from 'next/navigation';
import {
  Activity,
  Clock,
  Database,
  Server,
  AlertCircle,
  TrendingUp,
  Gauge,
  Zap,
  CheckCircle,
  XCircle,
  RefreshCw,
  Calendar
} from 'lucide-react';
import { motion } from 'framer-motion';
import { usePerformanceMetrics, calculatePerformanceStats } from '@/lib/monitoring/performance';

type SystemMetric = {
  name: string;
  value: string | number;
  status: 'healthy' | 'warning' | 'critical';
  trend?: 'up' | 'down' | 'stable';
  unit?: string;
};

type APIMetric = {
  endpoint: string;
  method: string;
  avgDuration: number;
  p95Duration: number;
  errorRate: number;
  requestCount: number;
  apiVersion: string;
};

export default function MonitoringDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const performanceMetrics = usePerformanceMetrics();

  const [systemMetrics, setSystemMetrics] = useState<SystemMetric[]>([]);
  const [apiMetrics, setAPIMetrics] = useState<APIMetric[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // 관리자 권한 확인
  useEffect(() => {
    if (status !== 'loading' && (!session?.user?.isAdmin)) {
      router.push('/');
      return;
    }
  }, [session, status, router]);

  // 시스템 메트릭 로드
  const loadSystemMetrics = async () => {
    try {
      // Health Check API 호출
      const healthResponse = await fetch('/api/v2/health/db', {
        credentials: 'include'
      });
      const healthData = await healthResponse.json();

      // Ready Check API 호출
      const readyResponse = await fetch('/api/v2/ready', {
        credentials: 'include'
      });
      const readyData = await readyResponse.json();

      // 시스템 메트릭 구성
      const metrics: SystemMetric[] = [
        {
          name: '데이터베이스 연결',
          value: healthData.healthy ? '정상' : '오류',
          status: healthData.healthy ? 'healthy' : 'critical'
        },
        {
          name: 'DB 응답시간',
          value: healthData.responseTime || 0,
          status: (healthData.responseTime || 0) < 100 ? 'healthy' :
                 (healthData.responseTime || 0) < 200 ? 'warning' : 'critical',
          unit: 'ms'
        },
        {
          name: '시스템 준비상태',
          value: readyData.ready ? '준비됨' : '준비 중',
          status: readyData.ready ? 'healthy' : 'warning'
        },
        {
          name: '메모리 사용률',
          value: readyData.details?.memory?.percent || 0,
          status: (readyData.details?.memory?.percent || 0) < 70 ? 'healthy' :
                 (readyData.details?.memory?.percent || 0) < 85 ? 'warning' : 'critical',
          unit: '%'
        }
      ];

      setSystemMetrics(metrics);
    } catch (error) {
      console.error('시스템 메트릭 로드 실패:', error);
      setSystemMetrics([
        {
          name: '모니터링 상태',
          value: '연결 실패',
          status: 'critical'
        }
      ]);
    }
  };

  // API 메트릭 로드
  const loadAPIMetrics = () => {
    if (performanceMetrics.length > 0) {
      const stats = calculatePerformanceStats(performanceMetrics);

      // API별로 메트릭 집계
      const apiGroups = performanceMetrics.reduce((acc, metric) => {
        const key = `${metric.method} ${metric.endpoint}`;
        if (!acc[key]) {
          acc[key] = {
            endpoint: metric.endpoint,
            method: metric.method,
            durations: [],
            errors: 0,
            apiVersion: metric.apiVersion
          };
        }
        acc[key].durations.push(metric.duration);
        if (metric.error) acc[key].errors++;
        return acc;
      }, {} as any);

      const apiMetrics: APIMetric[] = Object.values(apiGroups).map((group: any) => ({
        endpoint: group.endpoint,
        method: group.method,
        avgDuration: group.durations.reduce((a: number, b: number) => a + b, 0) / group.durations.length,
        p95Duration: group.durations.sort((a: number, b: number) => a - b)[Math.floor(group.durations.length * 0.95)] || 0,
        errorRate: (group.errors / group.durations.length) * 100,
        requestCount: group.durations.length,
        apiVersion: group.apiVersion
      }));

      setAPIMetrics(apiMetrics.sort((a, b) => b.requestCount - a.requestCount));
    }
  };

  // 데이터 로드
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await loadSystemMetrics();
      loadAPIMetrics();
      setLastUpdated(new Date());
      setIsLoading(false);
    };

    loadData();

    // 30초마다 업데이트
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [performanceMetrics]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-50 border-green-200';
      case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="w-4 h-4" />;
      case 'warning': return <AlertCircle className="w-4 h-4" />;
      case 'critical': return <XCircle className="w-4 h-4" />;
      default: return <RefreshCw className="w-4 h-4" />;
    }
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!session?.user?.isAdmin) {
    return null;
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* 헤더 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            시스템 모니터링
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            실시간 시스템 상태 및 성능 지표
          </p>
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          마지막 업데이트: {lastUpdated.toLocaleTimeString('ko-KR')}
        </div>
      </div>

      {/* 시스템 메트릭 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {systemMetrics.map((metric, index) => (
          <motion.div
            key={metric.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`p-6 rounded-xl border ${getStatusColor(metric.status)} relative overflow-hidden`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium opacity-80">{metric.name}</p>
                <p className="text-2xl font-bold mt-1">
                  {metric.value}
                  {metric.unit && <span className="text-lg ml-1">{metric.unit}</span>}
                </p>
              </div>
              <div className="flex items-center">
                {getStatusIcon(metric.status)}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* API 성능 메트릭 */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-600" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              API 성능 지표
            </h2>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  엔드포인트
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  버전
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  요청 수
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  평균 응답시간
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  P95 응답시간
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  에러율
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {apiMetrics.length > 0 ? (
                apiMetrics.slice(0, 10).map((api, index) => (
                  <motion.tr
                    key={`${api.method}-${api.endpoint}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mr-2 ${
                          api.method === 'GET' ? 'bg-blue-100 text-blue-800' :
                          api.method === 'POST' ? 'bg-green-100 text-green-800' :
                          api.method === 'PUT' ? 'bg-yellow-100 text-yellow-800' :
                          api.method === 'DELETE' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {api.method}
                        </span>
                        <span className="text-sm text-gray-900 dark:text-white">
                          {api.endpoint}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        api.apiVersion === 'v3' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {api.apiVersion}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {api.requestCount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {Math.round(api.avgDuration)}ms
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {Math.round(api.p95Duration)}ms
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        api.errorRate === 0 ? 'bg-green-100 text-green-800' :
                        api.errorRate < 5 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {api.errorRate.toFixed(1)}%
                      </span>
                    </td>
                  </motion.tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                    API 메트릭 데이터가 없습니다
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 성능 통계 요약 */}
      {performanceMetrics.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-indigo-600" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              전체 성능 요약
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {(() => {
              const stats = calculatePerformanceStats(performanceMetrics);
              return [
                {
                  label: '평균 응답시간',
                  value: `${Math.round(stats.avgDuration)}ms`,
                  icon: <Clock className="w-4 h-4" />
                },
                {
                  label: 'P95 응답시간',
                  value: `${Math.round(stats.p95Duration)}ms`,
                  icon: <Gauge className="w-4 h-4" />
                },
                {
                  label: '에러율',
                  value: `${stats.errorRate.toFixed(1)}%`,
                  icon: <AlertCircle className="w-4 h-4" />
                },
                {
                  label: '총 요청 수',
                  value: stats.totalRequests.toLocaleString(),
                  icon: <Server className="w-4 h-4" />
                }
              ].map((stat, index) => (
                <div key={stat.label} className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center justify-center text-indigo-600 mb-2">
                    {stat.icon}
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stat.value}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {stat.label}
                  </p>
                </div>
              ));
            })()}
          </div>
        </div>
      )}
    </div>
  );
}