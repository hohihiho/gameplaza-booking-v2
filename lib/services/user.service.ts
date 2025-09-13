/**
 * 사용자 관련 비즈니스 로직을 처리하는 서비스 레이어
 */

// import { getDB, supabase } from '@/lib/db'
import { Database } from '@/types/database'
import { UserRepository } from '@/lib/repositories/user.repository'
import { ReservationRepository } from '@/lib/repositories/reservation.repository'
import { 
  AppError, 
  ErrorCodes 
} from '@/lib/utils/error-handler'
import { logger } from '@/lib/utils/logger'

export interface CreateUserDto {
  id: string
  email: string
  name?: string
  phone?: string
  role?: string
}

export interface UpdateUserDto {
  name?: string
  phone?: string
  email?: string
}

export class UserService {
  private userRepo: UserRepository
  private reservationRepo: ReservationRepository

  constructor(supabase: SupabaseClient<Database>) {
    this.userRepo = new UserRepository(supabase)
    this.reservationRepo = new ReservationRepository(supabase)
  }

  /**
   * 사용자 조회 (ID)
   */
  async getUserById(id: string) {
    try {
      const user = await this.userRepo.findById(id)
      
      if (!user) {
        throw new AppError(ErrorCodes.USER_NOT_FOUND, '사용자를 찾을 수 없습니다', 404)
      }

      return user
    } catch (error) {
      logger.error('Failed to fetch user by id', error)
      throw error
    }
  }

  /**
   * 사용자 조회 (이메일)
   */
  async getUserByEmail(email: string) {
    try {
      const user = await this.userRepo.findByEmail(email)
      
      if (!user) {
        throw new AppError(ErrorCodes.USER_NOT_FOUND, '사용자를 찾을 수 없습니다', 404)
      }

      return user
    } catch (error) {
      logger.error('Failed to fetch user by email', error)
      throw error
    }
  }

  /**
   * 사용자 조회 (관리자 정보 포함)
   */
  async getUserWithAdminStatus(id: string) {
    try {
      const user = await this.userRepo.findWithAdminStatus(id)
      
      if (!user) {
        throw new AppError(ErrorCodes.USER_NOT_FOUND, '사용자를 찾을 수 없습니다', 404)
      }

      return {
        ...user,
        isAdmin: !!user.admins
      }
    } catch (error) {
      logger.error('Failed to fetch user with admin status', error)
      throw error
    }
  }

  /**
   * 사용자 생성 또는 업데이트
   */
  async createOrUpdateUser(data: CreateUserDto) {
    try {
      logger.info('Creating or updating user', { userId: data.id })

      const user = await this.userRepo.createIfNotExists({
        id: data.id,
        email: data.email,
        name: data.name || data.email.split('@')[0],
        phone: data.phone,
        role: data.role || 'user',
        created_at: new Date().toISOString()
      })

      // 마지막 로그인 시간 업데이트
      await this.userRepo.updateLastLogin(data.id)

      logger.info('User created/updated successfully', { userId: user.id })

      return user
    } catch (error) {
      logger.error('Failed to create or update user', error)
      throw error
    }
  }

  /**
   * 사용자 정보 업데이트
   */
  async updateUser(id: string, data: UpdateUserDto) {
    try {
      logger.info('Updating user', { id, data })

      const user = await this.userRepo.findById(id)
      if (!user) {
        throw new AppError(ErrorCodes.USER_NOT_FOUND, '사용자를 찾을 수 없습니다', 404)
      }

      const updated = await this.userRepo.update(id, {
        name: data.name,
        phone: data.phone,
        email: data.email,
        updated_at: new Date().toISOString()
      })

      logger.info('User updated successfully', { userId: id })

      return updated
    } catch (error) {
      logger.error('Failed to update user', error)
      throw error
    }
  }

  /**
   * 사용자 검색
   */
  async searchUsers(query: string) {
    try {
      const users = await this.userRepo.searchUsers(query)
      return users
    } catch (error) {
      logger.error('Failed to search users', error)
      throw error
    }
  }

  /**
   * 최근 가입한 사용자 조회
   */
  async getRecentUsers(limit: number = 10) {
    try {
      const users = await this.userRepo.findRecentUsers(limit)
      return users
    } catch (error) {
      logger.error('Failed to fetch recent users', error)
      throw error
    }
  }

  /**
   * 사용자 통계 조회
   */
  async getUserStats() {
    try {
      const stats = await this.userRepo.getUserStats()
      return stats
    } catch (error) {
      logger.error('Failed to fetch user stats', error)
      throw error
    }
  }

  /**
   * 사용자별 예약 통계 조회
   */
  async getUserReservationStats(userId: string) {
    try {
      const user = await this.userRepo.findById(userId)
      if (!user) {
        throw new AppError(ErrorCodes.USER_NOT_FOUND, '사용자를 찾을 수 없습니다', 404)
      }

      const { data: reservations } = await this.reservationRepo.findByUserId(userId)

      const stats = {
        totalReservations: reservations.length,
        activeReservations: 0,
        completedReservations: 0,
        cancelledReservations: 0,
        totalSpent: 0,
        averageSpentPerReservation: 0,
        favoriteDevice: null as string | null,
        favoriteTimeSlot: null as string | null
      }

      // 기기별, 시간대별 예약 횟수 계산
      const deviceCount = new Map<string, number>()
      const timeSlotCount = new Map<string, number>()

      reservations.forEach(reservation => {
        // 상태별 카운트
        switch (reservation.status) {
          case 'pending':
          case 'approved':
          case 'checked_in':
            stats.activeReservations++
            break
          case 'completed':
            stats.completedReservations++
            stats.totalSpent += reservation.total_amount || 0
            break
          case 'cancelled':
          case 'rejected':
            stats.cancelledReservations++
            break
        }

        // 기기별 카운트
        const deviceName = reservation.devices?.device_types?.name || 'Unknown'
        deviceCount.set(deviceName, (deviceCount.get(deviceName) || 0) + 1)

        // 시간대별 카운트
        const timeSlot = reservation.start_time
        timeSlotCount.set(timeSlot, (timeSlotCount.get(timeSlot) || 0) + 1)
      })

      // 평균 지출 계산
      if (stats.completedReservations > 0) {
        stats.averageSpentPerReservation = Math.round(stats.totalSpent / stats.completedReservations)
      }

      // 선호 기기 찾기
      let maxDeviceCount = 0
      deviceCount.forEach((count, device) => {
        if (count > maxDeviceCount) {
          maxDeviceCount = count
          stats.favoriteDevice = device
        }
      })

      // 선호 시간대 찾기
      let maxTimeSlotCount = 0
      timeSlotCount.forEach((count, timeSlot) => {
        if (count > maxTimeSlotCount) {
          maxTimeSlotCount = count
          stats.favoriteTimeSlot = timeSlot
        }
      })

      return {
        user,
        stats
      }
    } catch (error) {
      logger.error('Failed to fetch user reservation stats', error)
      throw error
    }
  }

  /**
   * 관리자 권한 확인
   */
  async checkAdminStatus(userId: string): Promise<boolean> {
    try {
      return await this.userRepo.isAdmin(userId)
    } catch (error) {
      logger.error('Failed to check admin status', error)
      return false
    }
  }

  /**
   * 활성 사용자 수 조회
   */
  async getActiveUsersCount(days: number = 30) {
    try {
      const since = new Date()
      since.setDate(since.getDate() - days)
      
      const count = await this.userRepo.getActiveUsersCount(since)
      return count
    } catch (error) {
      logger.error('Failed to fetch active users count', error)
      throw error
    }
  }
}