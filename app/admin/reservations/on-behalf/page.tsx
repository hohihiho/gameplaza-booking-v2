'use client';

import { useState, useEffect } from 'react';
import { Search, User, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useDebounce } from '@/lib/hooks/use-debounce';

interface UserProfile {
  id: string;
  email: string;
  name: string;
  phone: string;
  birth_date: string;
  last_login_at?: string;
  created_at: string;
}

export default function OnBehalfReservationPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // 사용자 검색
  useEffect(() => {
    if (debouncedSearchQuery.length < 2) {
      setUsers([]);
      return;
    }

    const searchUsers = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/admin/users/search?q=${encodeURIComponent(debouncedSearchQuery)}`);
        if (response.ok) {
          const data = await response.json();
          setUsers(data.users);
        }
      } catch (error) {
        console.error('사용자 검색 오류:', error);
      } finally {
        setLoading(false);
      }
    };

    searchUsers();
  }, [debouncedSearchQuery]);

  // 사용자 선택 후 예약 페이지로 이동
  const handleUserSelect = (user: UserProfile) => {
    // 대리 예약 모드로 예약 페이지 이동
    router.push(`/reservations/new?onBehalf=${user.id}&userName=${encodeURIComponent(user.name)}`);
  };

  // 나이 계산
  const calculateAge = (birthDate: string) => {
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  // 최근 로그인 시간 포맷
  const formatLastLogin = (dateString?: string) => {
    if (!dateString) return '로그인 기록 없음';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return '오늘';
    if (diffDays === 1) return '어제';
    if (diffDays < 7) return `${diffDays}일 전`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}주 전`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)}개월 전`;
    return `${Math.floor(diffDays / 365)}년 전`;
  };

  return (
    <div className="container max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          대리 예약
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          다른 사용자를 대신하여 예약을 생성할 수 있습니다
        </p>
      </div>

      {/* 검색 박스 */}
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="이름, 이메일 또는 전화번호로 검색..."
            className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg 
                     bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                     focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          최소 2글자 이상 입력하세요
        </p>
      </div>

      {/* 검색 결과 */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      ) : users.length > 0 ? (
        <div className="space-y-3">
          {users.map((user) => {
            const age = calculateAge(user.birth_date);
            const isYouth = age < 16;
            
            return (
              <button
                key={user.id}
                onClick={() => handleUserSelect(user)}
                className="w-full bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 
                         dark:border-gray-800 p-6 hover:border-indigo-500 dark:hover:border-indigo-400 
                         transition-all text-left group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-full">
                      <User className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                    </div>
                    
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {user.name}
                        </h3>
                        {isYouth && (
                          <span className="px-2 py-0.5 text-xs bg-amber-100 dark:bg-amber-900/30 
                                         text-amber-700 dark:text-amber-400 rounded-full">
                            청소년
                          </span>
                        )}
                      </div>
                      
                      <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                        <p>{user.email}</p>
                        <p>{user.phone}</p>
                        <div className="flex items-center gap-4 text-xs">
                          <span>만 {age}세</span>
                          <span>•</span>
                          <span>마지막 로그인: {formatLastLogin(user.last_login_at)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-indigo-600 
                                         dark:group-hover:text-indigo-400 transition-colors" />
                </div>
              </button>
            );
          })}
        </div>
      ) : searchQuery.length >= 2 && !loading ? (
        <div className="text-center py-12">
          <User className="w-12 h-12 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">
            검색 결과가 없습니다
          </p>
        </div>
      ) : (
        <div className="text-center py-12">
          <Search className="w-12 h-12 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">
            사용자를 검색하여 대리 예약을 시작하세요
          </p>
        </div>
      )}
    </div>
  );
}