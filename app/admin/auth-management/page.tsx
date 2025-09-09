'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ChevronLeft,
  Users,
  Shield,
  Key,
  Settings,
  Database,
  Activity,
  Clock,
  UserCheck,
  AlertTriangle,
  TrendingUp,
  Eye,
  RefreshCw,
  Download,
  Upload
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface AuthStats {
  totalUsers: number;
  activeUsers: number;
  sessionsToday: number;
  passkeysEnabled: number;
  twoFactorEnabled: number;
  organizationMembers: number;
}

interface RecentSession {
  id: string;
  user: {
    name: string;
    email: string;
  };
  loginMethod: 'google' | 'passkey' | '2fa';
  ipAddress: string;
  userAgent: string;
  createdAt: string;
  expiresAt: string;
  isActive: boolean;
}

export default function AuthManagementPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<AuthStats>({
    totalUsers: 0,
    activeUsers: 0,
    sessionsToday: 0,
    passkeysEnabled: 0,
    twoFactorEnabled: 0,
    organizationMembers: 0
  });
  const [recentSessions, setRecentSessions] = useState<RecentSession[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'sessions' | 'security' | 'settings'>('overview');

  // Better Auth 통계 가져오기
  const fetchAuthStats = async () => {
    setIsLoading(true);
    try {
      // Better Auth API를 통해 통계 정보 가져오기
      const response = await fetch('/api/admin/auth/stats', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data.stats || stats);
        setRecentSessions(data.recentSessions || []);
      }
    } catch (error) {
      console.error('Error fetching auth stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 세션 강제 종료
  const terminateSession = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/admin/auth/sessions/${sessionId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        await fetchAuthStats();
      }
    } catch (error) {
      console.error('Error terminating session:', error);
    }
  };

  // 초기 로드
  useEffect(() => {
    fetchAuthStats();
    
    // 30초마다 자동 새로고침
    const interval = setInterval(fetchAuthStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const getLoginMethodIcon = (method: string) => {
    switch (method) {
      case 'google':
        return <div className="w-4 h-4 bg-red-500 rounded-full" />;
      case 'passkey':
        return <Key className="w-4 h-4 text-blue-500" />;
      case '2fa':
        return <Shield className="w-4 h-4 text-green-500" />;
      default:
        return <UserCheck className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="px-4 sm:px-6 py-6 max-w-7xl mx-auto">
      {/* 헤더 */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => router.push('/admin')}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-6 h-6 text-gray-700 dark:text-gray-300" />
          </button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <Shield className="w-8 h-8 text-indigo-600" />
              Better Auth 관리
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
              인증 시스템 모니터링 및 관리
            </p>
          </div>
        </div>

        {/* 새로고침 버튼 */}
        <div className="flex justify-end">
          <button
            onClick={fetchAuthStats}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded-xl hover:bg-indigo-600 disabled:opacity-50 transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            새로고침
          </button>
        </div>
      </div>

      {/* 탭 메뉴 */}
      <div className="mb-6">
        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-2">
          <div className="flex gap-1">
            {[
              { value: 'overview', label: '개요', icon: Activity },
              { value: 'sessions', label: '세션', icon: Clock },
              { value: 'security', label: '보안', icon: Shield },
              { value: 'settings', label: '설정', icon: Settings }
            ].map((tab) => (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value as any)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-all ${
                  activeTab === tab.value
                    ? 'bg-indigo-500 text-white shadow-lg'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 콘텐츠 */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* 통계 카드 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                title: '전체 사용자',
                value: stats.totalUsers.toLocaleString(),
                icon: Users,
                color: 'blue',
                change: '+12%'
              },
              {
                title: '활성 세션',
                value: stats.activeUsers.toLocaleString(),
                icon: Activity,
                color: 'green',
                change: '+5%'
              },
              {
                title: '오늘 로그인',
                value: stats.sessionsToday.toLocaleString(),
                icon: TrendingUp,
                color: 'purple',
                change: '+18%'
              },
              {
                title: '패스키 사용자',
                value: stats.passkeysEnabled.toLocaleString(),
                icon: Key,
                color: 'indigo',
                change: '+23%'
              },
              {
                title: '2단계 인증',
                value: stats.twoFactorEnabled.toLocaleString(),
                icon: Shield,
                color: 'emerald',
                change: '+15%'
              },
              {
                title: '조직 구성원',
                value: stats.organizationMembers.toLocaleString(),
                icon: UserCheck,
                color: 'orange',
                change: '+8%'
              }
            ].map((stat, index) => (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 bg-${stat.color}-100 dark:bg-${stat.color}-900/50 rounded-xl`}>
                    <stat.icon className={`w-6 h-6 text-${stat.color}-600 dark:text-${stat.color}-400`} />
                  </div>
                  <span className="text-sm text-green-600 dark:text-green-400 font-medium">
                    {stat.change}
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                  {stat.value}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {stat.title}
                </p>
              </motion.div>
            ))}
          </div>

          {/* 최근 활동 */}
          <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5" />
              최근 활동
            </h2>
            <div className="space-y-3">
              {recentSessions.slice(0, 5).map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    {getLoginMethodIcon(session.loginMethod)}
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {session.user.name}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {session.user.email}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {new Date(session.createdAt).toLocaleString('ko-KR')}
                    </p>
                    <span className={`inline-block w-2 h-2 rounded-full ${
                      session.isActive ? 'bg-green-500' : 'bg-gray-400'
                    }`} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'sessions' && (
        <div className="space-y-6">
          {/* 세션 목록 */}
          <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Clock className="w-5 h-5" />
                활성 세션 ({recentSessions.filter(s => s.isActive).length})
              </h2>
              <div className="flex gap-2">
                <button className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-all">
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">내보내기</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">사용자</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">로그인 방법</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">IP 주소</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">생성 시간</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">만료 시간</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">상태</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">작업</th>
                  </tr>
                </thead>
                <tbody>
                  {recentSessions.map((session) => (
                    <tr key={session.id} className="border-b border-gray-100 dark:border-gray-800">
                      <td className="py-4 px-4">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {session.user.name}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {session.user.email}
                          </p>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          {getLoginMethodIcon(session.loginMethod)}
                          <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">
                            {session.loginMethod}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-600 dark:text-gray-400">
                        {session.ipAddress}
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-600 dark:text-gray-400">
                        {new Date(session.createdAt).toLocaleString('ko-KR')}
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-600 dark:text-gray-400">
                        {new Date(session.expiresAt).toLocaleString('ko-KR')}
                      </td>
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                          session.isActive
                            ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            session.isActive ? 'bg-green-500' : 'bg-gray-400'
                          }`} />
                          {session.isActive ? '활성' : '만료됨'}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex gap-2">
                          <button
                            className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all"
                            title="상세보기"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {session.isActive && (
                            <button
                              onClick={() => terminateSession(session.id)}
                              className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/50 rounded-lg transition-all"
                              title="세션 종료"
                            >
                              <AlertTriangle className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'security' && (
        <div className="space-y-6">
          {/* 보안 설정 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Key className="w-5 h-5" />
                패스키 관리
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 dark:text-gray-300">패스키 등록 허용</span>
                  <input type="checkbox" defaultChecked className="rounded" />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 dark:text-gray-300">자동 등록 프롬프트</span>
                  <input type="checkbox" defaultChecked className="rounded" />
                </div>
                <button className="w-full px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all">
                  설정 저장
                </button>
              </div>
            </div>

            <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5" />
                2단계 인증
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 dark:text-gray-300">2FA 강제 활성화</span>
                  <input type="checkbox" className="rounded" />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 dark:text-gray-300">관리자 2FA 필수</span>
                  <input type="checkbox" defaultChecked className="rounded" />
                </div>
                <button className="w-full px-4 py-2 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-all">
                  설정 저장
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="space-y-6">
          {/* 시스템 설정 */}
          <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <Settings className="w-5 h-5" />
              시스템 설정
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="font-medium text-gray-900 dark:text-white">세션 설정</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                      세션 만료 시간 (초)
                    </label>
                    <input
                      type="number"
                      defaultValue={604800}
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                      세션 업데이트 주기 (초)
                    </label>
                    <input
                      type="number"
                      defaultValue={86400}
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-medium text-gray-900 dark:text-white">보안 설정</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-700 dark:text-gray-300">CSRF 보호</span>
                    <input type="checkbox" defaultChecked className="rounded" />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-700 dark:text-gray-300">크로스 도메인 쿠키</span>
                    <input type="checkbox" className="rounded" />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-700 dark:text-gray-300">Secure 쿠키</span>
                    <input type="checkbox" defaultChecked className="rounded" />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button className="px-6 py-2 bg-indigo-500 text-white rounded-xl hover:bg-indigo-600 transition-all">
                설정 저장
              </button>
            </div>
          </div>

          {/* 데이터베이스 관리 */}
          <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <Database className="w-5 h-5" />
              데이터베이스 관리
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button className="flex items-center justify-center gap-2 p-4 bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/70 transition-all">
                <Download className="w-5 h-5" />
                데이터 백업
              </button>
              <button className="flex items-center justify-center gap-2 p-4 bg-green-50 dark:bg-green-900/50 text-green-700 dark:text-green-300 rounded-xl hover:bg-green-100 dark:hover:bg-green-900/70 transition-all">
                <Upload className="w-5 h-5" />
                데이터 복원
              </button>
              <button className="flex items-center justify-center gap-2 p-4 bg-purple-50 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 rounded-xl hover:bg-purple-100 dark:hover:bg-purple-900/70 transition-all">
                <Database className="w-5 h-5" />
                스키마 마이그레이션
              </button>
            </div>
          </div>
        </div>
      )}

      {isLoading && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 flex items-center gap-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-500"></div>
            <span className="text-gray-700 dark:text-gray-300">데이터 로드 중...</span>
          </div>
        </div>
      )}
    </div>
  );
}