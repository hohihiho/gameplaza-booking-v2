import { CheckIn } from '@/src/domain/entities/checkin';
import { CheckInRepository } from '@/src/domain/repositories/checkin-repository.interface';
import { ReservationRepository } from '@/src/domain/repositories/reservation.repository.interface';

export interface ProcessCheckOutRequest {
  checkInId: string;
  notes?: string;
}

export interface ProcessCheckOutResponse {
  checkIn: CheckIn;
  summary: {
    totalTime: number; // 실제 사용 시간 (분)
    finalAmount: number; // 최종 금액
    paymentMethod: string; // 결제 방법
  };
  message: string;
}

export class ProcessCheckOutUseCase {
  constructor(
    private readonly checkInRepository: CheckInRepository,
    private readonly reservationRepository: ReservationRepository
  ) {}

  async execute(request: ProcessCheckOutRequest): Promise<ProcessCheckOutResponse> {
    // 1. 체크인 조회
    const checkIn = await this.checkInRepository.findById(request.checkInId);
    if (!checkIn) {
      throw new Error('체크인 정보를 찾을 수 없습니다');
    }

    // 2. 체크아웃 가능 상태 확인
    if (!checkIn.status.isInUse()) {
      throw new Error('사용 중인 체크인만 체크아웃할 수 있습니다');
    }

    // 3. 결제 상태 확인
    if (!checkIn.paymentStatus.isCompleted()) {
      throw new Error('결제가 완료되지 않은 체크인은 체크아웃할 수 없습니다');
    }

    // 4. 메모 업데이트
    if (request.notes) {
      checkIn.updateNotes(request.notes);
    }

    // 5. 체크아웃 처리
    try {
      checkIn.checkOut();

      // 6. 업데이트된 체크인 저장
      const updatedCheckIn = await this.checkInRepository.update(checkIn);

      // 7. 예약 상태 업데이트 (완료로 변경)
      const reservation = await this.reservationRepository.findById(checkIn.reservationId);
      if (reservation) {
        reservation.complete();
        await this.reservationRepository.update(reservation);
      }

      // 8. 응답 생성
      const actualDuration = updatedCheckIn.actualDuration || 0;
      const hours = Math.floor(actualDuration / 60);
      const minutes = actualDuration % 60;
      const timeString = hours > 0 
        ? `${hours}시간 ${minutes}분` 
        : `${minutes}분`;

      return {
        checkIn: updatedCheckIn,
        summary: {
          totalTime: actualDuration,
          finalAmount: updatedCheckIn.finalAmount,
          paymentMethod: updatedCheckIn.paymentMethod?.getDisplayName() || '알 수 없음'
        },
        message: `체크아웃이 완료되었습니다. 이용 시간: ${timeString}, 결제 금액: ${updatedCheckIn.finalAmount.toLocaleString()}원`
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`체크아웃 처리 실패: ${error.message}`);
      }
      throw error;
    }
  }
}