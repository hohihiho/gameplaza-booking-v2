import { CheckIn } from '@/src/domain/entities/checkin';
import { CheckInRepository } from '@/src/domain/repositories/checkin-repository.interface';
import { ReservationRepository } from '@/src/domain/repositories/reservation.repository.interface';
import { IDeviceRepository } from '@/src/domain/repositories/device.repository.interface';
import { DeviceTypeRepository } from '@/src/domain/repositories/device-type.repository.interface';

export interface ProcessCheckInRequest {
  reservationId: string;
  deviceId: string;
}

export interface ProcessCheckInResponse {
  checkIn: CheckIn;
  message: string;
}

export class ProcessCheckInUseCase {
  constructor(
    private readonly checkInRepository: CheckInRepository,
    private readonly reservationRepository: ReservationRepository,
    private readonly deviceRepository: DeviceRepository,
    private readonly deviceTypeRepository: DeviceTypeRepository
  ) {}

  async execute(request: ProcessCheckInRequest): Promise<ProcessCheckInResponse> {
    // 1. 예약 정보 조회
    const reservation = await this.reservationRepository.findById(request.reservationId);
    if (!reservation) {
      throw new Error('예약을 찾을 수 없습니다');
    }

    // 2. 예약 상태 검증
    if (!reservation.status.isApproved()) {
      throw new Error('승인되지 않은 예약은 체크인할 수 없습니다');
    }

    // 3. 이미 체크인된 예약인지 확인
    const existingCheckIn = await this.checkInRepository.findByReservationId(request.reservationId);
    if (existingCheckIn && existingCheckIn.isActive()) {
      throw new Error('이미 체크인된 예약입니다');
    }

    // 4. 기기 상태 확인
    const device = await this.deviceRepository.findById(request.deviceId);
    if (!device) {
      throw new Error('기기를 찾을 수 없습니다');
    }

    if (!device.canBeReserved()) {
      throw new Error('사용할 수 없는 기기입니다');
    }

    // 5. 기기에 활성 체크인이 있는지 확인
    const activeCheckIn = await this.checkInRepository.findActiveByDeviceId(request.deviceId);
    if (activeCheckIn) {
      throw new Error('이미 사용 중인 기기입니다');
    }

    // 6. 기기 타입 정보를 가져와서 금액 계산
    const deviceType = await this.deviceTypeRepository.findById(device.deviceTypeId);
    if (!deviceType) {
      throw new Error('기기 타입을 찾을 수 없습니다');
    }

    // 예약 시간에서 실제 이용 시간 계산 (시간 단위)
    const durationHours = reservation.timeSlot.duration;
    
    // 기기 타입의 시간당 요금을 기준으로 금액 계산
    const paymentAmount = deviceType.calculatePrice(durationHours);

    // 7. 체크인 생성
    try {
      const checkIn = CheckIn.create({
        reservationId: request.reservationId,
        deviceId: request.deviceId,
        paymentAmount: paymentAmount,
        reservationStartTime: reservation.startDateTime.toDate()
      });

      // 8. 체크인 저장
      const savedCheckIn = await this.checkInRepository.create(checkIn);

      // 9. 예약 상태 업데이트 (체크인됨으로 변경)
      reservation.checkIn();
      await this.reservationRepository.update(reservation);

      return {
        checkIn: savedCheckIn,
        message: `체크인이 완료되었습니다. 결제 금액: ${paymentAmount.toLocaleString()}원`
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`체크인 처리 실패: ${error.message}`);
      }
      throw error;
    }
  }
}