import { Reservation } from '../../domain/entities/reservation'
import { ReservationResponseDto } from '../dtos/reservation.dto'

export class ReservationMapper {
  toDto(reservation: Reservation): ReservationResponseDto {
    return {
      id: reservation.id,
      userId: reservation.userId,
      deviceId: reservation.deviceId,
      date: reservation.date.dateString,
      timeSlot: reservation.timeSlot.displayString,
      status: reservation.status.value,
      statusDisplayName: reservation.status.displayName,
      reservationNumber: reservation.reservationNumber,
      startDateTime: reservation.startDateTime.date.toISOString(),
      endDateTime: reservation.endDateTime.date.toISOString(),
      createdAt: reservation.createdAt.toISOString(),
      updatedAt: reservation.updatedAt.toISOString()
    }
  }

  toDtoList(reservations: Reservation[]): ReservationResponseDto[] {
    return reservations.map(r => this.toDto(r))
  }
}