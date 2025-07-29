import { CheckInRepository } from '@/src/domain/repositories/checkin-repository.interface';
import { ReservationRepository } from '@/src/domain/repositories/reservation.repository.interface';
import { DeviceRepository } from '@/src/domain/repositories/device.repository.interface';
import { UserRepository } from '@/src/domain/repositories/user-repository.interface';
import { ActiveCheckInListDTO, CheckInSummaryDTO, CheckInMapper } from '@/src/application/dto/checkin.dto';
import { CheckIn } from '@/src/domain/entities/checkin';

export interface GetActiveCheckInsRequest {
  deviceId?: string; // 특정 기기의 활성 체크인만 조회
  includeWaitingPayment?: boolean; // 결제 대기 중인 체크인 포함 여부
}

export interface GetActiveCheckInsResponse {
  data: ActiveCheckInListDTO;
}

export class GetActiveCheckInsUseCase {
  constructor(
    private readonly checkInRepository: CheckInRepository,
    private readonly reservationRepository: ReservationRepository,
    private readonly deviceRepository: DeviceRepository,
    private readonly userRepository: UserRepository
  ) {}

  async execute(request: GetActiveCheckInsRequest): Promise<GetActiveCheckInsResponse> {
    // 1. 활성 체크인 조회
    let checkIns: CheckIn[];
    
    if (request.deviceId) {
      // 특정 기기의 활성 체크인 조회
      const activeCheckIn = await this.checkInRepository.findActiveByDeviceId(request.deviceId);
      checkIns = activeCheckIn ? [activeCheckIn] : [];
    } else {
      // 전체 활성 체크인 조회
      checkIns = await this.checkInRepository.findActiveCheckIns();
    }

    // 2. 결제 대기 중인 체크인 필터링
    if (!request.includeWaitingPayment) {
      checkIns = checkIns.filter(checkIn => !checkIn.isWaitingPayment());
    }

    // 3. 관련 정보 일괄 조회를 위한 ID 수집
    const reservationIds = checkIns.map(c => c.reservationId);
    const deviceIds = checkIns.map(c => c.deviceId);
    
    // 4. 관련 정보 병렬 조회
    const [reservations, devices] = await Promise.all([
      this.getReservationsByIds(reservationIds),
      this.getDevicesByIds(deviceIds)
    ]);

    // 5. 사용자 정보 조회를 위한 userId 수집
    const userIds = reservations.map(r => r.userId);
    const users = await this.getUsersByIds(userIds);

    // 6. Map 생성 (빠른 조회를 위해)
    const reservationMap = new Map(reservations.map(r => [r.id, r]));
    const deviceMap = new Map(devices.map(d => [d.id, d]));
    const userMap = new Map(users.map(u => [u.id, u]));

    // 7. DTO 변환
    const checkInSummaries: CheckInSummaryDTO[] = checkIns.map(checkIn => {
      const reservation = reservationMap.get(checkIn.reservationId);
      const device = deviceMap.get(checkIn.deviceId);
      const user = reservation ? userMap.get(reservation.userId) : null;

      return CheckInMapper.toSummaryDTO(checkIn, reservation, device, user);
    });

    // 8. 응답 생성
    return {
      data: {
        checkIns: checkInSummaries,
        totalCount: checkInSummaries.length
      }
    };
  }

  private async getReservationsByIds(ids: string[]): Promise<any[]> {
    if (ids.length === 0) return [];
    
    // 실제 구현에서는 findByIds 메서드를 사용하거나 Promise.all로 개별 조회
    const reservations = await Promise.all(
      ids.map(id => this.reservationRepository.findById(id))
    );
    
    return reservations.filter(r => r !== null);
  }

  private async getDevicesByIds(ids: string[]): Promise<any[]> {
    if (ids.length === 0) return [];
    
    // 실제 구현에서는 findByIds 메서드를 사용하거나 Promise.all로 개별 조회
    const devices = await Promise.all(
      ids.map(id => this.deviceRepository.findById(id))
    );
    
    return devices.filter(d => d !== null);
  }

  private async getUsersByIds(ids: string[]): Promise<any[]> {
    if (ids.length === 0) return [];
    
    // 중복 제거
    const uniqueIds = Array.from(new Set(ids));
    
    // 실제 구현에서는 findByIds 메서드를 사용하거나 Promise.all로 개별 조회
    const users = await Promise.all(
      uniqueIds.map(id => this.userRepository.findById(id))
    );
    
    return users.filter(u => u !== null);
  }
}