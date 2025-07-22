'use client'

import { useState } from 'react'
// import { trackedFetch } from '@/lib/utils/tracked-fetch'

// 타입 정의
interface ApiEndpoint {
  name: string;
  method: string;
  path: string;
  body?: any;
  query?: any;
  requireAuth?: boolean;
  requireAdmin?: boolean;
}

// API 엔드포인트 정의
const API_ENDPOINTS: Record<string, ApiEndpoint[]> = {
  인증: [
    {
      name: '전화번호 인증 요청',
      method: 'POST',
      path: '/api/auth/phone',
      body: {
        phone: '010-1234-5678',
      },
    },
    {
      name: '인증 코드 확인',
      method: 'POST',
      path: '/api/auth/phone/verify',
      body: {
        phone: '010-1234-5678',
        code: '123456',
      },
    },
    {
      name: '프로필 조회',
      method: 'GET',
      path: '/api/auth/profile',
      requireAuth: true,
    },
  ],
  예약: [
    {
      name: '예약 목록 조회',
      method: 'GET',
      path: '/api/reservations',
      requireAuth: true,
    },
    {
      name: '예약 생성',
      method: 'POST',
      path: '/api/reservations',
      requireAuth: true,
      body: {
        machineId: 1,
        date: '2025-01-22',
        slotNumber: 1,
        playerCount: 2,
      },
    },
    {
      name: '예약 취소',
      method: 'DELETE',
      path: '/api/reservations/{id}',
      requireAuth: true,
      params: {
        id: '123',
      },
    },
  ],
  관리자: [
    {
      name: '대시보드 데이터',
      method: 'GET',
      path: '/api/admin/dashboard',
      requireAuth: true,
      requireAdmin: true,
    },
    {
      name: '예약 목록 (관리자)',
      method: 'GET',
      path: '/api/admin/reservations',
      requireAuth: true,
      requireAdmin: true,
    },
    {
      name: '사용자 목록',
      method: 'GET',
      path: '/api/admin/users',
      requireAuth: true,
      requireAdmin: true,
    },
  ],
  기기: [
    {
      name: '기기 목록',
      method: 'GET',
      path: '/api/devices',
    },
    {
      name: '기기 타입 목록',
      method: 'GET',
      path: '/api/device-types',
    },
    {
      name: '예약 가능 기기',
      method: 'GET',
      path: '/api/available-machines',
      query: {
        date: '2025-01-22',
      },
    },
  ],
  시간대: [
    {
      name: '시간대 목록',
      method: 'GET',
      path: '/api/time-slots',
    },
    {
      name: '스케줄 조회',
      method: 'GET',
      path: '/api/public/schedule',
      query: {
        date: '2025-01-22',
      },
    },
  ],
}

interface ApiEndpoint {
  name: string
  method: string
  path: string
  body?: any
  query?: any
  params?: any
  requireAuth?: boolean
  requireAdmin?: boolean
}

export default function ApiTestPage() {
  const [selectedEndpoint, setSelectedEndpoint] = useState<ApiEndpoint | null>(null)
  const [authToken, setAuthToken] = useState('')
  const [requestBody, setRequestBody] = useState('')
  const [queryParams, setQueryParams] = useState('')
  const [pathParams, setPathParams] = useState('')
  const [response, setResponse] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const executeRequest = async () => {
    if (!selectedEndpoint) return

    setLoading(true)
    setError(null)
    setResponse(null)

    try {
      // URL 구성
      let url = selectedEndpoint.path

      // 경로 파라미터 치환
      if (pathParams) {
        const params = JSON.parse(pathParams)
        Object.entries(params).forEach(([key, value]) => {
          url = url.replace(`{${key}}`, value as string)
        })
      }

      // 쿼리 파라미터 추가
      if (queryParams) {
        const params = new URLSearchParams(JSON.parse(queryParams))
        url += `?${params.toString()}`
      }

      // 헤더 구성
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }

      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`
      }

      // 요청 실행
      const res = await fetch(url, {
        method: selectedEndpoint.method,
        headers,
        body: requestBody && selectedEndpoint.method !== 'GET' ? requestBody : undefined,
      })

      const data = await res.json()

      setResponse({
        status: res.status,
        statusText: res.statusText,
        headers: Object.fromEntries(res.headers.entries()),
        data,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류')
    } finally {
      setLoading(false)
    }
  }

  const selectEndpoint = (endpoint: ApiEndpoint) => {
    setSelectedEndpoint(endpoint)
    setRequestBody(endpoint.body ? JSON.stringify(endpoint.body, null, 2) : '')
    setQueryParams(endpoint.query ? JSON.stringify(endpoint.query, null, 2) : '')
    setPathParams(endpoint.params ? JSON.stringify(endpoint.params, null, 2) : '')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">API 테스트 도구</h1>

        {/* 인증 토큰 입력 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">인증 설정</h2>
          <div className="flex gap-4">
            <input
              type="text"
              placeholder="Bearer 토큰 입력 (선택사항)"
              value={authToken}
              onChange={(e) => setAuthToken(e.target.value)}
              className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              onClick={() => setAuthToken('')}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              초기화
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* API 목록 */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow">
              <div className="p-4 border-b">
                <h2 className="font-semibold">API 엔드포인트</h2>
              </div>
              <div className="divide-y">
                {Object.entries(API_ENDPOINTS).map(([category, endpoints]) => (
                  <div key={category}>
                    <h3 className="px-4 py-2 bg-gray-50 font-medium text-sm text-gray-700">
                      {category}
                    </h3>
                    <div className="divide-y">
                      {endpoints.map((endpoint, idx) => (
                        <button
                          key={idx}
                          onClick={() => selectEndpoint(endpoint)}
                          className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${
                            selectedEndpoint === endpoint ? 'bg-indigo-50' : ''
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-xs font-semibold px-2 py-1 rounded ${
                                endpoint.method === 'GET'
                                  ? 'bg-green-100 text-green-700'
                                  : endpoint.method === 'POST'
                                  ? 'bg-blue-100 text-blue-700'
                                  : endpoint.method === 'DELETE'
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-gray-100 text-gray-700'
                              }`}
                            >
                              {endpoint.method}
                            </span>
                            <span className="text-sm truncate">{endpoint.name}</span>
                          </div>
                          <div className="mt-1 text-xs text-gray-500 font-mono">
                            {endpoint.path}
                          </div>
                          {(endpoint.requireAuth || endpoint.requireAdmin) && (
                            <div className="mt-1 flex gap-2">
                              {endpoint.requireAuth && (
                                <span className="text-xs px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded">
                                  인증 필요
                                </span>
                              )}
                              {endpoint.requireAdmin && (
                                <span className="text-xs px-2 py-0.5 bg-orange-100 text-orange-700 rounded">
                                  관리자
                                </span>
                              )}
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 요청 설정 및 응답 */}
          <div className="lg:col-span-2 space-y-6">
            {selectedEndpoint ? (
              <>
                {/* 요청 설정 */}
                <div className="bg-white rounded-lg shadow">
                  <div className="p-6">
                    <h2 className="text-lg font-semibold mb-4">요청 설정</h2>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          메소드
                        </label>
                        <div className="flex items-center gap-4">
                          <span
                            className={`text-sm font-semibold px-3 py-1 rounded ${
                              selectedEndpoint.method === 'GET'
                                ? 'bg-green-100 text-green-700'
                                : selectedEndpoint.method === 'POST'
                                ? 'bg-blue-100 text-blue-700'
                                : selectedEndpoint.method === 'DELETE'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {selectedEndpoint.method}
                          </span>
                          <span className="font-mono text-sm">{selectedEndpoint.path}</span>
                        </div>
                      </div>

                      {pathParams && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            경로 파라미터
                          </label>
                          <textarea
                            value={pathParams}
                            onChange={(e) => setPathParams(e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg font-mono text-sm"
                            rows={3}
                          />
                        </div>
                      )}

                      {queryParams && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            쿼리 파라미터
                          </label>
                          <textarea
                            value={queryParams}
                            onChange={(e) => setQueryParams(e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg font-mono text-sm"
                            rows={3}
                          />
                        </div>
                      )}

                      {selectedEndpoint.method !== 'GET' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            요청 본문 (JSON)
                          </label>
                          <textarea
                            value={requestBody}
                            onChange={(e) => setRequestBody(e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg font-mono text-sm"
                            rows={6}
                          />
                        </div>
                      )}

                      <button
                        onClick={executeRequest}
                        disabled={loading}
                        className="w-full py-2 px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loading ? '요청 중...' : '요청 실행'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* 응답 */}
                {(response || error) && (
                  <div className="bg-white rounded-lg shadow">
                    <div className="p-6">
                      <h2 className="text-lg font-semibold mb-4">응답</h2>

                      {error ? (
                        <div className="p-4 bg-red-50 text-red-700 rounded-lg">
                          <p className="font-semibold">오류 발생</p>
                          <p className="mt-1 text-sm">{error}</p>
                        </div>
                      ) : response ? (
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              상태 코드
                            </label>
                            <div
                              className={`inline-flex items-center gap-2 px-3 py-1 rounded ${
                                response.status >= 200 && response.status < 300
                                  ? 'bg-green-100 text-green-700'
                                  : response.status >= 400
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-yellow-100 text-yellow-700'
                              }`}
                            >
                              <span className="font-semibold">{response.status}</span>
                              <span>{response.statusText}</span>
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              응답 헤더
                            </label>
                            <pre className="p-3 bg-gray-50 rounded-lg text-xs overflow-auto">
                              {JSON.stringify(response.headers, null, 2)}
                            </pre>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              응답 본문
                            </label>
                            <pre className="p-3 bg-gray-50 rounded-lg text-sm overflow-auto max-h-96">
                              {JSON.stringify(response.data, null, 2)}
                            </pre>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-white rounded-lg shadow p-12 text-center text-gray-500">
                왼쪽에서 테스트할 API를 선택하세요
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}