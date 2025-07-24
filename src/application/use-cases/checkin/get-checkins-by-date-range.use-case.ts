import { CheckInRepository } from '@/src/domain/repositories/checkin-repository.interface';
import { CheckInDTO, CheckInMapper, CheckInStatisticsDTO } from '@/src/application/dto/checkin.dto';

export interface GetCheckInsByDateRangeRequest {
  startDate: Date;
  endDate: Date;
  includeStatistics?: boolean;
}

export interface GetCheckInsByDateRangeResponse {
  checkIns: CheckInDTO[];
  statistics?: CheckInStatisticsDTO;
  totalCount: number;
}

export class GetCheckInsByDateRangeUseCase {
  constructor(
    private readonly checkInRepository: CheckInRepository
  ) {}

  async execute(request: GetCheckInsByDateRangeRequest): Promise<GetCheckInsByDateRangeResponse> {
    // 1. 날짜 유효성 검증
    if (request.startDate > request.endDate) {
      throw new Error('시작 날짜는 종료 날짜보다 이전이어야 합니다');
    }

    // 2. 날짜 범위로 체크인 조회
    const checkIns = await this.checkInRepository.findByDateRange(
      request.startDate,
      request.endDate
    );

    // 3. DTO 변환
    const checkInDTOs = checkIns.map(checkIn => CheckInMapper.toDTO(checkIn));

    // 4. 통계 계산 (요청된 경우)
    let statistics: CheckInStatisticsDTO | undefined;
    
    if (request.includeStatistics) {
      const activeCheckIns = checkIns.filter(c => c.isActive()).length;
      const completedCheckIns = checkIns.filter(c => c.status.isCompleted()).length;
      
      const totalRevenue = checkIns.reduce((sum, checkIn) => {
        return sum + checkIn.finalAmount;
      }, 0);

      const totalUsageTime = checkIns
        .filter(c => c.actualDuration !== undefined)
        .reduce((sum, checkIn) => {
          return sum + (checkIn.actualDuration || 0);
        }, 0);

      const checkInsWithDuration = checkIns.filter(c => c.actualDuration !== undefined).length;
      const averageUsageTime = checkInsWithDuration > 0 
        ? Math.round(totalUsageTime / checkInsWithDuration)
        : 0;

      statistics = {
        totalCheckIns: checkIns.length,
        activeCheckIns,
        completedCheckIns,
        totalRevenue,
        averageUsageTime
      };
    }

    // 5. 응답 생성
    return {
      checkIns: checkInDTOs,
      statistics,
      totalCount: checkInDTOs.length
    };
  }
}