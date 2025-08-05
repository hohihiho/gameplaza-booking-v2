'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { api } from '@/lib/api/client';

export default function TestReservationPage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const testReservation = async () => {
    if (!session) {
      setError('로그인이 필요합니다');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const result = await api.createReservation({
        deviceId: '3d116ca1-774a-4de8-b0f5-94cd0cca6e03', // beatmania IIDX #1
        date: '2025-08-05',
        startHour: 9,
        endHour: 10,
        userNotes: '최대 예약 대수 테스트'
      });
      setResult(result);
    } catch (err: any) {
      console.error('예약 생성 오류:', err);
      setError(err.message || '예약 생성 실패');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">예약 테스트 페이지</h1>
      
      <div className="bg-gray-100 p-4 rounded mb-4">
        <h2 className="font-bold mb-2">테스트 시나리오</h2>
        <p>비트매니아 IIDX - 2025-08-05 09:00-10:00 예약</p>
        <p className="text-sm text-gray-600">이미 조기 시간대 예약 2개 존재 (max_rental_units: 1)</p>
      </div>

      <button
        onClick={testReservation}
        disabled={loading || !session}
        className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
      >
        {loading ? '예약 중...' : '예약 테스트'}
      </button>

      {!session && (
        <p className="mt-4 text-red-500">로그인이 필요합니다</p>
      )}

      {error && (
        <div className="mt-4 p-4 bg-red-100 text-red-700 rounded">
          <h3 className="font-bold">오류 발생!</h3>
          <p>{error}</p>
        </div>
      )}

      {result && (
        <div className="mt-4 p-4 bg-green-100 text-green-700 rounded">
          <h3 className="font-bold">예약 성공!</h3>
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}