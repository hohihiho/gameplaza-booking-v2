export interface DeviceCategoryDto {
  id: string
  name: string
  description: string | null
  displayOrder: number
  deviceTypes?: DeviceTypeDto[]
}

export interface DeviceTypeDto {
  id: string
  categoryId: string
  name: string
  description: string | null
  specifications: Record<string, any>
  hourlyRate: number
  maxReservationHours: number
  availableCount?: number
  totalCount?: number
}

export interface DeviceDto {
  id: string
  deviceTypeId: string
  deviceNumber: string
  status: 'available' | 'reserved' | 'maintenance' | 'offline'
  notes: string | null
  type?: DeviceTypeDto
}

export interface DeviceAvailabilityDto {
  deviceId: string
  date: string
  availableTimeSlots: string[]
  reservedTimeSlots: string[]
}