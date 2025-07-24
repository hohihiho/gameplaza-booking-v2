import { Reservation } from '@/src/domain/entities/reservation'
import { ReservationRepository } from '@/src/domain/repositories/reservation.repository.interface'
import { UserRepository } from '@/src/domain/repositories/user.repository.interface'

export interface GetReservationRequest {
  reservationId: string
  userId: string
}

export interface GetReservationResponse {
  reservation: Reservation
}

/**
 * 예약 조회 유스케이스
 * 사용자는 자신의 예약만 조회 가능하고, 관리자는 모든 예약 조회 가능
 */
export class GetReservationUseCase {
  constructor(
    private reservationRepository: ReservationRepository,
    private userRepository: UserRepository
  ) {}

  async execute(request: GetReservationRequest): Promise<GetReservationResponse> {
    // 1. 사용자 조회
    const user = await this.userRepository.findById(request.userId)
    if (!user) {
      throw new Error('사용자를 찾을 수 없습니다')
    }

    // 2. 예약 조회
    const reservation = await this.reservationRepository.findById(request.reservationId)
    if (!reservation) {
      throw new Error('예약을 찾을 수 없습니다')
    }

    // 3. 조회 권한 확인
    const isOwner = reservation.userId === request.userId
    const isAdmin = user.role === 'admin'

    if (!isOwner && !isAdmin) {
      throw new Error('예약을 조회할 권한이 없습니다')
    }

    return {
      reservation
    }
  }
}