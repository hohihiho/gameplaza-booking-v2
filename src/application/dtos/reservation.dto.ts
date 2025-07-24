export interface CreateReservationDto {
  deviceId: string
  date: string
  timeSlot: string
}

export interface ReservationResponseDto {
  id: string
  userId: string
  deviceId: string
  date: string
  timeSlot: string
  status: string
  statusDisplayName: string
  reservationNumber: string
  startDateTime: string
  endDateTime: string
  createdAt: string
  updatedAt: string
}

export interface ReservationListDto {
  reservations: ReservationResponseDto[]
  total: number
  page: number
  pageSize: number
}

export interface ReservationFilterDto {
  userId?: string
  deviceId?: string
  date?: string
  status?: string
  page?: number
  pageSize?: number
}