import { CheckInRepository } from '@/src/domain/repositories/checkin-repository.interface';
import { ReservationRepository } from '@/src/domain/repositories/reservation.repository.interface';
import { DeviceRepository } from '@/src/domain/repositories/device.repository.interface';
import { UserRepository } from '@/src/domain/repositories/user-repository.interface';
import { CheckInDetailDTO, CheckInMapper } from '@/src/application/dto/checkin.dto';

export interface GetCheckInDetailsRequest {
  checkInId: string;
}

export interface GetCheckInDetailsResponse {
  checkIn: CheckInDetailDTO;
}

export class GetCheckInDetailsUseCase {
  constructor(
    private readonly checkInRepository: CheckInRepository,
    private readonly reservationRepository: ReservationRepository,
    private readonly deviceRepository: DeviceRepository,
    private readonly userRepository: UserRepository
  ) {}

  async execute(request: GetCheckInDetailsRequest): Promise<GetCheckInDetailsResponse> {
    // 1. 체크인 조회
    const checkIn = await this.checkInRepository.findById(request.checkInId);
    if (!checkIn) {
      throw new Error('체크인 정보를 찾을 수 없습니다');
    }

    // 2. 관련 정보 조회 (병렬 처리)
    const [reservation, device] = await Promise.all([
      this.reservationRepository.findById(checkIn.reservationId),
      this.deviceRepository.findById(checkIn.deviceId)
    ]);

    // 3. 사용자 정보 조회
    let user = null;
    if (reservation) {
      user = await this.userRepository.findById(reservation.userId);
    }

    // 4. DTO 변환 및 반환
    return {
      checkIn: CheckInMapper.toDetailDTO(checkIn, reservation, device, user)
    };
  }
}