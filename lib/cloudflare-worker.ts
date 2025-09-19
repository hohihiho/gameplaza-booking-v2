/**
 * Cloudflare Worker API 호출 유틸리티
 * fetch failed 오류 해결을 위한 타임아웃 및 재시도 로직 포함
 */

const WORKER_URL = process.env.CLOUDFLARE_WORKER_URL || 'http://127.0.0.1:8787';
const DEFAULT_TIMEOUT = 8000; // 8초 타임아웃 (충분한 시간 제공)
const MAX_RETRIES = 2; // 최대 2회 재시도 (너무 많은 재시도 방지)

/**
 * Cloudflare Worker API 호출 (타임아웃 및 재시도 포함)
 */
export async function callWorkerAPI(
  endpoint: string, 
  options: RequestInit = {},
  timeout: number = DEFAULT_TIMEOUT
): Promise<Response> {
  const url = `${WORKER_URL}${endpoint}`;
  
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    let timeoutId: NodeJS.Timeout | undefined;
    
    try {
      // AbortController 사용하지 않고 직접 fetch (타임아웃 문제 해결)
      const fetchPromise = fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        // Next.js fetch 옵션
        cache: 'no-store',
        next: { revalidate: 0 }
      });
      
      // 타임아웃 Promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(new Error(`Request timeout after ${timeout}ms`));
        }, timeout);
      });
      
      // Promise.race로 타임아웃 구현
      const response = await Promise.race([fetchPromise, timeoutPromise]) as Response;
      
      if (timeoutId) clearTimeout(timeoutId);
      return response;
      
    } catch (error: any) {
      if (timeoutId) clearTimeout(timeoutId);
      
      // 네트워크 오류나 타임아웃인 경우
      const isNetworkError = error?.code === 'ECONNREFUSED' || 
                            error?.code === 'ECONNRESET' ||
                            error?.name === 'AbortError' ||
                            error?.message?.includes('fetch failed');
      
      if (attempt === MAX_RETRIES) {
        console.error(`Worker API call failed after ${MAX_RETRIES} attempts:`, {
          endpoint,
          error: error instanceof Error ? error.message : 'Unknown error',
          url,
          code: error?.code
        });
        throw error;
      }
      
      // 네트워크 오류면 더 짧은 대기 시간
      const delay = isNetworkError ? 500 : 1000 * attempt;
      await new Promise(resolve => setTimeout(resolve, delay));
      
      console.warn(`Worker API call failed, retrying (${attempt}/${MAX_RETRIES}):`, error instanceof Error ? error.message : error);
    }
  }
  
  throw new Error('All retry attempts failed');
}

/**
 * Cloudflare Worker API JSON 응답 가져오기
 */
export async function getWorkerData<T = any>(
  endpoint: string, 
  options: RequestInit = {},
  timeout: number = DEFAULT_TIMEOUT
): Promise<T> {
  try {
    const response = await callWorkerAPI(endpoint, options, timeout);
    
    if (!response.ok) {
      throw new Error(`Worker API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Worker API data fetch failed:', {
      endpoint,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
}

/**
 * Worker API 연결 상태 확인
 */
export async function checkWorkerHealth(): Promise<boolean> {
  try {
    const data = await getWorkerData('/api/health', {}, 5000); // 5초 타임아웃
    return data.status === 'healthy';
  } catch (error) {
    console.error('Worker health check failed:', error);
    return false;
  }
}

/**
 * Cloudflare Worker API POST 요청
 */
export async function postWorkerData<T = any>(
  endpoint: string,
  data: any,
  timeout: number = DEFAULT_TIMEOUT
): Promise<T> {
  try {
    const response = await callWorkerAPI(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    }, timeout);
    
    if (!response.ok) {
      throw new Error(`Worker API error: ${response.status} ${response.statusText}`);
    }
    
    const responseData = await response.json();
    return responseData;
  } catch (error) {
    console.error('Worker API POST failed:', {
      endpoint,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
}

/**
 * Cloudflare Worker API PUT 요청
 */
export async function putWorkerData<T = any>(
  endpoint: string,
  data: any,
  timeout: number = DEFAULT_TIMEOUT
): Promise<T> {
  try {
    const response = await callWorkerAPI(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data)
    }, timeout);
    
    if (!response.ok) {
      throw new Error(`Worker API error: ${response.status} ${response.statusText}`);
    }
    
    const responseData = await response.json();
    return responseData;
  } catch (error) {
    console.error('Worker API PUT failed:', {
      endpoint,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
}