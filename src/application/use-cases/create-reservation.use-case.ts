import { ReservationService } from '../../domain/services/reservation.service'
import { IUserRepository } from '../../domain/repositories/user.repository.interface'
import { CreateReservationDto, ReservationResponseDto } from '../dtos/reservation.dto'
import { ReservationMapper } from '../mappers/reservation.mapper'

export class CreateReservationUseCase {
  constructor(
    private readonly reservationService: ReservationService,
    private readonly userRepository: IUserRepository,
    private readonly mapper: ReservationMapper
  ) {}

  async execute(
    userId: string,
    dto: CreateReservationDto
  ): Promise<ReservationResponseDto> {
    // 1. 사용자 조회
    const user = await this.userRepository.findById(userId)
    if (!user) {
      throw new Error('User not found')
    }

    // 2. 예약 생성 (도메인 서비스 호출)
    const reservation = await this.reservationService.createReservation(
      {
        userId,
        deviceId: dto.deviceId,
        date: dto.date,
        timeSlot: dto.timeSlot
      },
      user
    )

    // 3. DTO로 변환하여 반환
    return this.mapper.toDto(reservation)
  }
}