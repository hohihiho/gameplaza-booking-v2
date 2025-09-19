// 회원 관리 페이지
// 비전공자 설명: 관리자가 모든 회원을 조회하고 관리하는 페이지입니다
'use client';

import { useState, useEffect } from 'react';
import { supabase, supabaseAdmin } from '@/lib/db/dummy-client'; // 임시 더미 클라이언트
import { motion } from 'framer-motion';
import { 
  Search,
  ChevronLeft,
  Mail,
  Calendar,
  UserCheck,
  Ban,
  Shield,
  Eye,
  Hash,
  User,
  ChevronRight,
  Gamepad2,
  UserX,
  MessageCircle
} from 'lucide-react';
import { useRouter } from 'next/navigation';
// Supabase 제거됨 - Cloudflare D1 사용
import useToast from '@/hooks/useToast';

type UserType = {
  id: string;
  email: string;
  name: string;
  nickname?: string;
  phone: string;
  created_at: string;
  is_banned: boolean;
  is_blacklisted: boolean;
  is_admin: boolean;
  role: 'user' | 'admin' | 'super_admin';
  no_show_count: number;
  admin_notes?: string;
  total_reservations?: number;
  recent_reservation?: {
    date: string;
    device_name: string;
    status: string;
  };
};

export default function UsersPage() {
  const router = useRouter();
  const toast = useToast();
  
  // 상태 관리
  const [users, setUsers] = useState<UserType[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'banned' | 'admin' | 'regular'>('all');
  
  // 페이지네이션
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // 사용자 목록 가져오기
  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      // API를 통해 사용자 목록 가져오기
      const response = await fetch('/api/admin/users', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // 쿠키 포함
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API 에러:', response.status, errorText);
        throw new Error(`사용자 목록을 가져오는데 실패했습니다: ${response.status}`);
      }

      const data = await response.json();
      const usersData = data.users || [];

      // API에서 이미 통계 정보가 포함되어 있으므로 추가 쿼리 불필요
      // 이름순으로 정렬 (가나다/ABC)
      const sortedUsers = usersData.sort((a: UserType, b: UserType) => {
        return a.name.localeCompare(b.name, 'ko');
      });
      
      setUsers(sortedUsers);
      setFilteredUsers(sortedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 검색 및 필터링
  useEffect(() => {
    let filtered = [...users];

    // 검색 필터
    if (searchQuery) {
      filtered = filtered.filter(user => 
        user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.nickname?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // 타입 필터
    switch (filterType) {
      case 'banned':
        filtered = filtered.filter(user => user.is_blacklisted);
        break;
      case 'admin':
        filtered = filtered.filter(user => user.role === 'admin');
        break;
      case 'regular':
        filtered = filtered.filter(user => user.role !== 'admin' && !user.is_blacklisted);
        break;
    }

    // 필터링 후에도 이름순 정렬 유지
    filtered.sort((a, b) => a.name.localeCompare(b.name, 'ko'));
    
    setFilteredUsers(filtered);
    setCurrentPage(1);
  }, [searchQuery, filterType, users]);

  // 초기 로드
  useEffect(() => {
    // 현재 사용자 정보 확인
    const checkUserAndFetch = async () => {
      // const supabase = getDb() // D1 사용;
      const { data: { user } } = await supabase.auth.getUser();
      console.log('현재 사용자:', user);
      
      if (user) {
        // users 테이블에서 role 확인
        const { data: userData } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single();
        console.log('사용자 role:', userData);
      }
      
      await fetchUsers();
    };
    
    checkUserAndFetch();
  }, []);

  // 사용자 차단/해제 함수는 향후 구현 예정

  // 페이지네이션 계산
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentUsers = filteredUsers.slice(startIndex, endIndex);

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
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              회원 관리
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
              전체 {users.length}명의 회원
            </p>
          </div>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div>
        {/* 검색 및 필터 */}
        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-4 sm:p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* 검색 */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="이름, 닉네임, 이메일, 전화번호로 검색"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition-all"
                />
              </div>
            </div>

            {/* 필터 */}
            <div className="flex gap-2">
              {[
                { value: 'all', label: '전체', icon: User },
                { value: 'regular', label: '일반', icon: UserCheck },
                { value: 'admin', label: '관리자', icon: Shield },
                { value: 'banned', label: '차단', icon: Ban }
              ].map((filter) => (
                <button
                  key={filter.value}
                  onClick={() => setFilterType(filter.value as any)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
                    filterType === filter.value
                      ? 'bg-indigo-500 text-white shadow-lg'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  <filter.icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{filter.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 사용자 목록 */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
          </div>
        ) : currentUsers.length === 0 ? (
          <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-12 text-center">
            <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">검색 결과가 없습니다.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {currentUsers.map((user, index) => (
              <motion.div
                key={user.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.15, delay: Math.min(index * 0.01, 0.1) }}
                className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-4 sm:p-6 hover:shadow-lg transition-all duration-200"
              >
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  {/* 사용자 정보 */}
                  <div className="flex-1">
                    <div className="flex items-start gap-4">
                      {/* 프로필 아이콘 */}
                      <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                        {user.nickname?.[0] || user.name?.[0] || 'U'}
                      </div>

                      {/* 정보 */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h3 className="font-bold text-gray-900 dark:text-white truncate">
                            {user.nickname || user.name}
                          </h3>
                          {user.nickname && user.name && (
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              ({user.name})
                            </span>
                          )}
                          {user.role === 'admin' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 text-xs font-medium rounded-full">
                              <Shield className="w-3 h-3" />
                              관리자
                            </span>
                          )}
                          {user.is_blacklisted && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 text-xs font-medium rounded-full">
                              <Ban className="w-3 h-3" />
                              차단됨
                            </span>
                          )}
                          {user.no_show_count && user.no_show_count > 0 && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300 text-xs font-medium rounded-full">
                              <UserX className="w-3 h-3" />
                              노쇼 {user.no_show_count}회
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                            <Mail className="w-4 h-4" />
                            <span className="truncate">{user.email}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                            <Calendar className="w-4 h-4" />
                            <span>가입: {new Date(user.created_at).toLocaleDateString('ko-KR')}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                            <Hash className="w-4 h-4" />
                            <span>예약: {user.total_reservations}건</span>
                          </div>
                          {user.admin_notes && (
                            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                              <MessageCircle className="w-4 h-4" />
                              <span>메모 있음</span>
                            </div>
                          )}
                        </div>

                        {/* 최근 예약 */}
                        {user.recent_reservation && (
                          <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">최근 예약</p>
                            <div className="flex items-center gap-2 text-sm">
                              <Gamepad2 className="w-4 h-4 text-gray-400" />
                              <span className="text-gray-700 dark:text-gray-300">
                                {user.recent_reservation.device_name}
                              </span>
                              <span className="text-gray-400">•</span>
                              <span className="text-gray-600 dark:text-gray-400">
                                {new Date(user.recent_reservation.date).toLocaleDateString('ko-KR')}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 액션 버튼 */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        console.log('사용자 상세보기 클릭:', user.id, user.name);
                        if (!user.id) {
                          toast.error('사용자 ID가 없습니다.');
                          return;
                        }
                        router.push(`/admin/users/${user.id}`);
                      }}
                      className="flex items-center justify-center p-2.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
                      title="상세보기"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* 페이지네이션 */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-10 h-10 rounded-lg font-medium transition-all ${
                      currentPage === pageNum
                        ? 'bg-indigo-500 text-white shadow-lg'
                        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}