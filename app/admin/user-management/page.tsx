'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ChevronLeft,
  Users,
  Crown,
  Shield,
  User,
  Search,
  Filter,
  Settings,
  Ban,
  CheckCircle,
  AlertTriangle,
  Eye,
  Edit,
  Trash2,
  UserPlus,
  UserMinus,
  Star,
  Award,
  Lock,
  Unlock,
  Clock,
  Calendar
} from 'lucide-react';
import { useRouter } from 'next/navigation';

// 6단계 회원 등급 시스템
type UserRole = 'super_admin' | 'admin' | 'vip_member' | 'gold_member' | 'silver_member' | 'regular_member';
type UserStatus = 'active' | 'restricted' | 'suspended' | 'banned';

interface UserData {
  id: string;
  name: string;
  nickname?: string;
  email: string;
  phone?: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  lastLoginAt?: string;
  totalReservations: number;
  completedReservations: number;
  cancelledReservations: number;
  noShowCount: number;
  points: number;
  restrictions: UserRestriction[];
  membershipExpiry?: string;
}

interface UserRestriction {
  type: 'reservation' | 'device_access' | 'time_limit' | 'feature_access';
  value: string;
  reason: string;
  createdBy: string;
  createdAt: string;
  expiresAt?: string;
}

export default function UserManagementPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [users, setUsers] = useState<UserData[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<UserStatus | 'all'>('all');
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showRoleChangeModal, setShowRoleChangeModal] = useState(false);
  const [showRestrictionModal, setShowRestrictionModal] = useState(false);

  // 사용자 목록 가져오기
  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/user-management', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
        setFilteredUsers(data.users || []);
      }
    } catch (error) {
      console.error('사용자 목록 조회 오류:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 역할 변경
  const changeUserRole = async (userId: string, newRole: UserRole) => {
    try {
      const response = await fetch(`/api/admin/user-management/${userId}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ role: newRole })
      });

      if (response.ok) {
        await fetchUsers();
        setShowRoleChangeModal(false);
      }
    } catch (error) {
      console.error('역할 변경 오류:', error);
    }
  };

  // 사용자 상태 변경
  const changeUserStatus = async (userId: string, newStatus: UserStatus, reason?: string) => {
    try {
      const response = await fetch(`/api/admin/user-management/${userId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus, reason })
      });

      if (response.ok) {
        await fetchUsers();
      }
    } catch (error) {
      console.error('상태 변경 오류:', error);
    }
  };

  // 제한 설정 추가
  const addRestriction = async (userId: string, restriction: Omit<UserRestriction, 'createdBy' | 'createdAt'>) => {
    try {
      const response = await fetch(`/api/admin/user-management/${userId}/restrictions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(restriction)
      });

      if (response.ok) {
        await fetchUsers();
        setShowRestrictionModal(false);
      }
    } catch (error) {
      console.error('제한 설정 오류:', error);
    }
  };

  // 검색 및 필터링
  useEffect(() => {
    let filtered = [...users];

    // 검색
    if (searchQuery) {
      filtered = filtered.filter(user =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.nickname?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // 역할 필터
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    // 상태 필터
    if (statusFilter !== 'all') {
      filtered = filtered.filter(user => user.status === statusFilter);
    }

    setFilteredUsers(filtered);
  }, [searchQuery, roleFilter, statusFilter, users]);

  useEffect(() => {
    fetchUsers();
  }, []);

  const getRoleConfig = (role: UserRole) => {
    const configs = {
      super_admin: { 
        label: '슈퍼관리자', 
        icon: Crown, 
        color: 'text-purple-600 bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400',
        level: 6 
      },
      admin: { 
        label: '관리자', 
        icon: Shield, 
        color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400',
        level: 5 
      },
      vip_member: { 
        label: 'VIP 회원', 
        icon: Star, 
        color: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400',
        level: 4 
      },
      gold_member: { 
        label: '골드 회원', 
        icon: Award, 
        color: 'text-orange-600 bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400',
        level: 3 
      },
      silver_member: { 
        label: '실버 회원', 
        icon: Award, 
        color: 'text-gray-600 bg-gray-100 dark:bg-gray-700/30 dark:text-gray-400',
        level: 2 
      },
      regular_member: { 
        label: '일반 회원', 
        icon: User, 
        color: 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400',
        level: 1 
      }
    };
    return configs[role];
  };

  const getStatusConfig = (status: UserStatus) => {
    const configs = {
      active: { 
        label: '정상', 
        color: 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400',
        icon: CheckCircle 
      },
      restricted: { 
        label: '제한', 
        color: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400',
        icon: Lock 
      },
      suspended: { 
        label: '정지', 
        color: 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400',
        icon: AlertTriangle 
      },
      banned: { 
        label: '영구차단', 
        color: 'text-red-800 bg-red-200 dark:bg-red-900/50 dark:text-red-300',
        icon: Ban 
      }
    };
    return configs[status];
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
              <Users className="w-8 h-8 text-indigo-600" />
              사용자 권한 관리
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
              회원 등급, 권한, 제한 설정을 관리합니다
            </p>
          </div>
        </div>
      </div>

      {/* 검색 및 필터 */}
      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-6 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* 검색 */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="이름, 닉네임, 이메일로 검색"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              />
            </div>
          </div>

          {/* 역할 필터 */}
          <div className="flex gap-2">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as UserRole | 'all')}
              className="px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            >
              <option value="all">모든 등급</option>
              <option value="super_admin">슈퍼관리자</option>
              <option value="admin">관리자</option>
              <option value="vip_member">VIP 회원</option>
              <option value="gold_member">골드 회원</option>
              <option value="silver_member">실버 회원</option>
              <option value="regular_member">일반 회원</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as UserStatus | 'all')}
              className="px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            >
              <option value="all">모든 상태</option>
              <option value="active">정상</option>
              <option value="restricted">제한</option>
              <option value="suspended">정지</option>
              <option value="banned">영구차단</option>
            </select>
          </div>
        </div>
      </div>

      {/* 사용자 목록 */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredUsers.map((user, index) => {
            const roleConfig = getRoleConfig(user.role);
            const statusConfig = getStatusConfig(user.status);
            const RoleIcon = roleConfig.icon;
            const StatusIcon = statusConfig.icon;

            return (
              <motion.div
                key={user.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-6 hover:shadow-lg transition-all"
              >
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  {/* 사용자 정보 */}
                  <div className="flex-1">
                    <div className="flex items-start gap-4">
                      {/* 프로필 */}
                      <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                        {user.nickname?.[0] || user.name?.[0] || 'U'}
                      </div>

                      {/* 정보 */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                          <h3 className="font-bold text-gray-900 dark:text-white text-lg">
                            {user.nickname || user.name}
                          </h3>
                          {user.nickname && user.name && (
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              ({user.name})
                            </span>
                          )}
                          
                          {/* 역할 배지 */}
                          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${roleConfig.color}`}>
                            <RoleIcon className="w-4 h-4" />
                            {roleConfig.label}
                          </span>

                          {/* 상태 배지 */}
                          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${statusConfig.color}`}>
                            <StatusIcon className="w-4 h-4" />
                            {statusConfig.label}
                          </span>

                          {/* 제한 개수 */}
                          {user.restrictions.length > 0 && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 text-xs font-medium rounded-full">
                              <Lock className="w-3 h-3" />
                              제한 {user.restrictions.length}개
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                            <span>📧 {user.email}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                            <Calendar className="w-4 h-4" />
                            <span>가입: {new Date(user.createdAt).toLocaleDateString('ko-KR')}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                            <Clock className="w-4 h-4" />
                            <span>최근: {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString('ko-KR') : '없음'}</span>
                          </div>
                        </div>

                        {/* 통계 */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-4 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                          <div className="text-center">
                            <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400">{user.totalReservations}</p>
                            <p className="text-xs text-gray-500">총 예약</p>
                          </div>
                          <div className="text-center">
                            <p className="text-lg font-bold text-green-600 dark:text-green-400">{user.completedReservations}</p>
                            <p className="text-xs text-gray-500">완료</p>
                          </div>
                          <div className="text-center">
                            <p className="text-lg font-bold text-red-600 dark:text-red-400">{user.noShowCount}</p>
                            <p className="text-xs text-gray-500">노쇼</p>
                          </div>
                          <div className="text-center">
                            <p className="text-lg font-bold text-yellow-600 dark:text-yellow-400">{user.points.toLocaleString()}</p>
                            <p className="text-xs text-gray-500">포인트</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 액션 버튼 */}
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => {
                        setSelectedUser(user);
                        setShowUserModal(true);
                      }}
                      className="flex items-center gap-2 px-3 py-2 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/70 transition-all"
                      title="상세보기"
                    >
                      <Eye className="w-4 h-4" />
                      <span className="text-sm">상세</span>
                    </button>
                    
                    <button
                      onClick={() => {
                        setSelectedUser(user);
                        setShowRoleChangeModal(true);
                      }}
                      className="flex items-center gap-2 px-3 py-2 bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/70 transition-all"
                      title="등급 변경"
                    >
                      <Crown className="w-4 h-4" />
                      <span className="text-sm">등급</span>
                    </button>
                    
                    <button
                      onClick={() => {
                        setSelectedUser(user);
                        setShowRestrictionModal(true);
                      }}
                      className="flex items-center gap-2 px-3 py-2 bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300 rounded-lg hover:bg-orange-200 dark:hover:bg-orange-900/70 transition-all"
                      title="제한 설정"
                    >
                      <Settings className="w-4 h-4" />
                      <span className="text-sm">제한</span>
                    </button>
                    
                    {user.status === 'active' ? (
                      <button
                        onClick={() => changeUserStatus(user.id, 'suspended', '관리자 조치')}
                        className="flex items-center gap-2 px-3 py-2 bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/70 transition-all"
                        title="계정 정지"
                      >
                        <Ban className="w-4 h-4" />
                        <span className="text-sm">정지</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => changeUserStatus(user.id, 'active')}
                        className="flex items-center gap-2 px-3 py-2 bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/70 transition-all"
                        title="계정 활성화"
                      >
                        <Unlock className="w-4 h-4" />
                        <span className="text-sm">활성화</span>
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* 로딩 오버레이 */}
      {isLoading && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 flex items-center gap-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-500"></div>
            <span className="text-gray-700 dark:text-gray-300">사용자 정보 로드 중...</span>
          </div>
        </div>
      )}

      {/* 모달들은 향후 구현 */}
    </div>
  );
}