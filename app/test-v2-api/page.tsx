'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function TestV2APIPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const testCreateReservation = async () => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch('/api/v2/reservations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: '2025-07-24',
          start_time: '14:00',
          end_time: '16:00',
          device_id: 'test-device-id', // 실제 device ID로 변경 필요
          player_count: 1,
          total_amount: 20000,
          user_notes: 'v2 API 테스트',
          credit_type: 'freeplay'
        })
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'API 오류')
      }

      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류')
    } finally {
      setLoading(false)
    }
  }

  const testGetReservations = async () => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch('/api/v2/reservations?page=1&pageSize=10', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'API 오류')
      }

      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류')
    } finally {
      setLoading(false)
    }
  }

  const getAvailableDevice = async () => {
    setLoading(true)
    setError(null)

    try {
      // 사용 가능한 기기 찾기
      const { data: devices } = await supabase
        .from('devices')
        .select(`
          id,
          device_number,
          status,
          device_types (
            id,
            name
          )
        `)
        .eq('status', 'available')
        .limit(1)
        .single()

      if (devices) {
        setResult({ availableDevice: devices })
        return devices.id
      }
      throw new Error('사용 가능한 기기가 없습니다')
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류')
      return null
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-8">TDD v2 API 테스트</h1>

        <div className="bg-white rounded-lg shadow p-6 mb-4">
          <h2 className="text-lg font-semibold mb-4">테스트 도구</h2>
          
          <div className="flex gap-4 mb-4">
            <button
              onClick={getAvailableDevice}
              disabled={loading}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:bg-gray-400"
            >
              사용 가능한 기기 찾기
            </button>
            
            <button
              onClick={testCreateReservation}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-400"
            >
              예약 생성 테스트
            </button>
            
            <button
              onClick={testGetReservations}
              disabled={loading}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-green-400"
            >
              예약 목록 테스트
            </button>
          </div>

          <div className="text-sm text-gray-600">
            <p>• v2 API는 TDD 도메인 로직을 사용합니다</p>
            <p>• 24시간 룰, 중복 검사 등이 도메인 계층에서 처리됩니다</p>
            <p>• 에러 처리와 검증이 더 엄격합니다</p>
          </div>
        </div>

        {loading && (
          <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-4">
            <p className="text-blue-700">처리 중...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded p-4 mb-4">
            <h3 className="font-semibold text-red-800 mb-2">오류 발생</h3>
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {result && (
          <div className="bg-green-50 border border-green-200 rounded p-4">
            <h3 className="font-semibold text-green-800 mb-2">성공</h3>
            <pre className="text-sm text-gray-700 overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}