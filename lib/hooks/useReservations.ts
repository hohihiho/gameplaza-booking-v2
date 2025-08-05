// 예약 관련 커스텀 훅
import { useState, useEffect, useCallback } from 'react';
import { api, V2Reservation } from '@/lib/api/client';
import { useRealtimeReservations } from '@/app/hooks/useRealtimeReservations';
import { logger } from '@/lib/utils/logger';

// 예약 목록 훅
export function useReservations(initialStatus?: string) {
  const [reservations, setReservations] = useState<V2Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState(initialStatus);

  // 예약 목록 불러오기
  const fetchReservations = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await api.getReservations({
        status,
        page,
        pageSize: 10
      });
      
      setReservations(result.reservations);
      setTotal(result.total);
    } catch (err) {
      logger.error('예약 목록 조회 실패:', err);
      setError(err instanceof Error ? err.message : '예약 목록을 불러올 수 없습니다');
    } finally {
      setLoading(false);
    }
  }, [status, page]);

  // 초기 로드 및 필터 변경 시 재로드
  useEffect(() => {
    fetchReservations();
  }, [fetchReservations]);

  // 실시간 업데이트 구독
  useRealtimeReservations(() => {
    // 실시간 업데이트가 발생하면 목록 새로고침
    fetchReservations();
  });

  return {
    reservations,
    loading,
    error,
    page,
    total,
    status,
    setPage,
    setStatus,
    refetch: fetchReservations
  };
}

// 단일 예약 훅
export function useReservation(id: string | null) {
  const [reservation, setReservation] = useState<V2Reservation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setReservation(null);
      return;
    }

    const fetchReservation = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const result = await api.getReservation(id);
        setReservation(result);
      } catch (err) {
        logger.error('예약 상세 조회 실패:', err);
        setError(err instanceof Error ? err.message : '예약 정보를 불러올 수 없습니다');
      } finally {
        setLoading(false);
      }
    };

    fetchReservation();
  }, [id]);

  return {
    reservation,
    loading,
    error
  };
}

// 예약 생성 훅
export function useCreateReservation() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createReservation = useCallback(async (data: Parameters<typeof api.createReservation>[0]) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await api.createReservation(data);
      return result;
    } catch (err) {
      logger.error('예약 생성 실패:', {
        error: err,
        message: err instanceof Error ? err.message : '알 수 없는 에러',
        data: data
      });
      
      // ErrorResponse 객체인 경우 메시지 추출
      let errorMessage = '예약 생성에 실패했습니다';
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (err && typeof err === 'object' && 'message' in err) {
        errorMessage = (err as any).message;
      }
      
      console.error('Reservation error details:', err);
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    createReservation,
    loading,
    error
  };
}

// 예약 취소 훅
export function useCancelReservation() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cancelReservation = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    
    try {
      await api.cancelReservation(id);
    } catch (err) {
      logger.error('예약 취소 실패:', err);
      const errorMessage = err instanceof Error ? err.message : '예약 취소에 실패했습니다';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    cancelReservation,
    loading,
    error
  };
}