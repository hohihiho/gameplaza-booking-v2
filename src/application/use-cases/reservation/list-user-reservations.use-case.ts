import { Reservation } from '@/src/domain/entities/reservation'
import { ReservationRepository } from '@/src/domain/repositories/reservation.repository.interface'
import { UserRepository } from '@/src/domain/repositories/user.repository.interface'
import { KSTDateTime } from '@/src/domain/value-objects/kst-datetime'

export interface ListUserReservationsRequest {
  userId: string
  targetUserId?: string // 관리자가 다른 사용자의 예약을 조회할 때 사용
  status?: string[] // 특정 상태의 예약만 필터링
  dateFrom?: string // YYYY-MM-DD
  dateTo?: string // YYYY-MM-DD
  page?: number
  pageSize?: number
}

export interface ListUserReservationsResponse {
  reservations: Reservation[]
  totalCount: number
  page: number
  pageSize: number
  totalPages: number
}

/**
 * 사용자 예약 목록 조회 유스케이스
 * 사용자는 자신의 예약만, 관리자는 모든 사용자의 예약 조회 가능
 */
export class ListUserReservationsUseCase {
  constructor(
    private reservationRepository: ReservationRepository,
    private userRepository: UserRepository
  ) {}

  async execute(request: ListUserReservationsRequest): Promise<ListUserReservationsResponse> {
    // 1. 기본값 설정
    const page = request.page || 1
    const pageSize = request.pageSize || 20

    // 2. 요청한 사용자 조회
    const requestingUser = await this.userRepository.findById(request.userId)
    if (!requestingUser) {
      throw new Error('사용자를 찾을 수 없습니다')
    }

    // 3. 조회 대상 사용자 결정
    let targetUserId = request.userId
    if (request.targetUserId && request.targetUserId !== request.userId) {
      // 다른 사용자의 예약을 조회하려는 경우 관리자 권한 필요
      if (requestingUser.role !== 'admin') {
        throw new Error('다른 사용자의 예약을 조회할 권한이 없습니다')
      }
      targetUserId = request.targetUserId
    }

    // 4. 날짜 범위 처리
    let dateFrom: KSTDateTime | undefined
    let dateTo: KSTDateTime | undefined

    if (request.dateFrom) {
      dateFrom = KSTDateTime.fromString(request.dateFrom)
    }
    if (request.dateTo) {
      dateTo = KSTDateTime.fromString(request.dateTo)
    }

    // 5. 예약 목록 조회
    const { reservations, totalCount } = await this.reservationRepository.findByUserId(
      targetUserId,
      {
        status: request.status,
        dateFrom: dateFrom?.toDate(),
        dateTo: dateTo?.toDate(),
        page,
        pageSize
      }
    )

    // 6. 페이지 정보 계산
    const totalPages = Math.ceil(totalCount / pageSize)

    return {
      reservations,
      totalCount,
      page,
      pageSize,
      totalPages
    }
  }
}