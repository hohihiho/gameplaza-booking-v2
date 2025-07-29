import { trackNetworkError, reportError, TrackedError, ErrorSeverity, ErrorCategory } from '@/lib/monitoring/error-tracking'

interface TrackedFetchOptions extends RequestInit {
  timeout?: number
  retries?: number
  retryDelay?: number
}

// 타임아웃 에러 클래스
class TimeoutError extends TrackedError {
  constructor(url: string, timeout: number) {
    super(
      `Request timeout: ${url} (${timeout}ms)`,
      ErrorSeverity.High,
      ErrorCategory.Network,
      { url, timeout }
    )
    this.name = 'TimeoutError'
  }
}

// 재시도 가능한 상태 코드
const RETRYABLE_STATUS_CODES = [408, 429, 500, 502, 503, 504]

// 추적 및 개선된 fetch 함수
export async function trackedFetch(
  url: string,
  options: TrackedFetchOptions = {}
): Promise<Response> {
  const {
    timeout = 30000, // 30초 기본 타임아웃
    retries = 3,
    retryDelay = 1000,
    ...fetchOptions
  } = options

  let lastError: Error | null = null
  
  // 재시도 로직
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      // 타임아웃 구현
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), timeout)

      const startTime = performance.now()
      
      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      const duration = performance.now() - startTime

      // 느린 요청 추적 (3초 이상)
      if (duration > 3000) {
        reportError(
          new TrackedError(
            `Slow network request: ${fetchOptions.method || 'GET'} ${url} (${Math.round(duration)}ms)`,
            ErrorSeverity.Low,
            ErrorCategory.Network,
            { url, method: fetchOptions.method || 'GET', duration }
          )
        )
      }

      // 에러 응답 추적
      if (!response.ok) {
        trackNetworkError(url, response.status, fetchOptions.method || 'GET')

        // 재시도 가능한 상태인지 확인
        if (RETRYABLE_STATUS_CODES.includes(response.status) && attempt < retries - 1) {
          await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)))
          continue
        }
      }

      return response

    } catch (error) {
      lastError = error as Error

      // 타임아웃 에러
      if (error instanceof Error && error.name === 'AbortError') {
        const timeoutError = new TimeoutError(url, timeout)
        reportError(timeoutError)
        
        // 마지막 시도가 아니면 재시도
        if (attempt < retries - 1) {
          await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)))
          continue
        }
        
        throw timeoutError
      }

      // 네트워크 에러
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        const networkError = new TrackedError(
          `Network error: ${url}`,
          ErrorSeverity.High,
          ErrorCategory.Network,
          { url, method: fetchOptions.method || 'GET' }
        )
        reportError(networkError)
        
        // 마지막 시도가 아니면 재시도
        if (attempt < retries - 1) {
          await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)))
          continue
        }
      }

      // 기타 에러는 그대로 보고하고 재시도
      reportError(error, { url, method: fetchOptions.method || 'GET' })
      
      if (attempt < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)))
        continue
      }
    }
  }

  // 모든 재시도 실패
  throw lastError || new Error(`Failed to fetch: ${url}`)
}

// JSON 응답을 위한 편의 함수
export async function trackedFetchJson<T = any>(
  url: string,
  options?: TrackedFetchOptions
): Promise<T> {
  const response = await trackedFetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })

  try {
    const data = await response.json()
    return data
  } catch (error) {
    reportError(
      new TrackedError(
        `Invalid JSON response from ${url}`,
        ErrorSeverity.High,
        ErrorCategory.Network,
        { url, status: response.status }
      )
    )
    throw error
  }
}

// 파일 업로드를 위한 추적 함수
export async function trackedUpload(
  url: string,
  formData: FormData,
  options?: TrackedFetchOptions & {
    onProgress?: (progress: number) => void
  }
): Promise<Response> {
  // XMLHttpRequest를 사용하여 업로드 진행률 추적
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()

    // 진행률 추적
    if (options?.onProgress) {
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progress = (event.loaded / event.total) * 100
          options.onProgress!(progress)
        }
      })
    }

    // 완료 처리
    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(new Response(xhr.responseText, {
          status: xhr.status,
          statusText: xhr.statusText,
        }))
      } else {
        trackNetworkError(url, xhr.status, 'POST')
        reject(new Error(`Upload failed: ${xhr.status} ${xhr.statusText}`))
      }
    })

    // 에러 처리
    xhr.addEventListener('error', () => {
      const error = new TrackedError(
        `Upload error: ${url}`,
        ErrorSeverity.High,
        ErrorCategory.Network,
        { url, method: 'POST' }
      )
      reportError(error)
      reject(error)
    })

    // 타임아웃 처리
    xhr.addEventListener('timeout', () => {
      const error = new TimeoutError(url, options?.timeout || 60000)
      reportError(error)
      reject(error)
    })

    // 요청 설정
    xhr.open('POST', url)
    xhr.timeout = options?.timeout || 60000

    // 헤더 설정
    if (options?.headers) {
      Object.entries(options.headers).forEach(([key, value]) => {
        if (typeof value === 'string') {
          xhr.setRequestHeader(key, value)
        }
      })
    }

    // 전송
    xhr.send(formData)
  })
}

// 일괄 요청 처리 (동시 요청 제한)
export async function trackedBatchFetch<T = any>(
  requests: Array<{ url: string; options?: TrackedFetchOptions }>,
  concurrency: number = 5
): Promise<Array<{ data?: T; error?: Error }>> {
  const results: Array<{ data?: T; error?: Error }> = []
  const executing: Promise<void>[] = []

  for (let i = 0; i < requests.length; i++) {
    const request = requests[i]
    
    // request null 체크
    if (!request) {
      results[i] = { error: new Error('Invalid request') }
      continue
    }
    
    const promise = trackedFetchJson<T>(request.url, request.options)
      .then(data => {
        results[i] = { data }
      })
      .catch(error => {
        results[i] = { error }
      })

    executing.push(promise)

    // 동시 실행 제한
    if (executing.length >= concurrency) {
      await Promise.race(executing)
      executing.splice(executing.findIndex(p => p === promise), 1)
    }
  }

  // 남은 요청 완료 대기
  await Promise.all(executing)

  return results
}

// 캐시된 fetch (메모리 캐시)
const cache = new Map<string, { data: any; timestamp: number }>()

export async function cachedFetch<T = any>(
  url: string,
  options?: TrackedFetchOptions & { cacheTime?: number }
): Promise<T> {
  const cacheKey = `${options?.method || 'GET'}:${url}`
  const cached = cache.get(cacheKey)
  const cacheTime = options?.cacheTime || 5 * 60 * 1000 // 5분 기본값

  // 캐시 확인
  if (cached && Date.now() - cached.timestamp < cacheTime) {
    return cached.data
  }

  // 새로 요청
  const data = await trackedFetchJson<T>(url, options)
  
  // 캐시 저장
  cache.set(cacheKey, { data, timestamp: Date.now() })

  // 캐시 크기 제한 (100개)
  if (cache.size > 100) {
    const firstKey = cache.keys().next().value
    cache.delete(firstKey)
  }

  return data
}