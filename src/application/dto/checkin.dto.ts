import { CheckIn } from '@/src/domain/entities/checkin';
import { PaymentStatusType } from '@/src/domain/value-objects/payment-status';
import { PaymentMethodType } from '@/src/domain/value-objects/payment-method';
import { CheckInStatusType } from '@/src/domain/value-objects/checkin-status';

/**
 * 체크인 기본 DTO
 */
export interface CheckInDTO {
  id: string;
  reservationId: string;
  deviceId: string;
  checkInTime: string;
  checkOutTime?: string;
  paymentStatus: PaymentStatusType;
  paymentMethod?: PaymentMethodType;
  paymentAmount: number;
  adjustedAmount?: number;
  adjustmentReason?: string;
  actualStartTime?: string;
  actualEndTime?: string;
  actualDuration?: number;
  finalAmount: number;
  status: CheckInStatusType;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * 체크인 상세 DTO (연관 정보 포함)
 */
export interface CheckInDetailDTO extends CheckInDTO {
  reservation?: {
    id: string;
    userId: string;
    userName: string;
    userPhone?: string;
    reservationNumber: string;
    date: string;
    startTime: string;
    endTime: string;
  };
  device?: {
    id: string;
    deviceNumber: string;
    deviceType: string;
    location?: string;
  };
}

/**
 * 활성 체크인 목록 DTO
 */
export interface ActiveCheckInListDTO {
  checkIns: CheckInSummaryDTO[];
  totalCount: number;
}

/**
 * 체크인 요약 DTO (목록용)
 */
export interface CheckInSummaryDTO {
  id: string;
  reservationNumber: string;
  userName: string;
  deviceNumber: string;
  checkInTime: string;
  status: CheckInStatusType;
  paymentStatus: PaymentStatusType;
  finalAmount: number;
  remainingMinutes?: number;
}

/**
 * 체크인 통계 DTO
 */
export interface CheckInStatisticsDTO {
  totalCheckIns: number;
  activeCheckIns: number;
  completedCheckIns: number;
  totalRevenue: number;
  averageUsageTime: number;
}

/**
 * 도메인 엔티티를 DTO로 변환
 */
export class CheckInMapper {
  static toDTO(checkIn: CheckIn): CheckInDTO {
    const json = checkIn.toJSON();
    
    return {
      id: json.id,
      reservationId: json.reservationId,
      deviceId: json.deviceId,
      checkInTime: json.checkInTime.toISOString(),
      checkOutTime: json.checkOutTime?.toISOString(),
      paymentStatus: json.paymentStatus,
      paymentMethod: json.paymentMethod,
      paymentAmount: json.paymentAmount,
      adjustedAmount: json.adjustedAmount,
      adjustmentReason: json.adjustmentReason,
      actualStartTime: json.actualStartTime?.toISOString(),
      actualEndTime: json.actualEndTime?.toISOString(),
      actualDuration: checkIn.actualDuration,
      finalAmount: checkIn.finalAmount,
      status: json.status,
      notes: json.notes,
      createdAt: json.createdAt.toISOString(),
      updatedAt: json.updatedAt.toISOString()
    };
  }

  static toDetailDTO(
    checkIn: CheckIn,
    reservation?: any,
    device?: any,
    user?: any
  ): CheckInDetailDTO {
    const baseDTO = this.toDTO(checkIn);
    
    return {
      ...baseDTO,
      reservation: reservation ? {
        id: reservation.id,
        userId: reservation.userId,
        userName: user?.fullName || 'Unknown',
        userPhone: user?.phone,
        reservationNumber: reservation.reservationNumber,
        date: reservation.date.dateString,
        startTime: reservation.timeSlot.displayStartTime,
        endTime: reservation.timeSlot.displayEndTime
      } : undefined,
      device: device ? {
        id: device.id,
        deviceNumber: device.deviceNumber,
        deviceType: device.deviceType?.name || 'Unknown',
        location: device.location
      } : undefined
    };
  }

  static toSummaryDTO(
    checkIn: CheckIn,
    reservation: any,
    device: any,
    user: any
  ): CheckInSummaryDTO {
    const now = new Date();
    const endTime = reservation?.endDateTime?.toDate();
    const remainingMinutes = endTime && checkIn.isActive()
      ? Math.max(0, Math.floor((endTime.getTime() - now.getTime()) / (1000 * 60)))
      : undefined;

    return {
      id: checkIn.id,
      reservationNumber: reservation?.reservationNumber || 'Unknown',
      userName: user?.fullName || 'Unknown',
      deviceNumber: device?.deviceNumber || 'Unknown',
      checkInTime: checkIn.checkInTime.toISOString(),
      status: checkIn.status.value,
      paymentStatus: checkIn.paymentStatus.value,
      finalAmount: checkIn.finalAmount,
      remainingMinutes
    };
  }
}