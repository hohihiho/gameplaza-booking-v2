import { authHandlers } from './auth.handlers'
import { reservationHandlers } from './reservation.handlers'
import { deviceHandlers } from './device.handlers'
import { userHandlers } from './user.handlers'
import { adminHandlers } from './admin.handlers'

export const handlers = [
  ...authHandlers,
  ...reservationHandlers,
  ...deviceHandlers,
  ...userHandlers,
  ...adminHandlers,
]