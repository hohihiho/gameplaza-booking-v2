'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Users, 
  UserCheck, 
  Shield, 
  Activity,
  Clock,
  RefreshCw,
  Search,
  MoreVertical,
  Eye,
  UserX
} from 'lucide-react';
import { useSession } from '@/lib/auth/client';

interface UserInfo {
  id: string;
  email: string;
  name: string;
  image?: string;
  createdAt: string;
  emailVerified: boolean;
  role?: string;
  lastLogin?: string;
  sessionsCount: number;
}

interface AuthStats {
  totalUsers: number;
  activeUsers: number;
  newUsersToday: number;
  totalSessions: number;
}

export default function AuthManagementPage() {
  const { data: session, isPending } = useSession();
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [stats, setStats] = useState<AuthStats>({
    totalUsers: 0,
    activeUsers: 0,
    newUsersToday: 0,
    totalSessions: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserInfo | null>(null);

  // 실제 구현에서는 Better Auth API를 호출
  useEffect(() => {
    fetchAuthData();
  }, []);

  const fetchAuthData = async () => {
    setLoading(true);
    try {
      // TODO: Better Auth API 연동
      // 현재는 더미 데이터로 구현
      const dummyStats: AuthStats = {
        totalUsers: 42,
        activeUsers: 15,
        newUsersToday: 3,
        totalSessions: 28
      };

      const dummyUsers: UserInfo[] = [
        {
          id: '1',
          email: 'admin@gameplaza.kr',
          name: '관리자',
          image: '',
          createdAt: '2025-09-01T10:00:00Z',
          emailVerified: true,
          role: 'admin',
          lastLogin: '2025-09-06T08:30:00Z',
          sessionsCount: 5
        },
        {
          id: '2',
          email: 'user1@example.com',
          name: '홍길동',
          image: '',
          createdAt: '2025-09-03T14:20:00Z',
          emailVerified: true,
          role: 'user',
          lastLogin: '2025-09-06T07:15:00Z',
          sessionsCount: 2
        },
        {
          id: '3',
          email: 'user2@example.com',
          name: '김철수',
          image: '',
          createdAt: '2025-09-05T16:45:00Z',
          emailVerified: false,
          role: 'user',
          lastLogin: '2025-09-05T16:45:00Z',
          sessionsCount: 1
        }
      ];

      setStats(dummyStats);
      setUsers(dummyUsers);
    } catch (error) {
      console.error('Failed to fetch auth data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.name.toLowerCase().includes(searchTerm.toLowerCase())
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

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <RefreshCw className="w-6 h-6 animate-spin" />
          <span className="ml-2">인증 데이터 로딩 중...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">사용자 현황</h2>
          <p className="text-muted-foreground">가입자 통계 및 관리</p>
        </div>
        <Button onClick={fetchAuthData} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          새로고침
        </Button>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">전체 사용자</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              등록된 전체 회원 수
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">활성 사용자</CardTitle>
            <UserCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeUsers}</div>
            <p className="text-xs text-muted-foreground">
              최근 7일 내 로그인
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">신규 가입</CardTitle>
            <Activity className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.newUsersToday}</div>
            <p className="text-xs text-muted-foreground">
              오늘 신규 가입자
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">활성 세션</CardTitle>
            <Shield className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSessions}</div>
            <p className="text-xs text-muted-foreground">
              현재 활성 세션 수
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 사용자 목록 */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>사용자 목록</CardTitle>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="이메일 또는 이름 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-80"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredUsers.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium">
                    {user.name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{user.name}</span>
                      {user.role === 'admin' && (
                        <Badge variant="destructive">관리자</Badge>
                      )}
                      {user.emailVerified ? (
                        <Badge variant="default">인증됨</Badge>
                      ) : (
                        <Badge variant="secondary">미인증</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                    <div className="flex items-center space-x-4 text-xs text-muted-foreground mt-1">
                      <span>가입: {formatDate(user.createdAt)}</span>
                      {user.lastLogin && (
                        <span>최근 로그인: {formatDate(user.lastLogin)}</span>
                      )}
                      <span>세션: {user.sessionsCount}개</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedUser(user)}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <UserX className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>검색 결과가 없습니다.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 최근 활동 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="w-5 h-5 mr-2" />
            최근 인증 활동
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <div>
                <p className="font-medium">새로운 사용자 가입</p>
                <p className="text-sm text-muted-foreground">김철수 (user2@example.com)</p>
              </div>
              <span className="text-sm text-muted-foreground">2시간 전</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <div>
                <p className="font-medium">사용자 로그인</p>
                <p className="text-sm text-muted-foreground">홍길동 (user1@example.com)</p>
              </div>
              <span className="text-sm text-muted-foreground">3시간 전</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <div>
                <p className="font-medium">관리자 로그인</p>
                <p className="text-sm text-muted-foreground">admin@gameplaza.kr</p>
              </div>
              <span className="text-sm text-muted-foreground">5시간 전</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}