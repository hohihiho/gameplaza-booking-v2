import { ReservationService } from '../../domain/services/reservation.service'
import { IUserRepository } from '../../domain/repositories/user.repository.interface'
import { ReservationResponseDto } from '../dtos/reservation.dto'
import { ReservationMapper } from '../mappers/reservation.mapper'

export class CancelReservationUseCase {
  constructor(
    private readonly reservationService: ReservationService,
    private readonly userRepository: IUserRepository,
    private readonly mapper: ReservationMapper
  ) {}

  async execute(
    userId: string,
    reservationId: string
  ): Promise<ReservationResponseDto> {
    // 1. 사용자 조회
    const user = await this.userRepository.findById(userId)
    if (!user) {
      throw new Error('User not found')
    }

    // 2. 예약 취소 (도메인 서비스 호출)
    const cancelledReservation = await this.reservationService.cancelReservation(
      reservationId,
      user
    )

    // 3. DTO로 변환하여 반환
    return this.mapper.toDto(cancelledReservation)
  }
}