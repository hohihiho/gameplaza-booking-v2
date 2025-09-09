/**
 * API Client for frontend
 * Frontend에서 백엔드 API를 호출하기 위한 클라이언트
 */

export class ApiClient {
  private baseUrl: string;
  
  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl;
  }
  
  private async fetch(url: string, options?: RequestInit) {
    const response = await fetch(`${this.baseUrl}${url}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      credentials: 'include', // 쿠키 포함
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `API Error: ${response.status}`);
    }
    
    return response.json();
  }
  
  // Users
  users = {
    profile: () => this.fetch('/api/auth/profile'),
    update: (data: any) => this.fetch('/api/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    list: () => this.fetch('/api/admin/users'),
    search: (query: string) => this.fetch(`/api/admin/users/search?q=${query}`),
  };
  
  // Devices
  devices = {
    list: () => this.fetch('/api/devices'),
    get: (id: string) => this.fetch(`/api/devices/${id}`),
    create: (data: any) => this.fetch('/api/admin/devices', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (id: string, data: any) => this.fetch(`/api/admin/devices/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    delete: (id: string) => this.fetch(`/api/admin/devices/${id}`, {
      method: 'DELETE',
    }),
  };
  
  // Reservations
  reservations = {
    list: () => this.fetch('/api/reservations'),
    my: () => this.fetch('/api/reservations/my'),
    create: (data: any) => this.fetch('/api/reservations', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    cancel: (id: string) => this.fetch(`/api/reservations/${id}/cancel`, {
      method: 'POST',
    }),
    checkin: (id: string) => this.fetch(`/api/reservations/${id}/checkin`, {
      method: 'POST',
    }),
    checkout: (id: string) => this.fetch(`/api/reservations/${id}/checkout`, {
      method: 'POST',
    }),
  };
  
  // Admin
  admin = {
    checkAuth: () => this.fetch('/api/admin/auth/check'),
    stats: () => this.fetch('/api/admin/stats'),
    holidays: {
      list: () => this.fetch('/api/admin/holidays'),
      create: (data: any) => this.fetch('/api/admin/holidays', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
      delete: (id: string) => this.fetch(`/api/admin/holidays/${id}`, {
        method: 'DELETE',
      }),
    },
  };
  
  // Auth
  auth = {
    session: () => this.fetch('/api/auth/session'),
    signOut: () => this.fetch('/api/auth/signout', { method: 'POST' }),
  };
}

// 싱글톤 인스턴스
export const apiClient = new ApiClient();