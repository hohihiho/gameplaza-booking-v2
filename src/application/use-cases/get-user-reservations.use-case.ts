import { IReservationRepository } from '../../domain/repositories/reservation.repository.interface'
import { ReservationListDto, ReservationFilterDto } from '../dtos/reservation.dto'
import { ReservationMapper } from '../mappers/reservation.mapper'

export class GetUserReservationsUseCase {
  constructor(
    private readonly reservationRepository: IReservationRepository,
    private readonly mapper: ReservationMapper
  ) {}

  async execute(
    userId: string,
    filter: ReservationFilterDto = {}
  ): Promise<ReservationListDto> {
    // 1. 사용자의 예약 목록 조회
    const reservations = await this.reservationRepository.findByUserId(userId)
    
    // 2. 필터링 적용
    let filtered = reservations
    
    if (filter.date) {
      filtered = filtered.filter(r => r.date.dateString === filter.date)
    }
    
    if (filter.status) {
      filtered = filtered.filter(r => r.status.value === filter.status)
    }
    
    // 3. 페이지네이션
    const page = filter.page || 1
    const pageSize = filter.pageSize || 10
    const start = (page - 1) * pageSize
    const end = start + pageSize
    
    const paginated = filtered.slice(start, end)
    
    // 4. DTO로 변환
    return {
      reservations: paginated.map(r => this.mapper.toDto(r)),
      total: filtered.length,
      page,
      pageSize
    }
  }
}