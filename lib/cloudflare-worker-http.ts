/**
 * Cloudflare Worker API 호출 유틸리티 (http 모듈 사용)
 * Next.js fetch 문제를 우회하기 위한 대안
 */

import http from 'http';
import { URL } from 'url';

const WORKER_URL = process.env.CLOUDFLARE_WORKER_URL || 'http://127.0.0.1:8787';

/**
 * HTTP 요청을 통한 Worker API 호출
 */
export async function callWorkerAPIWithHttp(
  endpoint: string, 
  options: {
    method?: string;
    body?: any;
    headers?: Record<string, string>;
  } = {}
): Promise<any> {
  return new Promise((resolve, reject) => {
    const url = new URL(`${WORKER_URL}${endpoint}`);
    
    const requestOptions: http.RequestOptions = {
      hostname: url.hostname,
      port: url.port || 80,
      path: url.pathname + url.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    const req = http.request(requestOptions, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsed);
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${data}`));
          }
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    // 타임아웃 설정
    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }

    req.end();
  });
}

/**
 * Worker API GET 요청
 */
export async function getWorkerDataHttp(endpoint: string): Promise<any> {
  try {
    return await callWorkerAPIWithHttp(endpoint);
  } catch (error) {
    console.error('Worker API (HTTP) 호출 실패:', error);
    throw error;
  }
}

/**
 * Worker API POST 요청
 */
export async function postWorkerDataHttp(endpoint: string, data: any): Promise<any> {
  try {
    return await callWorkerAPIWithHttp(endpoint, {
      method: 'POST',
      body: data
    });
  } catch (error) {
    console.error('Worker API POST (HTTP) 호출 실패:', error);
    throw error;
  }
}