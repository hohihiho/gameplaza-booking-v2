import { CheckInRepository } from '@/src/domain/repositories/checkin-repository.interface';
import { PaymentMethodType } from '@/src/domain/value-objects/payment-method';
import { CheckIn } from '@/src/domain/entities/checkin';

export interface ConfirmPaymentRequest {
  checkInId: string;
  paymentMethod: PaymentMethodType;
}

export interface ConfirmPaymentResponse {
  checkIn: CheckIn;
  message: string;
}

export class ConfirmPaymentUseCase {
  constructor(
    private readonly checkInRepository: CheckInRepository
  ) {}

  async execute(request: ConfirmPaymentRequest): Promise<ConfirmPaymentResponse> {
    // 1. 체크인 조회
    const checkIn = await this.checkInRepository.findById(request.checkInId);
    if (!checkIn) {
      throw new Error('체크인 정보를 찾을 수 없습니다');
    }

    // 2. 체크인 상태 검증
    if (!checkIn.status.isCheckedIn()) {
      throw new Error('체크인 상태에서만 결제를 확인할 수 있습니다');
    }

    // 3. 이미 결제 완료된 경우 검증
    if (checkIn.paymentStatus.isCompleted()) {
      throw new Error('이미 결제가 완료되었습니다');
    }

    // 4. 결제 확인 처리
    try {
      checkIn.confirmPayment(request.paymentMethod);

      // 5. 업데이트된 체크인 저장
      const updatedCheckIn = await this.checkInRepository.update(checkIn);

      return {
        checkIn: updatedCheckIn,
        message: '결제가 확인되었습니다. 기기를 사용하실 수 있습니다.'
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`결제 확인 실패: ${error.message}`);
      }
      throw error;
    }
  }
}