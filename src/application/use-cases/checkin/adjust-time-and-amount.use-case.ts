import { CheckInRepository } from '@/src/domain/repositories/checkin-repository.interface';
import { CheckIn } from '@/src/domain/entities/checkin';

export interface AdjustTimeAndAmountRequest {
  checkInId: string;
  actualStartTime?: Date;
  actualEndTime?: Date;
  adjustedAmount?: number;
  adjustmentReason?: string;
}

export interface AdjustTimeAndAmountResponse {
  checkIn: CheckIn;
  message: string;
}

export class AdjustTimeAndAmountUseCase {
  constructor(
    private readonly checkInRepository: CheckInRepository
  ) {}

  async execute(request: AdjustTimeAndAmountRequest): Promise<AdjustTimeAndAmountResponse> {
    // 1. 체크인 조회
    const checkIn = await this.checkInRepository.findById(request.checkInId);
    if (!checkIn) {
      throw new Error('체크인 정보를 찾을 수 없습니다');
    }

    // 2. 활성 상태 검증
    if (!checkIn.isActive()) {
      throw new Error('활성 상태의 체크인만 조정할 수 있습니다');
    }

    // 3. 시간 조정
    if (request.actualStartTime || request.actualEndTime) {
      try {
        checkIn.adjustTime(request.actualStartTime, request.actualEndTime);
      } catch (error) {
        if (error instanceof Error) {
          throw new Error(`시간 조정 실패: ${error.message}`);
        }
        throw error;
      }
    }

    // 4. 금액 조정
    if (request.adjustedAmount !== undefined && request.adjustmentReason) {
      try {
        checkIn.adjustAmount(request.adjustedAmount, request.adjustmentReason);
      } catch (error) {
        if (error instanceof Error) {
          throw new Error(`금액 조정 실패: ${error.message}`);
        }
        throw error;
      }
    } else if (request.adjustedAmount !== undefined) {
      throw new Error('금액 조정 시 사유를 입력해주세요');
    }

    // 5. 업데이트된 체크인 저장
    const updatedCheckIn = await this.checkInRepository.update(checkIn);

    // 6. 응답 메시지 생성
    const messages: string[] = [];
    if (request.actualStartTime || request.actualEndTime) {
      messages.push('시간이 조정되었습니다');
    }
    if (request.adjustedAmount !== undefined) {
      messages.push(`금액이 ${updatedCheckIn.finalAmount.toLocaleString()}원으로 조정되었습니다`);
    }

    return {
      checkIn: updatedCheckIn,
      message: messages.join('. ')
    };
  }
}