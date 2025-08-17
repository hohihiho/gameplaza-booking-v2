'use client';

import { useState, useEffect, useCallback } from 'react';
import { termsCache } from '@/lib/terms-cache';

interface TermsData {
  id: string;
  type: string;
  title: string;
  content: any;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface UseTermsResult {
  data: TermsData | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useTerms(type: 'terms_of_service' | 'privacy_policy'): UseTermsResult {
  const [data, setData] = useState<TermsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTerms = useCallback(async (skipCache = false) => {
    try {
      setLoading(true);
      setError(null);

      // 캐시에서 먼저 확인 (skipCache가 false일 때만)
      if (!skipCache) {
        const cachedData = termsCache.get(type);
        if (cachedData) {
          setData(cachedData);
          setLoading(false);
          return;
        }
      }

      // API에서 데이터 가져오기
      const response = await fetch(`/api/terms?type=${type}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '약관을 불러올 수 없습니다.');
      }

      // 캐시에 저장
      termsCache.set(type, result.data);
      setData(result.data);

    } catch (err) {
      console.error('약관 조회 오류:', err);
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, [type]);

  const refetch = useCallback(async () => {
    await fetchTerms(true); // 캐시 무시하고 새로 가져오기
  }, [fetchTerms]);

  useEffect(() => {
    fetchTerms();
  }, [fetchTerms]);

  return { data, loading, error, refetch };
}

// 다중 약관 타입을 한 번에 가져오는 훅
export function useMultipleTerms(types: string[] = ['terms_of_service', 'privacy_policy']) {
  const [data, setData] = useState<Record<string, TermsData | null>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMultipleTerms = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const results: Record<string, TermsData | null> = {};

      // 캐시에서 먼저 확인
      let needsFetch = false;
      for (const type of types) {
        const cachedData = termsCache.get(type);
        if (cachedData) {
          results[type] = cachedData;
        } else {
          needsFetch = true;
          break;
        }
      }

      if (!needsFetch) {
        setData(results);
        setLoading(false);
        return;
      }

      // 전체 약관 API 호출
      const response = await fetch('/api/terms');
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '약관을 불러올 수 없습니다.');
      }

      // 각 타입별로 캐시 저장
      const termsData = result.data || {};
      for (const type of types) {
        const termData = termsData[type] || null;
        termsCache.set(type, termData);
        results[type] = termData;
      }

      setData(results);

    } catch (err) {
      console.error('약관 조회 오류:', err);
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, [types]);

  useEffect(() => {
    fetchMultipleTerms();
  }, [fetchMultipleTerms]);

  return { data, loading, error, refetch: fetchMultipleTerms };
}