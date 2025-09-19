import { getD1Database } from '@/lib/db/d1';
import { DeviceRepository, DeviceTypeRepository } from './device.repository';
import { ReservationRepository, UserRepository } from './reservation.repository';
import { NextRequest } from 'next/server';

export class D1RepositoryFactory {
  public devices: DeviceRepository;
  public deviceTypes: DeviceTypeRepository;
  public reservations: ReservationRepository;
  public users: UserRepository;

  constructor(db: D1Database) {
    this.devices = new DeviceRepository(db);
    this.deviceTypes = new DeviceTypeRepository(db);
    this.reservations = new ReservationRepository(db);
    this.users = new UserRepository(db);
  }
}

// NextRequest에서 D1 데이터베이스 인스턴스를 가져오는 함수
export function getD1Database(request?: NextRequest): D1Database | null {
  try {
    // Cloudflare Worker 환경에서는 환경 변수나 바인딩을 통해 D1에 접근
    if (typeof process !== 'undefined' && process.env.NODE_ENV === 'development') {
      // 개발 환경에서는 로컬 SQLite 사용
      return getD1Database() as any;
    }
    
    // 프로덕션 환경에서는 실제 D1 바인딩 사용
    if (typeof globalThis !== 'undefined' && 'DB' in globalThis) {
      return (globalThis as any).DB;
    }
    
    // 기본적으로 개발용 D1 인스턴스 반환
    return getD1Database() as any;
  } catch (error) {
    console.error('Failed to get D1 database:', error);
    return null;
  }
}

export * from './device.repository';
export * from './reservation.repository';
export * from './base.repository';