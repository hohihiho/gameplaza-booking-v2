'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Monitor, 
  Smartphone, 
  Globe,
  Trash2,
  RefreshCw,
  Search,
  Clock,
  MapPin,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { useSession } from '@/lib/auth/client';

interface SessionInfo {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  device: 'desktop' | 'mobile' | 'tablet';
  browser: string;
  os: string;
  location: string;
  ipAddress: string;
  createdAt: string;
  lastActivity: string;
  isActive: boolean;
  isCurrent?: boolean;
}

interface SessionStats {
  totalSessions: number;
  activeSessions: number;
  desktopSessions: number;
  mobileSessions: number;
}

export default function SessionManagementPage() {
  const { data: session, isPending } = useSession();
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [stats, setStats] = useState<SessionStats>({
    totalSessions: 0,
    activeSessions: 0,
    desktopSessions: 0,
    mobileSessions: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchSessionData();
  }, []);

  const fetchSessionData = async () => {
    setLoading(true);
    try {
      // TODO: Better Auth API 연동
      // 현재는 더미 데이터로 구현
      const dummySessions: SessionInfo[] = [
        {
          id: 'session-1',
          userId: '1',
          userEmail: 'admin@gameplaza.kr',
          userName: '관리자',
          device: 'desktop',
          browser: 'Chrome 119',
          os: 'macOS Sonoma',
          location: '서울, 대한민국',
          ipAddress: '192.168.1.100',
          createdAt: '2025-09-06T08:00:00Z',
          lastActivity: '2025-09-06T09:00:00Z',
          isActive: true,
          isCurrent: true
        },
        {
          id: 'session-2',
          userId: '2',
          userEmail: 'user1@example.com',
          userName: '홍길동',
          device: 'mobile',
          browser: 'Safari 17',
          os: 'iOS 17.1',
          location: '부산, 대한민국',
          ipAddress: '192.168.1.101',
          createdAt: '2025-09-06T07:30:00Z',
          lastActivity: '2025-09-06T08:45:00Z',
          isActive: true
        },
        {
          id: 'session-3',
          userId: '3',
          userEmail: 'user2@example.com',
          userName: '김철수',
          device: 'desktop',
          browser: 'Firefox 118',
          os: 'Windows 11',
          location: '대구, 대한민국',
          ipAddress: '192.168.1.102',
          createdAt: '2025-09-05T16:45:00Z',
          lastActivity: '2025-09-05T18:20:00Z',
          isActive: false
        },
        {
          id: 'session-4',
          userId: '2',
          userEmail: 'user1@example.com',
          userName: '홍길동',
          device: 'desktop',
          browser: 'Chrome 119',
          os: 'macOS Ventura',
          location: '부산, 대한민국',
          ipAddress: '192.168.1.103',
          createdAt: '2025-09-05T14:20:00Z',
          lastActivity: '2025-09-05T16:45:00Z',
          isActive: false
        }
      ];

      const dummyStats: SessionStats = {
        totalSessions: dummySessions.length,
        activeSessions: dummySessions.filter(s => s.isActive).length,
        desktopSessions: dummySessions.filter(s => s.device === 'desktop').length,
        mobileSessions: dummySessions.filter(s => s.device === 'mobile').length
      };

      setSessions(dummySessions);
      setStats(dummyStats);
    } catch (error) {
      console.error('Failed to fetch session data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    try {
      // TODO: Better Auth API 호출하여 세션 무효화
      console.log('Revoking session:', sessionId);
      setSessions(prev => prev.filter(s => s.id !== sessionId));
    } catch (error) {
      console.error('Failed to revoke session:', error);
    }
  };

  const filteredSessions = sessions.filter(session =>
    session.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
    session.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    session.browser.toLowerCase().includes(searchTerm.toLowerCase()) ||
    session.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDeviceIcon = (device: string) => {
    switch (device) {
      case 'desktop':
        return <Monitor className="w-4 h-4" />;
      case 'mobile':
        return <Smartphone className="w-4 h-4" />;
      default:
        return <Globe className="w-4 h-4" />;
    }
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes}분 전`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}시간 전`;
    } else {
      return `${Math.floor(diffInMinutes / 1440)}일 전`;
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <RefreshCw className="w-6 h-6 animate-spin" />
          <span className="ml-2">세션 데이터 로딩 중...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">활성 세션</h2>
          <p className="text-muted-foreground">사용자 접속 현황 및 세션 관리</p>
        </div>
        <Button onClick={fetchSessionData} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          새로고침
        </Button>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">전체 세션</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSessions}</div>
            <p className="text-xs text-muted-foreground">
              총 세션 수
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">활성 세션</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeSessions}</div>
            <p className="text-xs text-muted-foreground">
              현재 활성 상태
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">데스크톱</CardTitle>
            <Monitor className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.desktopSessions}</div>
            <p className="text-xs text-muted-foreground">
              데스크톱 접속
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">모바일</CardTitle>
            <Smartphone className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.mobileSessions}</div>
            <p className="text-xs text-muted-foreground">
              모바일 접속
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 세션 목록 */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>활성 세션 목록</CardTitle>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="사용자, 브라우저, 위치 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-80"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredSessions.map((sessionInfo) => (
              <div
                key={sessionInfo.id}
                className={`p-4 border rounded-lg ${
                  sessionInfo.isCurrent ? 'bg-blue-50 border-blue-200' : 'hover:bg-muted/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      {getDeviceIcon(sessionInfo.device)}
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{sessionInfo.userName}</span>
                          {sessionInfo.isCurrent && (
                            <Badge variant="default">현재 세션</Badge>
                          )}
                          {sessionInfo.isActive ? (
                            <Badge variant="default" className="bg-green-600">
                              활성
                            </Badge>
                          ) : (
                            <Badge variant="secondary">비활성</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{sessionInfo.userEmail}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    {!sessionInfo.isCurrent && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRevokeSession(sessionInfo.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        세션 종료
                      </Button>
                    )}
                  </div>
                </div>
                
                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center space-x-2">
                    <Globe className="w-4 h-4" />
                    <span>{sessionInfo.browser}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Monitor className="w-4 h-4" />
                    <span>{sessionInfo.os}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4" />
                    <span>{sessionInfo.location}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4" />
                    <span>최근 활동: {getTimeAgo(sessionInfo.lastActivity)}</span>
                  </div>
                </div>
                
                <div className="mt-2 text-xs text-muted-foreground">
                  <div className="flex justify-between">
                    <span>세션 시작: {formatDate(sessionInfo.createdAt)}</span>
                    <span>IP: {sessionInfo.ipAddress}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredSessions.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <AlertTriangle className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>세션이 없습니다.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}