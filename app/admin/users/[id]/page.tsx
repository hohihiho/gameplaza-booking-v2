// 회원 상세 페이지
// 비전공자 설명: 특정 회원의 상세 정보와 예약 내역을 보는 페이지입니다
'use client';

import { useState, useEffect } from 'react';
import { 
  ChevronLeft,
  Phone,
  Mail,
  Calendar,
  Shield,
  Ban,
  Edit,
  Save,
  X,
  Gamepad2,
  Clock,
  DollarSign,
  CheckCircle,
  XCircle,
  Timer,
  User,
  AlertCircle,
  MessageSquare,
  UserX,
  ShieldCheck
} from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';

type UserDetail = {
  id: string;
  email: string;
  name: string;
  nickname?: string;
  phone?: string;
  created_at: string;
  is_blacklisted: boolean;
  is_banned?: boolean;
  role: string;
  admin_notes?: string;
  no_show_count?: number;
  isAdmin?: boolean;
  isSuperAdmin?: boolean;
};

type ReservationType = {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  status: string;
  total_amount: number;
  device: {
    device_number: number;
    device_type: {
      name: string;
      model_name?: string;
    };
  };
};

// 24시간 이상 시간 포맷팅
const formatTime = (time: string) => {
  if (!time) return '';
  const [hour, minute] = time.split(':');
  if (!hour) return '';
  const h = parseInt(hour);
  // 0~5시는 24~29시로 표시
  if (h >= 0 && h <= 5) {
    return `${h + 24}:${minute || '00'}`;
  }
  return `${hour}:${minute || '00'}`;
};

// 상태별 스타일
const getStatusStyle = (status: string) => {
  switch (status) {
    case 'pending':
      return 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300';
    case 'approved':
      return 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300';
    case 'checked_in':
      return 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300';
    case 'cancelled':
    case 'rejected':
      return 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300';
    default:
      return 'bg-gray-100 dark:bg-gray-900/50 text-gray-700 dark:text-gray-300';
  }
};

// 상태 아이콘
const getStatusIcon = (status: string) => {
  switch (status) {
    case 'pending':
      return Timer;
    case 'approved':
      return CheckCircle;
    case 'checked_in':
      return User;
    case 'cancelled':
    case 'rejected':
      return XCircle;
    default:
      return AlertCircle;
  }
};

// 상태 텍스트
const getStatusText = (status: string) => {
  switch (status) {
    case 'pending': return '대기중';
    case 'approved': return '승인됨';
    case 'checked_in': return '체크인';
    case 'cancelled': return '취소됨';
    case 'rejected': return '거절됨';
    default: return status;
  }
};

export default function UserDetailPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;
  
  // 상태 관리
  const [user, setUser] = useState<UserDetail | null>(null);
  const [reservations, setReservations] = useState<ReservationType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedUser, setEditedUser] = useState<Partial<UserDetail>>({});
  const [activeTab, setActiveTab] = useState<'info' | 'reservations' | 'admin'>('info');
  const [adminNotes, setAdminNotes] = useState('');
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  // 사용자 정보 및 예약 내역 가져오기
  const fetchUserData = async () => {
    setIsLoading(true);
    try {
      // API를 통해 사용자 정보 조회
      const response = await fetch(`/api/admin/users/${userId}`);
      
      if (!response.ok) {
        const error = await response.json();
        console.error('사용자 정보 조회 오류:', error);
        
        if (response.status === 404) {
          alert('해당 사용자를 찾을 수 없습니다.');
          router.back();
          return;
        }
        
        alert(`사용자 정보를 불러올 수 없습니다: ${error.error || '알 수 없는 오류'}`);
        router.back();
        return;
      }
      
      const data = await response.json();
      const userData = data.user;
      
      // API 응답에서 사용자 역할 정보 사용
      const userWithRole = {
        ...userData,
        role: userData.isAdmin ? 'admin' : 'user',
        is_blacklisted: userData.is_banned || false
      };
      
      setUser(userWithRole);
      setEditedUser(userWithRole);
      setAdminNotes(userData.notes || userData.admin_notes || '');

      // API 응답에서 예약 데이터 사용
      const reservationsData = data.reservations || [];
      
      // 각 예약 데이터 포맷팅
      const formattedReservations = reservationsData.map((res: any) => {
        let deviceInfo = null;
        if (res.devices) {
          deviceInfo = {
            device_number: res.devices.device_number,
            device_type: res.devices.device_types
          };
        }
        
        return {
          id: res.id,
          date: res.date,
          start_time: res.start_time,
          end_time: res.end_time,
          status: res.status,
          total_amount: res.total_amount || 0,
          device: {
            device_number: deviceInfo?.device_number || 0,
            device_type: {
              name: deviceInfo?.device_type?.name || '기기 정보 없음',
              model_name: deviceInfo?.device_type?.model_name || ''
            }
          }
        };
      });

      setReservations(formattedReservations);
    } catch (error) {
      console.error('Error fetching user data:', error);
      console.error('Error details:', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  // 초기 로드
  useEffect(() => {
    if (userId) {
      fetchUserData();
    }
  }, [userId]);

  // 사용자 정보 수정
  const handleSaveUser = async () => {
    try {
//       import { getDB, supabase } from '@/lib/db';
  const { error } = await supabase.from('users')
        .update({
          nickname: editedUser.nickname,
          phone: editedUser.phone || null
        })
        .eq('id', userId);

      if (error) throw error;

      setUser({ ...user!, ...editedUser });
      setIsEditMode(false);
      alert('저장되었습니다.');
    } catch (error) {
      console.error('Error updating user:', error);
      alert('저장에 실패했습니다.');
    }
  };

  // 차단 상태 토글
  const toggleBanStatus = async () => {
    if (!user) return;
    
    try {
//       import { getDB, supabase } from '@/lib/db';
      const { error } = await supabase.from('users')
        .update({ is_banned: !user.is_blacklisted })
        .eq('id', userId);

      if (error) throw error;

      setUser({ ...user, is_blacklisted: !user.is_blacklisted });
      alert(user.is_blacklisted ? '차단이 해제되었습니다.' : '사용자가 차단되었습니다.');
      await fetchUserData();
    } catch (error) {
      console.error('Error updating ban status:', error);
      alert('상태 변경에 실패했습니다.');
    }
  };

  // 관리자 권한 토글
  const toggleAdminStatus = async () => {
    if (!user) return;
    
    try {
//       import { getDB, supabase } from '@/lib/db';
      
      if (user.role === 'admin') {
        // 관리자 권한 제거
        const { error } = await supabase
          .from('admins')
          .delete()
          .eq('user_id', userId);
        
        if (error) throw error;
        alert('관리자 권한이 제거되었습니다.');
      } else {
        // 관리자 권한 추가
        const { error } = await supabase
          .from('admins')
          .insert({ 
            user_id: userId,
            is_super_admin: false
          });
        
        if (error) throw error;
        alert('관리자 권한이 부여되었습니다.');
      }
      
      await fetchUserData();
    } catch (error) {
      console.error('Error updating admin status:', error);
      alert('권한 변경에 실패했습니다.');
    }
  };

  // 노쇼 카운트는 이제 예약 관리에서 노쇼 처리 시 자동으로 증가합니다
  // 수동 조작 기능은 제거되었습니다

  // 관리자 메모 저장
  const saveAdminNotes = async () => {
    setIsSavingNotes(true);
    try {
//       import { getDB, supabase } from '@/lib/db';
      const { error } = await supabase.from('users')
        .update({ notes: adminNotes })
        .eq('id', userId);

      if (error) throw error;

      setIsEditingNotes(false);
      alert('메모가 저장되었습니다.');
    } catch (error) {
      console.error('Error saving admin notes:', error);
      alert('메모 저장에 실패했습니다.');
    } finally {
      setIsSavingNotes(false);
    }
  };

  // 통계 계산
  const stats = {
    totalReservations: reservations.length,
    completedReservations: reservations.filter(r => r.status === 'checked_in').length,
    cancelledReservations: reservations.filter(r => r.status === 'cancelled' || r.status === 'rejected').length,
    totalSpent: reservations
      .filter(r => r.status === 'checked_in')
      .reduce((sum, r) => sum + r.total_amount, 0)
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">사용자를 찾을 수 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      {/* 헤더 */}
      <div className="sticky top-0 z-40 bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-5">
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              onClick={() => router.push('/admin/users')}
              className="p-2 sm:p-2.5 bg-gray-100/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200 hover:scale-105"
            >
              <ChevronLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            </button>
            <div className="flex-1">
              <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent">
                회원 상세
              </h1>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                {user.nickname || user.name}님의 정보
              </p>
            </div>
            
            {/* 차단 버튼 */}
            <button
              onClick={toggleBanStatus}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
                user.is_blacklisted
                  ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/70'
                  : 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/70'
              }`}
            >
              <Ban className="w-4 h-4" />
              {user.is_blacklisted ? '차단 해제' : '차단'}
            </button>
          </div>
        </div>
      </div>

      {/* 탭 */}
      <div className="sticky top-[73px] z-30 bg-white/50 dark:bg-gray-900/50 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex gap-6">
            <button
              onClick={() => setActiveTab('info')}
              className={`py-4 px-1 font-medium text-sm border-b-2 transition-all ${
                activeTab === 'info'
                  ? 'text-indigo-600 dark:text-indigo-400 border-indigo-600 dark:border-indigo-400'
                  : 'text-gray-500 dark:text-gray-400 border-transparent hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              회원 정보
            </button>
            <button
              onClick={() => setActiveTab('reservations')}
              className={`py-4 px-1 font-medium text-sm border-b-2 transition-all ${
                activeTab === 'reservations'
                  ? 'text-indigo-600 dark:text-indigo-400 border-indigo-600 dark:border-indigo-400'
                  : 'text-gray-500 dark:text-gray-400 border-transparent hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              예약 내역 ({reservations.length})
            </button>
            <button
              onClick={() => setActiveTab('admin')}
              className={`py-4 px-1 font-medium text-sm border-b-2 transition-all ${
                activeTab === 'admin'
                  ? 'text-indigo-600 dark:text-indigo-400 border-indigo-600 dark:border-indigo-400'
                  : 'text-gray-500 dark:text-gray-400 border-transparent hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              관리자 기능
            </button>
          </div>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {activeTab === 'info' ? (
          <div className="grid gap-6">
            {/* 기본 정보 */}
            <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">기본 정보</h2>
                {!isEditMode ? (
                  <button
                    onClick={() => setIsEditMode(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded-xl hover:bg-indigo-600 transition-all"
                  >
                    <Edit className="w-4 h-4" />
                    수정
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveUser}
                      className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-all"
                    >
                      <Save className="w-4 h-4" />
                      저장
                    </button>
                    <button
                      onClick={() => {
                        setIsEditMode(false);
                        setEditedUser(user);
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-xl hover:bg-gray-600 transition-all"
                    >
                      <X className="w-4 h-4" />
                      취소
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    이름
                  </label>
                  <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                    <User className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-900 dark:text-white">{user.name}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    닉네임
                  </label>
                  {isEditMode ? (
                    <input
                      type="text"
                      value={editedUser.nickname || ''}
                      onChange={(e) => setEditedUser({ ...editedUser, nickname: e.target.value })}
                      className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="닉네임 입력"
                    />
                  ) : (
                    <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                      <User className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-900 dark:text-white">{user.nickname || '미설정'}</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    이메일
                  </label>
                  <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                    <Mail className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-900 dark:text-white">{user.email}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    전화번호
                  </label>
                  {isEditMode ? (
                    <input
                      type="tel"
                      value={editedUser.phone || ''}
                      onChange={(e) => setEditedUser({ ...editedUser, phone: e.target.value })}
                      className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="010-0000-0000"
                    />
                  ) : (
                    <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                      <Phone className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-900 dark:text-white">{user.phone || '미등록'}</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    가입일
                  </label>
                  <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-900 dark:text-white">
                      {new Date(user.created_at).toLocaleDateString('ko-KR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    상태
                  </label>
                  <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                    {user.role === 'admin' && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 text-sm font-medium rounded-full">
                        <Shield className="w-4 h-4" />
                        관리자
                      </span>
                    )}
                    {user.is_blacklisted && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 text-sm font-medium rounded-full">
                        <Ban className="w-4 h-4" />
                        차단됨
                      </span>
                    )}
                    {user.role !== 'admin' && !user.is_blacklisted && (
                      <span className="text-gray-500 dark:text-gray-400">일반 회원</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* 통계 */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">총 예약</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalReservations}</p>
                  </div>
                  <Calendar className="w-8 h-8 text-indigo-500" />
                </div>
              </div>

              <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">완료</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.completedReservations}</p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
              </div>

              <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">취소</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.cancelledReservations}</p>
                  </div>
                  <XCircle className="w-8 h-8 text-red-500" />
                </div>
              </div>

              <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">총 이용금액</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      ₩{stats.totalSpent.toLocaleString()}
                    </p>
                  </div>
                  <DollarSign className="w-8 h-8 text-emerald-500" />
                </div>
              </div>
            </div>
          </div>
        ) : activeTab === 'reservations' ? (
          <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50">
            {reservations.length === 0 ? (
              <div className="p-12 text-center">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">예약 내역이 없습니다.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {reservations.map((reservation) => {
                  const StatusIcon = getStatusIcon(reservation.status);
                  
                  return (
                    <div key={reservation.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center flex-shrink-0">
                          <Gamepad2 className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-bold text-gray-900 dark:text-white">
                              {reservation.device.device_type.name}
                              {reservation.device.device_type.model_name && ` ${reservation.device.device_type.model_name}`}
                            </h4>
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              #{reservation.device.device_number}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              <span>{new Date(reservation.date).toLocaleDateString('ko-KR')}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              <span>
                                {formatTime(reservation.start_time)} - {formatTime(reservation.end_time)}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <DollarSign className="w-4 h-4" />
                              <span>₩{reservation.total_amount.toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${getStatusStyle(reservation.status)}`}>
                          <StatusIcon className="w-4 h-4" />
                          <span>{getStatusText(reservation.status)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          // 관리자 기능 탭
          <div className="grid gap-6">
            {/* 권한 관리 */}
            <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-6">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6">권한 관리</h2>
              
              <div className="grid gap-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="w-5 h-5 text-indigo-500" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">관리자 권한</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {user.role === 'admin' ? '현재 관리자입니다' : '일반 사용자입니다'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={toggleAdminStatus}
                    className={`px-4 py-2 rounded-xl font-medium transition-all ${
                      user.role === 'admin'
                        ? 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 hover:bg-red-200'
                        : 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-200'
                    }`}
                  >
                    {user.role === 'admin' ? '권한 제거' : '권한 부여'}
                  </button>
                </div>
              </div>
            </div>

            {/* 노쇼 관리 */}
            <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-6">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6">노쇼 관리</h2>
              
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <div className="flex items-center gap-3 mb-2">
                  <UserX className="w-5 h-5 text-orange-500" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">노쇼 횟수</p>
                    <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                      {user.no_show_count || 0}회
                    </p>
                  </div>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  * 예약 관리에서 노쇼 처리 시 자동으로 카운트됩니다
                </p>
              </div>
            </div>

            {/* 관리자 메모 */}
            <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">관리자 메모</h2>
                {!isEditingNotes ? (
                  <button
                    onClick={() => setIsEditingNotes(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded-xl hover:bg-indigo-600 transition-all"
                  >
                    <Edit className="w-4 h-4" />
                    수정
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={saveAdminNotes}
                      disabled={isSavingNotes}
                      className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Save className="w-4 h-4" />
                      {isSavingNotes ? '저장 중...' : '저장'}
                    </button>
                    <button
                      onClick={() => {
                        setIsEditingNotes(false);
                        setAdminNotes(user.admin_notes || '');
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-xl hover:bg-gray-600 transition-all"
                    >
                      <X className="w-4 h-4" />
                      취소
                    </button>
                  </div>
                )}
              </div>
              
              <div className="flex items-start gap-3">
                <MessageSquare className="w-5 h-5 text-gray-400 mt-1" />
                {isEditingNotes ? (
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="이 사용자에 대한 관리자 메모를 작성하세요..."
                    className="flex-1 min-h-[120px] p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  />
                ) : (
                  <p className="flex-1 text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {user.admin_notes || '작성된 메모가 없습니다.'}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}