// 예약 관리 페이지
// 비전공자 설명: 관리자가 예약을 승인, 거절, 관리하는 페이지입니다
'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from '@/hooks/useToast';
// Supabase Auth는 사용하지 않음 - NextAuth 사용
import { 
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  Timer,
  Search,
  // Filter,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  User,
  Gamepad2,
  Phone,
  MessageCircle,
  Eye,
  X,
  Trash2
} from 'lucide-react';
// Realtime 기능을 폴링으로 대체

// 24시간 이상 시간 포맷팅
const formatTime = (time: string) => {
  if (!time) return '';
  // 초가 포함된 경우 제거 (HH:MM:SS -> HH:MM)
  const timeParts = time.split(':');
  const hour = timeParts[0];
  const minute = timeParts[1] || '00';
  
  if (!hour) return '';
  const h = parseInt(hour);
  // 0~5시는 24~29시로 표시
  if (h >= 0 && h <= 5) {
    return `${h + 24}:${minute}`;
  }
  return `${hour}:${minute}`;
};

// 시간대 구분 함수
const getShiftType = (startTime: string) => {
  if (!startTime) return null;
  const [hour] = startTime.split(':');
  const h = parseInt(hour || '0');
  
  if (h >= 6 && h <= 23) {
    return 'early'; // 조기영업 (06:00-23:59)
  } else if (h >= 0 && h <= 5) {
    return 'night'; // 밤샘영업 (00:00-05:59)
  }
  return null;
};

// 시간대 뱃지 스타일
const getShiftBadgeStyle = (shiftType: string | null) => {
  switch (shiftType) {
    case 'early':
      return {
        bg: 'bg-orange-100 dark:bg-orange-900/30',
        text: 'text-orange-700 dark:text-orange-300',
        label: '조기'
      };
    case 'night':
      return {
        bg: 'bg-indigo-100 dark:bg-indigo-900/30',
        text: 'text-indigo-700 dark:text-indigo-300',
        label: '밤샘'
      };
    default:
      return null;
  }
};

type Reservation = {
  id: string;
  user: {
    id: string;
    name: string;
    phone: string;
    email: string;
  };
  device: {
    type_name: string;
    device_number: number;
    model_name?: string;
    version_name?: string;
  };
  date: string;
  time_slot: string;
  player_count: number;
  credit_option: string;
  total_price: number;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'completed' | 'checked_in' | 'no_show';
  notes?: string;
  admin_notes?: string;
  created_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
};

export default function ReservationManagementPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [allReservations, setAllReservations] = useState<Reservation[]>([]); // 전체 예약 데이터 저장
  const [tabCounts, setTabCounts] = useState<Record<string, number>>({}); // 각 탭의 개수 저장
  const [selectedStatus, setSelectedStatus] = useState<string>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedYear, setSelectedYear] = useState('all'); // 기본값을 'all'로 변경
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectingReservationId, setRejectingReservationId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  // NextAuth 세션 정보는 API가 자동으로 처리
  
  // 복수 선택 상태
  const [selectedReservationIds, setSelectedReservationIds] = useState<string[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [showBulkRejectModal, setShowBulkRejectModal] = useState(false);
  
  // 페이지네이션 상태
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; // 한 페이지에 10개씩 표시

  // 영업일 기준 날짜 변환 함수
  const getBusinessDate = (date: string, startTime: string) => {
    const [year, month, day] = date.split('-').map(Number);
    const [hour] = startTime.split(':').map(Number);
    
    // 기본값 설정
    const safeYear = year || new Date().getFullYear();
    const safeMonth = month || 1;
    const safeDay = day || 1;
    
    // 0~5시는 전날 영업일로 간주
    if (hour !== undefined && hour >= 0 && hour <= 5) {
      const businessDate = new Date(safeYear, safeMonth - 1, safeDay - 1);
      return businessDate;
    } else {
      const businessDate = new Date(safeYear, safeMonth - 1, safeDay);
      return businessDate;
    }
  };

  // 데이터 정렬 함수 (공통 사용)
  const sortReservationsData = (data: any[]) => {
    console.log('정렬 전 데이터:', data.map(d => ({ id: d.id, status: d.status, date: d.date, start_time: d.start_time })));
    console.log('오늘 날짜:', new Date().toISOString().split('T')[0]);
    
    // 현재 시점 계산 (KST 기준)
    const now = new Date();
    const currentDate = now.toISOString().split('T')[0] || '';
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTotalMinutes = currentHour * 60 + currentMinute;
    
    const sorted = [...data].sort((a, b) => {
      // 1. 상태별 우선순위 (기획서 기준: 대기중 → 승인 → 체크인 → 완료/취소)
      const statusPriority: Record<string, number> = {
        'pending': 1,    // 대기중
        'approved': 2,   // 승인됨
        'checked_in': 3, // 체크인
        'completed': 4,  // 완료
        'cancelled': 4,  // 취소 (완료와 동일 순위)
        'rejected': 4,   // 거절 (완료와 동일 순위)
        'no_show': 5     // 노쇼
      };

      const aPriority = statusPriority[a.status] || 999;
      const bPriority = statusPriority[b.status] || 999;

      // 상태가 다르면 우선순위로 정렬
      if (aPriority !== bPriority) {
        return aPriority - bPriority;
      }

      // 같은 상태 내에서 정렬
      if (a.status === 'pending' || a.status === 'approved' || a.status === 'checked_in') {
        // 대기중/승인됨/체크인: 대여일이 가까운 순
        
        // 날짜가 없는 경우 기본값 처리
        if (!a.date || !b.date) {
          return a.date ? -1 : (b.date ? 1 : 0);
        }
        
        // 과거/미래 여부 판단
        const todayStr = currentDate;
        
        const aIsPast = a.date < todayStr || 
                        (a.date === todayStr && 
                         a.start_time && 
                         parseInt(a.start_time.split(':')[0]) * 60 + parseInt(a.start_time.split(':')[1] || '0') < currentTotalMinutes);
        
        const bIsPast = b.date < todayStr || 
                        (b.date === todayStr && 
                         b.start_time && 
                         parseInt(b.start_time.split(':')[0]) * 60 + parseInt(b.start_time.split(':')[1] || '0') < currentTotalMinutes);
        
        // 과거와 미래가 섞여있으면, 미래가 먼저 (과거는 후순위)
        if (aIsPast !== bIsPast) {
          return aIsPast ? 1 : -1;  // 미래 예약이 먼저
        }
        
        // 둘 다 과거 예약이면 최신순(내림차순)으로 정렬
        if (aIsPast && bIsPast) {
          // 날짜가 최신인 것이 먼저 (내림차순)
          const dateDiff = b.date.localeCompare(a.date);
          if (dateDiff !== 0) {
            return dateDiff;
          }
          // 같은 날짜면 시간이 늦은 것이 먼저
          const aMinutes = parseInt(a.start_time?.split(':')[0] || '0') * 60 + parseInt(a.start_time?.split(':')[1] || '0');
          const bMinutes = parseInt(b.start_time?.split(':')[0] || '0') * 60 + parseInt(b.start_time?.split(':')[1] || '0');
          return bMinutes - aMinutes;
        }
        
        // 둘 다 미래 예약이면 기존 로직대로 (가까운 날짜 먼저)
        // 영업일 기준으로 날짜 계산
        const aBusinessDate = getBusinessDate(a.date, a.start_time || '00:00:00');
        const bBusinessDate = getBusinessDate(b.date, b.start_time || '00:00:00');
        
        // 시간 파싱
        let aHour = 0, aMinute = 0, bHour = 0, bMinute = 0;
        if (a.start_time) {
          const timeParts = a.start_time.split(':');
          aHour = parseInt(timeParts[0] || '0');
          aMinute = parseInt(timeParts[1] || '0');
        }
        if (b.start_time) {
          const timeParts = b.start_time.split(':');
          bHour = parseInt(timeParts[0] || '0');
          bMinute = parseInt(timeParts[1] || '0');
        }
        
        // 먼저 영업일 비교
        const businessDateDiff = aBusinessDate.getTime() - bBusinessDate.getTime();
        if (businessDateDiff !== 0) {
          return businessDateDiff;
        }
        
        // 같은 영업일이면 시간대별로 구분
        // 조기영업(06:00-23:59)과 밤샘영업(00:00-05:59) 구분
        const aIsNightShift = aHour >= 0 && aHour <= 5;
        const bIsNightShift = bHour >= 0 && bHour <= 5;
        
        // 같은 영업일에서 조기영업이 먼저, 밤샘영업이 뒤로
        if (aIsNightShift !== bIsNightShift) {
          return aIsNightShift ? 1 : -1; // 조기영업(false)이 먼저, 밤샘영업(true)이 뒤로
        }
        
        // 같은 시간대 내에서는 실제 시간 순서로
        const aActualMinutes = aHour * 60 + aMinute;
        const bActualMinutes = bHour * 60 + bMinute;
        
        // 논리적 시간 계산 (밤샘시간은 24~29시로 표시)
        const aLogicalHour = aIsNightShift ? aHour + 24 : aHour;
        const bLogicalHour = bIsNightShift ? bHour + 24 : bHour;
        
        // 같은 시간대면 신청 순서(created_at)로 정렬
        if (aActualMinutes === bActualMinutes) {
          const aCreated = new Date(a.created_at);
          const bCreated = new Date(b.created_at);
          return aCreated.getTime() - bCreated.getTime(); // 먼저 신청한 순서
        }
        
        const result = aActualMinutes - bActualMinutes;
        console.log(`정렬 비교 (영업일 기준): ${a.date} ${a.start_time} (영업일: ${aBusinessDate.toDateString()}, 논리시간: ${aLogicalHour}:${aMinute.toString().padStart(2,'0')}) vs ${b.date} ${b.start_time} (영업일: ${bBusinessDate.toDateString()}, 논리시간: ${bLogicalHour}:${bMinute.toString().padStart(2,'0')}) = ${result}`);
        
        return result;
      } else {
        // 완료/취소/거절/노쇼: 최신순 (생성일 기준)
        const aCreated = new Date(a.created_at || a.updated_at);
        const bCreated = new Date(b.created_at || b.updated_at);
        return bCreated.getTime() - aCreated.getTime();
      }
    });
    
    console.log('정렬 후 데이터:', sorted.map(d => ({ id: d.id, status: d.status, date: d.date, start_time: d.start_time })));
    return sorted;
  };

  // Supabase에서 예약 데이터 가져오기
  const fetchReservations = async (year?: string) => {
    try {
      setIsLoading(true);
      
      // URL 파라미터 구성
      const params = new URLSearchParams();
      if (year && year !== 'all') {
        params.append('year', year);
      }
      params.append('limit', '200'); // 성능을 위해 200건으로 제한
      
      // D1 기반 API 사용
      const apiUrl = `/api/admin/reservations?${params}`;
      
      console.log('API 호출 시작:', apiUrl);
      
      // NextAuth는 쿠키 기반 인증을 사용하므로 별도의 헤더가 필요 없음
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include' // 쿠키 포함 (NextAuth 세션 쿠키)
      });
      console.log('API 응답 상태:', response.status);
      console.log('API 응답 헤더:', response.headers);
      
      // 응답 텍스트를 먼저 가져오기
      const responseText = await response.text();
      console.log('API 응답 텍스트:', responseText);
      
      if (!response.ok) {
        console.error('API 응답 에러:', responseText);
        // 인증 에러인 경우 처리
        if (response.status === 401 || response.status === 403) {
          console.error('인증 에러: 관리자 권한이 필요합니다');
          alert('관리자 권한이 필요합니다. 다시 로그인해주세요.');
          // 로그인 페이지로 리다이렉트
          window.location.href = '/login';
          return;
        }
        throw new Error(responseText || '예약 데이터를 불러올 수 없습니다');
      }
      
      // JSON 파싱 시도
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch (parseError) {
        console.error('JSON 파싱 에러:', parseError);
        console.error('파싱 실패한 텍스트:', responseText);
        throw new Error('응답 데이터 파싱 실패');
      }
      
      console.log('API 응답 전체:', responseData);
      console.log('API 응답 success:', responseData.success);
      console.log('API 응답 data:', responseData.data);
      
      // v2 API 응답 형식
      const reservationsData = responseData.data?.reservations || [];
      
      console.log('예약 데이터 개수:', reservationsData.length);
      console.log('예약 데이터:', reservationsData);
      
      // 첫 번째 예약 데이터의 구조 확인
      if (reservationsData && reservationsData.length > 0) {
        console.log('첫 번째 예약 데이터 구조:', reservationsData[0]);
      }


      // 정렬된 데이터
      const sortedData = sortReservationsData(reservationsData || []);

      // 데이터 포맷팅 (v2 API 형식)
      const formattedData: Reservation[] = sortedData.map((res: any) => {
        // 디버깅: 시간과 금액 정보 로그
        console.log('예약 데이터 변환:', {
          id: res.id,
          start_time: res.start_time,
          end_time: res.end_time, 
          total_amount: res.total_amount,
          type: typeof res.total_amount
        });
        
        // v2 API 형식 (snake_case)
        return {
            id: res.id,
            user: {
              id: res.user_id,
              name: res.user_name || '알 수 없음',
              phone: res.user_phone || '',
              email: res.user_email || ''
            },
            device: {
              type_name: res.device_type_name || '알 수 없음',
              device_number: res.device_number || res.assigned_device_number || 0,
              model_name: res.device_model_name,
              version_name: res.device_version_name
            },
            date: res.date || '',
            time_slot: res.start_time && res.end_time ? 
              `${formatTime(res.start_time)}-${formatTime(res.end_time)}` : '',
            player_count: res.player_count || 1,
            credit_option: (() => {
              if (res.credit_type === 'fixed') return '고정크레딧';
              if (res.credit_type === 'freeplay') return '프리플레이';
              if (res.credit_type === 'unlimited') return '무한크레딧';
              return res.credit_type || '알 수 없음';
            })(),
            total_price: typeof res.total_amount === 'string' ? parseFloat(res.total_amount) : (res.total_amount || 0),
            status: res.status,
            notes: res.user_notes || res.notes,  // user_notes가 있으면 사용, 없으면 notes 사용
            admin_notes: res.admin_notes,
            created_at: res.created_at,
            reviewed_at: res.approved_at || res.updated_at,
            reviewed_by: res.approved_by || (res.status !== 'pending' ? '관리자' : undefined)
          };
        // v1 API 지원 제거됨
      });

      // 디버깅: user_notes 확인
      console.log('관리자 예약 데이터 샘플:', formattedData.slice(0, 3).map(r => ({
        id: r.id,
        notes: r.notes,
        raw_data: r
      })));
      
      setAllReservations(formattedData);
      
      // 각 탭의 개수 계산
      const counts: Record<string, number> = {
        all: formattedData.length,
        pending: formattedData.filter(r => r.status === 'pending').length,
        approved: formattedData.filter(r => r.status === 'approved').length,
        checked_in: formattedData.filter(r => r.status === 'checked_in').length,
        cancelled: formattedData.filter(r => r.status === 'cancelled' || r.status === 'rejected').length,
        completed: formattedData.filter(r => r.status === 'completed').length,
        no_show: formattedData.filter(r => r.status === 'no_show').length
      };
      setTabCounts(counts);
    } catch (error) {
      console.error('예약 데이터 불러오기 실패:', error);
      console.error('에러 상세:', error instanceof Error ? error.message : error);
      setAllReservations([]);
      setReservations([]);
      setTabCounts({});
    } finally {
      setIsLoading(false);
    }
  };


  // 초기 로드
  useEffect(() => {
    fetchReservations(selectedYear);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // 연도 변경 시 데이터 다시 로드
  useEffect(() => {
    if (selectedYear) {
      fetchReservations(selectedYear);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedYear]);

  // 폴링 기반 실시간 동기화 (30초마다 갱신)
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isLoading) {
        fetchReservations(selectedYear);
      }
    }, 30000); // 30초마다 업데이트

    return () => clearInterval(interval);
  }, [selectedYear, isLoading]);

  // 필터링 및 검색 처리
  useEffect(() => {
    if (allReservations.length > 0) {
      filterReservations();
    }
    // 필터링 시 선택 해제
    clearSelection();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStatus, searchQuery, selectedDate, allReservations]);

  // 선택된 항목이 있을 때 일괄 처리 버튼 표시
  useEffect(() => {
    setShowBulkActions(selectedReservationIds.length > 0);
  }, [selectedReservationIds]);

  // 필터링 함수
  const filterReservations = () => {
    let filtered = [...allReservations];
    
    // 상태 필터링
    if (selectedStatus !== 'all') {
      if (selectedStatus === 'cancelled') {
        filtered = filtered.filter(r => r.status === 'cancelled' || r.status === 'rejected');
      } else {
        filtered = filtered.filter(r => r.status === selectedStatus);
      }
    }
    
    // 검색 필터링
    if (searchQuery) {
      filtered = filtered.filter(r => 
        r.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.user.phone.includes(searchQuery) ||
        r.device.type_name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // 연도별 필터링 (특정 날짜가 선택되지 않은 경우)
    if (!selectedDate && selectedYear !== 'all') {
      filtered = filtered.filter(r => {
        if (!r.date) return false;
        const reservationYear = new Date(r.date).getFullYear().toString();
        return reservationYear === selectedYear;
      });
    }
    
    // 특정 날짜 필터링 (연도 필터보다 우선)
    if (selectedDate) {
      filtered = filtered.filter(r => r.date === selectedDate);
    }
    
    // 필터링 후 정렬 적용
    const sortedFiltered = sortReservationsData(filtered);
    
    setReservations(sortedFiltered);
    setCurrentPage(1); // 필터 변경 시 첫 페이지로
  };

  // 폴링을 통한 주기적 데이터 업데이트


  const getStatusBadge = (status: Reservation['status']) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">
            <Timer className="w-4 h-4" />
            승인 대기
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
            <CheckCircle className="w-4 h-4" />
            승인됨
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400">
            <XCircle className="w-4 h-4" />
            취소됨
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400">
            <XCircle className="w-4 h-4" />
            취소됨
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
            <CheckCircle className="w-4 h-4" />
            완료됨
          </span>
        );
      case 'checked_in':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400">
            <CheckCircle className="w-4 h-4" />
            체크인
          </span>
        );
      case 'no_show':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400">
            <AlertCircle className="w-4 h-4" />
            노쇼
          </span>
        );
      default:
        return null;
    }
  };

  const handleApprove = async (reservationId: string) => {
    try {
      setIsLoading(true);
      
      // D1 기반 API 사용
      const apiUrl = '/api/admin/reservations';
      
      const response = await fetch(apiUrl, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // NextAuth 세션 쿠키 포함
        body: JSON.stringify({
          id: reservationId,
          status: 'approved',
          reviewedBy: '관리자'
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '예약 승인에 실패했습니다');
      }

      // 로컬 상태 업데이트
      const updatedReservations = allReservations.map(r => 
        r.id === reservationId 
          ? { 
              ...r, 
              status: 'approved' as const, 
              reviewed_at: new Date().toISOString(),
              reviewed_by: '관리자'
            }
          : r
      );
      setAllReservations(updatedReservations);
      
      // 탭 개수 업데이트
      const counts = { ...tabCounts };
      counts.pending = (counts.pending || 1) - 1;
      counts.approved = (counts.approved || 0) + 1;
      setTabCounts(counts);
      
      // 성공 토스트 표시
      toast.success('예약이 승인되었습니다');
    } catch (error) {
      console.error('예약 승인 실패:', error);
      toast.error('예약 승인에 실패했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReject = async (reservationId: string) => {
    setRejectingReservationId(reservationId);
    setShowRejectModal(true);
  };

  // 복수 선택 관련 함수들
  const handleSelectReservation = (reservationId: string, checked: boolean) => {
    if (checked) {
      setSelectedReservationIds(prev => [...prev, reservationId]);
    } else {
      setSelectedReservationIds(prev => prev.filter(id => id !== reservationId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const pendingIds = reservations
        .filter(r => r.status === 'pending')
        .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
        .map(r => r.id);
      setSelectedReservationIds(pendingIds);
    } else {
      setSelectedReservationIds([]);
    }
  };

  const clearSelection = () => {
    setSelectedReservationIds([]);
    setShowBulkActions(false);
  };

  // 복수 승인 처리
  const handleBulkApprove = async () => {
    if (selectedReservationIds.length === 0) return;

    try {
      setIsLoading(true);
      
      // 각 예약을 순차적으로 승인 처리
      const promises = selectedReservationIds.map(async (reservationId) => {
        const response = await fetch('/api/admin/reservations', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            id: reservationId,
            status: 'approved',
            reviewedBy: '관리자'
          }),
        });

        if (!response.ok) {
          throw new Error(`예약 ${reservationId} 승인 실패`);
        }
        return reservationId;
      });

      await Promise.all(promises);

      // 로컬 상태 업데이트
      const updatedReservations = allReservations.map(r => 
        selectedReservationIds.includes(r.id)
          ? { 
              ...r, 
              status: 'approved' as const, 
              reviewed_at: new Date().toISOString(),
              reviewed_by: '관리자'
            }
          : r
      );
      setAllReservations(updatedReservations);
      
      // 탭 개수 업데이트
      const counts = { ...tabCounts };
      counts.pending = (counts.pending || selectedReservationIds.length) - selectedReservationIds.length;
      counts.approved = (counts.approved || 0) + selectedReservationIds.length;
      setTabCounts(counts);
      
      clearSelection();
      toast.success(`${selectedReservationIds.length}건의 예약이 승인되었습니다`);
    } catch (error) {
      console.error('복수 승인 실패:', error);
      toast.error('일부 예약 승인에 실패했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  // 복수 거절 처리
  const handleBulkReject = () => {
    setShowBulkRejectModal(true);
  };

  const confirmBulkReject = async () => {
    if (selectedReservationIds.length === 0) return;

    const finalReason = rejectReason.trim() || '기타';

    try {
      setIsLoading(true);
      
      // 각 예약을 순차적으로 거절 처리
      const promises = selectedReservationIds.map(async (reservationId) => {
        const response = await fetch('/api/admin/reservations', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            id: reservationId,
            status: 'rejected',
            reviewedBy: '관리자',
            notes: `취소 사유: ${finalReason}`,
            rejection_reason: finalReason
          }),
        });

        if (!response.ok) {
          throw new Error(`예약 ${reservationId} 거절 실패`);
        }
        return reservationId;
      });

      await Promise.all(promises);

      // 로컬 상태 업데이트
      const updatedReservations = allReservations.map(r => 
        selectedReservationIds.includes(r.id)
          ? { 
              ...r, 
              status: 'rejected' as const, 
              reviewed_at: new Date().toISOString(),
              reviewed_by: '관리자',
              notes: `취소 사유: ${finalReason}`
            }
          : r
      );
      setAllReservations(updatedReservations);
      
      // 탭 개수 업데이트
      const counts = { ...tabCounts };
      counts.pending = (counts.pending || selectedReservationIds.length) - selectedReservationIds.length;
      counts.cancelled = (counts.cancelled || 0) + selectedReservationIds.length;
      setTabCounts(counts);
      
      setShowBulkRejectModal(false);
      setRejectReason('');
      clearSelection();
      toast.success(`${selectedReservationIds.length}건의 예약이 취소되었습니다`);
    } catch (error) {
      console.error('복수 거절 실패:', error);
      toast.error('일부 예약 취소에 실패했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  const confirmReject = async () => {
    // 사유가 비어있으면 기타로 설정
    const finalReason = rejectReason.trim() || '기타';

    try {
      setIsLoading(true);
      
      // D1 기반 API 사용
      const apiUrl = '/api/admin/reservations';
      
      const response = await fetch(apiUrl, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // NextAuth 세션 쿠키 포함
        body: JSON.stringify({
          id: rejectingReservationId,
          status: 'rejected',
          reviewedBy: '관리자',
          notes: `취소 사유: ${finalReason}`,
          rejection_reason: finalReason
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '예약 거절에 실패했습니다');
      }

      // 로컬 상태 업데이트
      const updatedReservations = allReservations.map(r => 
        r.id === rejectingReservationId 
          ? { 
              ...r, 
              status: 'rejected' as const, 
              reviewed_at: new Date().toISOString(),
              reviewed_by: '관리자',
              notes: `취소 사유: ${finalReason}`
            }
          : r
      );
      setAllReservations(updatedReservations);
      
      // 탭 개수 업데이트
      const counts = { ...tabCounts };
      counts.pending = (counts.pending || 1) - 1;
      counts.cancelled = (counts.cancelled || 0) + 1;
      setTabCounts(counts);
      
      setShowRejectModal(false);
      setRejectingReservationId(null);
      setRejectReason('');
      
      // 성공 토스트 표시
      toast.success('예약이 취소되었습니다');
    } catch (error) {
      console.error('예약 취소 실패:', error);
      toast.error('예약 취소에 실패했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* 상단 고정 헤더 */}
      <div className="sticky top-0 z-40 bg-gray-50 dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800">
        <div className="w-full px-3 sm:px-6">
          {/* 페이지 타이틀 */}
          <div className="pt-4 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold dark:text-white mb-1">예약 관리</h1>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                  예약 요청을 검토하고 승인/취소합니다 (최근 200건 표시, 더 많은 데이터는 검색 사용)
                </p>
              </div>
              {/* 조기영업 일정 관리 버튼 */}
              <button
                onClick={async () => {
                  if (confirm('누락된 조기영업 일정을 검사하고 자동 생성하시겠습니까?')) {
                    try {
                      const response = await fetch('/api/admin/schedule/check-missing', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ autoFix: true })
                      });
                      const result = await response.json();
                      if (result.success) {
                        toast.success(`${result.summary.created}개의 조기영업 일정이 생성되었습니다`);
                      } else {
                        toast.error(result.message || '일정 생성에 실패했습니다');
                      }
                    } catch (error) {
                      toast.error('오류가 발생했습니다');
                      console.error(error);
                    }
                  }
                }}
                className="px-3 py-2 text-xs sm:text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <AlertCircle className="w-4 h-4 inline mr-1" />
                조기영업 일정 점검
              </button>
            </div>
          </div>

          {/* 상태 필터 탭 - 모바일 최적화 */}
          <div className="w-full overflow-x-auto">
            <div className="flex gap-1 pb-2 min-w-max">
              {Object.entries(tabCounts).map(([status, count]) => {
                // rejected 상태와 동일한 경우 cancelled로 처리
                const isActive = selectedStatus === status || 
                                (selectedStatus === 'rejected' && status === 'cancelled');
                
                return (
                  <button
                    key={status}
                    onClick={() => {
                      setSelectedStatus(status);
                      setCurrentPage(1);
                    }}
                    className={`px-3 py-2 text-xs font-medium whitespace-nowrap relative rounded-lg transition-all ${
                      isActive
                        ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    {status === 'all' && '전체'}
                    {status === 'pending' && '대기'}
                    {status === 'approved' && '승인'}
                    {status === 'checked_in' && '체크인'}
                    {status === 'cancelled' && '취소'}
                    {status === 'completed' && '완료'}
                    {status === 'no_show' && '노쇼'}
                    {status === 'pending' && <span className="ml-1 text-[10px]">({count})</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 검색 및 필터 */}
          <div className="py-2 sm:py-3 border-t border-gray-200 dark:border-gray-800">
            <div className="flex flex-col gap-2 sm:gap-3">
              {/* 첫 번째 줄: 검색 */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="이름, 전화번호, 기종명 검색 (Enter 키로 검색)"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              {/* 두 번째 줄: 기간 필터 */}
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <div className="flex-1 sm:flex-none">
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">연도 선택</label>
                  <select
                    value={selectedYear}
                    onChange={(e) => {
                      setSelectedYear(e.target.value);
                      if (e.target.value !== 'all') {
                        setSelectedDate(''); // 연도 선택시 특정 날짜 초기화
                      }
                    }}
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">전체 연도</option>
                    {Array.from({ length: 5 }, (_, i) => {
                      const year = new Date().getFullYear() - i;
                      return (
                        <option key={year} value={year}>
                          {year}년
                        </option>
                      );
                    })}
                  </select>
                </div>
                
                <div className="flex-1 sm:flex-none">
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">특정 날짜</label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => {
                      setSelectedDate(e.target.value);
                      if (e.target.value) {
                        setSelectedYear('all'); // 특정 날짜 선택시 연도 필터 초기화
                      }
                    }}
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                {/* 필터 초기화 버튼 */}
                {(selectedYear !== 'all' || selectedDate) && (
                  <button
                    onClick={() => {
                      setSelectedYear('all');
                      setSelectedDate('');
                    }}
                    className="self-end px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    초기화
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* 대기 중인 예약에서만 일괄 처리 도구 표시 */}
          {selectedStatus === 'pending' && reservations.some(r => r.status === 'pending') && (
            <div className="py-3 border-t border-gray-200 dark:border-gray-800">
              <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                {/* 전체 선택 체크박스 */}
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={
                        reservations
                          .filter(r => r.status === 'pending')
                          .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                          .length > 0 &&
                        reservations
                          .filter(r => r.status === 'pending')
                          .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                          .every(r => selectedReservationIds.includes(r.id))
                      }
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      전체 선택 (현재 페이지)
                    </span>
                  </label>
                  {selectedReservationIds.length > 0 && (
                    <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                      {selectedReservationIds.length}개 선택됨
                    </span>
                  )}
                </div>

                {/* 일괄 처리 버튼들 */}
                {showBulkActions && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleBulkApprove}
                      disabled={isLoading}
                      className="flex items-center gap-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors disabled:opacity-50"
                    >
                      <CheckCircle className="w-4 h-4" />
                      일괄 승인 ({selectedReservationIds.length})
                    </button>
                    <button
                      onClick={handleBulkReject}
                      disabled={isLoading}
                      className="flex items-center gap-1 px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors disabled:opacity-50"
                    >
                      <XCircle className="w-4 h-4" />
                      일괄 거절 ({selectedReservationIds.length})
                    </button>
                    <button
                      onClick={clearSelection}
                      className="flex items-center gap-1 px-3 py-2 bg-gray-500 hover:bg-gray-600 text-white text-sm rounded-lg transition-colors"
                    >
                      <X className="w-4 h-4" />
                      선택 해제
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 페이지네이션 (상단) */}
          {reservations.length > itemsPerPage && (
            <div className="py-3 flex items-center justify-center border-t border-gray-200 dark:border-gray-800">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setCurrentPage(prev => Math.max(prev - 1, 1));
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                </button>
                
                <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                  {currentPage} / {Math.ceil(reservations.length / itemsPerPage)} 페이지
                </span>
                
                <button
                  onClick={() => {
                    setCurrentPage(prev => Math.min(prev + 1, Math.ceil(reservations.length / itemsPerPage)));
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  disabled={currentPage === Math.ceil(reservations.length / itemsPerPage)}
                  className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 컨텐츠 영역 */}
      <div className="w-full px-3 py-3 sm:px-6 sm:py-4 min-h-screen bg-gray-50 dark:bg-gray-950">
        {/* 예약 목록 */}
        {reservations.length > 0 ? (
          <div className="grid gap-3 sm:gap-4 md:gap-6">
            {reservations
              .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
              .map((reservation, index) => (
              <motion.div
                key={reservation.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: index * 0.02 }}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700"
              >
                {/* 모바일: 카드 레이아웃 */}
                <div className="md:hidden">
                  <div className="px-4 py-4">
                    {/* 상단: 체크박스, 상태와 액션 버튼 */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {reservation.status === 'pending' && (
                          <input
                            type="checkbox"
                            checked={selectedReservationIds.includes(reservation.id)}
                            onChange={(e) => handleSelectReservation(reservation.id, e.target.checked)}
                            className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                        )}
                        {getStatusBadge(reservation.status)}
                      </div>
                      <div className="flex items-center gap-1.5" style={{ paddingRight: '8px' }}>
                        {reservation.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApprove(reservation.id)}
                              disabled={isLoading}
                              className="p-2 bg-green-500 hover:bg-green-600 text-white rounded-lg disabled:opacity-50 transition-colors"
                              title="승인"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleReject(reservation.id)}
                              disabled={isLoading}
                              className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg disabled:opacity-50 transition-colors"
                              title="거절"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => setSelectedReservation(reservation)}
                          className="p-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                          title="상세 보기"
                        >
                          <Eye className="w-4 h-4 text-gray-700 dark:text-gray-300" />
                        </button>
                      </div>
                    </div>

                    {/* 예약자 정보 */}
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 dark:text-white truncate">{reservation.user.name}</h3>
                        <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                          <Phone className="w-3 h-3 flex-shrink-0" />
                          <span>{reservation.user.phone}</span>
                        </div>
                      </div>
                    </div>

                    {/* 예약 정보 */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Gamepad2 className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600 dark:text-gray-400">기기:</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {reservation.device.type_name} #{reservation.device.device_number}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600 dark:text-gray-400">날짜:</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {new Date(reservation.date).toLocaleDateString('ko-KR')}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600 dark:text-gray-400">시간:</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {(() => {
                            const parts = reservation.time_slot.split('-');
                            const start = parts[0] || '';
                            const end = parts[1] || '';
                            return `${formatTime(start)} - ${formatTime(end)}`;
                          })()}
                        </span>
                        {(() => {
                          const parts = reservation.time_slot.split('-');
                          const start = parts[0] || '';
                          const shiftType = getShiftType(start);
                          const badgeStyle = getShiftBadgeStyle(shiftType);
                          
                          if (badgeStyle) {
                            return (
                              <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${badgeStyle.bg} ${badgeStyle.text}`}>
                                {badgeStyle.label}
                              </span>
                            );
                          }
                          return null;
                        })()}
                      </div>
                    </div>

                    {/* 하단: 금액 */}
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">결제 금액</span>
                        <span className="text-lg font-bold text-gray-900 dark:text-white">
                          ₩{reservation.total_price.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* 사용자 요청사항 */}
                    {reservation.notes && (
                      <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <div className="flex items-start gap-2">
                          <MessageCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-blue-900 dark:text-blue-100 mb-0.5">사용자 메모</p>
                            <p className="text-sm text-blue-700 dark:text-blue-300 break-words">
                              {reservation.notes}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 데스크톱: 테이블 형태 레이아웃 */}
                <div className="hidden md:block">
                  <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-6 flex-1">
                      {/* 체크박스 */}
                      {reservation.status === 'pending' && (
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={selectedReservationIds.includes(reservation.id)}
                            onChange={(e) => handleSelectReservation(reservation.id, e.target.checked)}
                            className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                        </div>
                      )}
                      
                      {/* 예약자 정보 */}
                      <div className="flex items-center gap-3 min-w-[200px]">
                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-white">{reservation.user.name}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{reservation.user.phone}</p>
                        </div>
                      </div>

                      {/* 기기 정보 */}
                      <div className="min-w-[150px]">
                        <p className="font-medium text-gray-900 dark:text-white">
                          {reservation.device.type_name} #{reservation.device.device_number}
                        </p>
                        {reservation.device.model_name && (
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {reservation.device.model_name}
                          </p>
                        )}
                      </div>

                      {/* 날짜/시간 */}
                      <div className="min-w-[180px]">
                        <p className="font-medium text-gray-900 dark:text-white">
                          {new Date(reservation.date).toLocaleDateString('ko-KR')}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {(() => {
                            const parts = reservation.time_slot.split('-');
                            const start = parts[0] || '';
                            const end = parts[1] || '';
                            return `${formatTime(start)} - ${formatTime(end)}`;
                          })()}
                        </p>
                      </div>

                      {/* 상태 */}
                      <div className="min-w-[100px]">
                        {getStatusBadge(reservation.status)}
                      </div>

                      {/* 금액 */}
                      <div className="min-w-[100px] text-right">
                        <p className="font-medium text-gray-900 dark:text-white">
                          ₩{reservation.total_price.toLocaleString()}
                        </p>
                      </div>
                    </div>

                    {/* 액션 버튼 */}
                    <div className="flex items-center gap-2 ml-4">
                      {reservation.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleApprove(reservation.id)}
                            disabled={isLoading}
                            className="p-2 bg-green-500 hover:bg-green-600 text-white rounded-lg disabled:opacity-50 transition-colors"
                            title="승인"
                          >
                            <CheckCircle className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleReject(reservation.id)}
                            disabled={isLoading}
                            className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg disabled:opacity-50 transition-colors"
                            title="거절"
                          >
                            <XCircle className="w-5 h-5" />
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => setSelectedReservation(reservation)}
                        className="p-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                        title="상세보기"
                      >
                        <Eye className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                      </button>
                    </div>
                  </div>

                  {/* 사용자 메모가 있는 경우 */}
                  {reservation.notes && (
                    <div className="px-4 pb-4">
                      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <div className="flex items-start gap-2">
                          <MessageCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <span className="text-xs font-medium text-blue-900 dark:text-blue-100 block mb-0.5">사용자 메모</span>
                            <span className="text-sm text-blue-700 dark:text-blue-300">
                              {reservation.notes}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              해당하는 예약이 없습니다
            </p>
          </div>
        )}


        {/* 안내 메시지 */}
        <div className="mt-4 sm:mt-6 space-y-3">
          {/* 대기 중인 예약 안내 */}
          {(tabCounts.pending || 0) > 0 && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg sm:rounded-xl p-3 sm:p-4">
            <div className="flex items-start gap-2 sm:gap-3">
              <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm sm:text-base font-medium text-yellow-800 dark:text-yellow-200 mb-0.5 sm:mb-1">
                  승인 대기중인 예약이 {tabCounts.pending}건 있습니다
                </h4>
                <p className="text-xs sm:text-sm text-yellow-700 dark:text-yellow-300">
                  가능한 빨리 검토하여 고객에게 알림을 보내주세요.
                </p>
              </div>
            </div>
          </div>
          )}
          
          {/* 검색 안내 */}
          {!searchQuery && !selectedDate && selectedYear === 'all' && allReservations.length >= 200 && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg sm:rounded-xl p-3 sm:p-4">
            <div className="flex items-start gap-2 sm:gap-3">
              <Search className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm sm:text-base font-medium text-blue-800 dark:text-blue-200 mb-0.5 sm:mb-1">
                  성능 최적화를 위해 최근 200건만 표시됩니다
                </h4>
                <p className="text-xs sm:text-sm text-blue-700 dark:text-blue-300">
                  더 많은 데이터를 보려면 검색 기능을 사용하거나 연도/날짜 필터를 활용하세요.
                </p>
              </div>
            </div>
          </div>
          )}
        </div>

      {/* 예약 상세 모달 - 모바일 최적화 */}
      <AnimatePresence>
        {selectedReservation && (
          <motion.div 
            className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedReservation(null)}
          >
            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white dark:bg-gray-900 w-full sm:max-w-2xl max-h-[85vh] sm:max-h-[90vh] rounded-t-2xl sm:rounded-2xl overflow-hidden shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* 모달 헤더 */}
              <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-3 sm:px-6 sm:py-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg sm:text-xl font-semibold dark:text-white">예약 상세</h2>
                  <button
                    onClick={() => setSelectedReservation(null)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                  </button>
                </div>
              </div>

              {/* 컨텐츠 영역 */}
              <div className="overflow-y-auto px-4 py-4 sm:px-6 sm:py-6">
                {/* 상태 및 예약자 정보 */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    {getStatusBadge(selectedReservation.status)}
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(selectedReservation.created_at).toLocaleString('ko-KR', {
                        year: 'numeric',
                        month: 'numeric',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">{selectedReservation.user.name}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{selectedReservation.user.phone}</p>
                    </div>
                  </div>
                </div>

                {/* 예약 정보 카드 */}
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 sm:p-5 mb-4">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-4">예약 정보</h3>
                  <div className="grid grid-cols-1 gap-3">
                    <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                      <span className="text-sm text-gray-600 dark:text-gray-400">기기</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {selectedReservation.device.type_name} #{selectedReservation.device.device_number}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                      <span className="text-sm text-gray-600 dark:text-gray-400">날짜</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {new Date(selectedReservation.date).toLocaleDateString('ko-KR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          weekday: 'short'
                        })}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                      <span className="text-sm text-gray-600 dark:text-gray-400">시간</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {(() => {
                            const parts = selectedReservation.time_slot.split('-');
                            const start = parts[0] || '';
                            const end = parts[1] || '';
                            return `${formatTime(start)} - ${formatTime(end)}`;
                          })()}
                        </span>
                        {(() => {
                          const parts = selectedReservation.time_slot.split('-');
                          const start = parts[0] || '';
                          const shiftType = getShiftType(start);
                          const badgeStyle = getShiftBadgeStyle(shiftType);
                          
                          if (badgeStyle) {
                            return (
                              <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${badgeStyle.bg} ${badgeStyle.text}`}>
                                {badgeStyle.label}
                              </span>
                            );
                          }
                          return null;
                        })()}
                      </div>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                      <span className="text-sm text-gray-600 dark:text-gray-400">인원</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {selectedReservation.player_count}명
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                      <span className="text-sm text-gray-600 dark:text-gray-400">크레디트</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {selectedReservation.credit_option}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400">금액</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        ₩{selectedReservation.total_price.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 메모 */}
                {selectedReservation.notes && (
                  <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 mb-4">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">고객 메모</h3>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {selectedReservation.notes}
                    </p>
                  </div>
                )}
                
                {/* 관리자 메모 */}
                {selectedReservation.admin_notes && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-4">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">관리자 메모</h3>
                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                      {selectedReservation.admin_notes}
                    </p>
                  </div>
                )}

                {/* 처리 정보 */}
                {selectedReservation.reviewed_at && (
                  <div className="text-center py-3 text-xs text-gray-500 dark:text-gray-400">
                    {new Date(selectedReservation.reviewed_at).toLocaleString('ko-KR')} 처리됨
                    {selectedReservation.reviewed_by && ` (${selectedReservation.reviewed_by})`}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 취소 사유 입력 모달 */}
      <AnimatePresence>
        {showRejectModal && (
          <motion.div 
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              setShowRejectModal(false);
              setRejectingReservationId(null);
              setRejectReason('');
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-md w-full shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-full">
                <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <h2 className="text-lg sm:text-xl font-semibold dark:text-white">예약 취소</h2>
            </div>
            
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-4 sm:mb-6">
              예약을 취소하는 사유를 선택해주세요. (선택사항)
            </p>

            <div className="mb-4 sm:mb-6 space-y-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                취소 사유
              </label>
              
              <label className="flex items-center p-3 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <input
                  type="radio"
                  name="rejectReason"
                  value="대여 인원 부족"
                  checked={rejectReason === '대여 인원 부족'}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="mr-3 text-red-600 focus:ring-red-500"
                />
                <span className="text-sm dark:text-white">대여 인원 부족</span>
              </label>
              
              <label className="flex items-center p-3 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <input
                  type="radio"
                  name="rejectReason"
                  value="회원 요청"
                  checked={rejectReason === '회원 요청'}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="mr-3 text-red-600 focus:ring-red-500"
                />
                <span className="text-sm dark:text-white">회원 요청</span>
              </label>
              
              <label className="flex items-center p-3 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <input
                  type="radio"
                  name="rejectReason"
                  value="기타"
                  checked={rejectReason === '기타' || (!['대여 인원 부족', '회원 요청'].includes(rejectReason) && rejectReason !== '')}
                  onChange={() => setRejectReason('기타')}
                  className="mr-3 text-red-600 focus:ring-red-500"
                />
                <span className="text-sm dark:text-white">기타 (직접 입력)</span>
              </label>
              
              {(rejectReason === '기타' || (!['대여 인원 부족', '회원 요청', ''].includes(rejectReason))) && (
                <textarea
                  value={rejectReason === '기타' ? '' : rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="취소 사유를 입력해주세요"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                  rows={3}
                  autoFocus
                />
              )}
            </div>

            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 mb-4 sm:mb-6">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 sm:w-5 h-4 sm:h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs sm:text-sm text-amber-700 dark:text-amber-300">
                  취소 사유는 고객에게 알림으로 전송됩니다.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectingReservationId(null);
                  setRejectReason('');
                }}
                className="flex-1 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors font-medium"
              >
                취소
              </button>
              <button
                onClick={confirmReject}
                disabled={isLoading}
                className="flex-1 py-2.5 sm:py-3 text-sm sm:text-base bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? '처리 중...' : '예약 취소'}
              </button>
            </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 복수 취소 사유 입력 모달 */}
      <AnimatePresence>
        {showBulkRejectModal && (
          <motion.div 
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              setShowBulkRejectModal(false);
              setRejectReason('');
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-md w-full shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-full">
                <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <h2 className="text-lg sm:text-xl font-semibold dark:text-white">일괄 예약 취소</h2>
            </div>
            
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-4 sm:mb-6">
              선택한 {selectedReservationIds.length}개의 예약을 일괄 취소합니다. 취소 사유를 선택해주세요. (선택사항)
            </p>

            <div className="mb-4 sm:mb-6 space-y-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                취소 사유
              </label>
              
              <label className="flex items-center p-3 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <input
                  type="radio"
                  name="bulkRejectReason"
                  value="대여 인원 부족"
                  checked={rejectReason === '대여 인원 부족'}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="mr-3 text-red-600 focus:ring-red-500"
                />
                <span className="text-sm dark:text-white">대여 인원 부족</span>
              </label>
              
              <label className="flex items-center p-3 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <input
                  type="radio"
                  name="bulkRejectReason"
                  value="회원 요청"
                  checked={rejectReason === '회원 요청'}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="mr-3 text-red-600 focus:ring-red-500"
                />
                <span className="text-sm dark:text-white">회원 요청</span>
              </label>
              
              <label className="flex items-center p-3 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <input
                  type="radio"
                  name="bulkRejectReason"
                  value="기타"
                  checked={rejectReason === '기타' || (!['대여 인원 부족', '회원 요청'].includes(rejectReason) && rejectReason !== '')}
                  onChange={() => setRejectReason('기타')}
                  className="mr-3 text-red-600 focus:ring-red-500"
                />
                <span className="text-sm dark:text-white">기타 (직접 입력)</span>
              </label>
              
              {(rejectReason === '기타' || (!['대여 인원 부족', '회원 요청', ''].includes(rejectReason))) && (
                <textarea
                  value={rejectReason === '기타' ? '' : rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="취소 사유를 입력해주세요"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                  rows={3}
                  autoFocus
                />
              )}
            </div>

            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 mb-4 sm:mb-6">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 sm:w-5 h-4 sm:h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs sm:text-sm text-amber-700 dark:text-amber-300">
                  취소 사유는 고객에게 알림으로 전송됩니다. 선택한 모든 예약에 동일한 사유가 적용됩니다.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowBulkRejectModal(false);
                  setRejectReason('');
                }}
                className="flex-1 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors font-medium"
              >
                취소
              </button>
              <button
                onClick={confirmBulkReject}
                disabled={isLoading}
                className="flex-1 py-2.5 sm:py-3 text-sm sm:text-base bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? '처리 중...' : `${selectedReservationIds.length}개 일괄 취소`}
              </button>
            </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </>
  );
}