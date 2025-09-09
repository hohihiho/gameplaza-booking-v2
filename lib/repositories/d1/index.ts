// D1 Repository Exports
export { D1BaseRepository } from './base.repository';
export { UserRepository, type User } from './user.repository';
export { DeviceRepository, DeviceTypeRepository, type Device, type DeviceType } from './device.repository';
export { ReservationRepository, type Reservation } from './reservation.repository';

// Repository Factory
export class D1RepositoryFactory {
  private db: D1Database;

  constructor(db: D1Database) {
    this.db = db;
  }

  get users() {
    return new UserRepository(this.db);
  }

  get devices() {
    return new DeviceRepository(this.db);
  }

  get deviceTypes() {
    return new DeviceTypeRepository(this.db);
  }

  get reservations() {
    return new ReservationRepository(this.db);
  }
}

// Helper function to get D1 database from request context
export function getD1Database(request: Request): D1Database | null {
  // Cloudflare Workers 환경에서 D1 접근
  if (typeof globalThis.DB !== 'undefined') {
    return globalThis.DB;
  }

  // Next.js Edge Runtime에서 D1 접근 (개발 환경)
  const env = (request as any).env;
  if (env?.DB) {
    return env.DB;
  }

  return null;
}