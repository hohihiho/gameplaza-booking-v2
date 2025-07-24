import { CreateReservationUseCase } from '../create-reservation.use-case'
import { ReservationService } from '../../../domain/services/reservation.service'
import { IUserRepository } from '../../../domain/repositories/user.repository.interface'
import { ReservationMapper } from '../../mappers/reservation.mapper'
import { User } from '../../../domain/entities/user'
import { Reservation } from '../../../domain/entities/reservation'
import { KSTDateTime } from '../../../domain/value-objects/kst-datetime'
import { TimeSlot } from '../../../domain/value-objects/time-slot'

describe('CreateReservationUseCase', () => {
  let useCase: CreateReservationUseCase
  let mockReservationService: jest.Mocked<ReservationService>
  let mockUserRepository: jest.Mocked<IUserRepository>
  let mapper: ReservationMapper

  const mockUser = User.create({
    id: 'user-1',
    email: 'test@example.com',
    fullName: 'Test User'
  })

  const mockReservation = Reservation.create({
    id: 'res-1',
    userId: 'user-1',
    deviceId: 'device-1',
    date: KSTDateTime.fromString('2025-07-25'),
    timeSlot: TimeSlot.create(14, 16)
  })

  beforeEach(() => {
    mockReservationService = {
      createReservation: jest.fn(),
      approveReservation: jest.fn(),
      rejectReservation: jest.fn(),
      cancelReservation: jest.fn(),
      checkIn: jest.fn(),
      completeReservation: jest.fn(),
      markAsNoShow: jest.fn()
    } as any

    mockUserRepository = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      save: jest.fn(),
      update: jest.fn()
    }

    mapper = new ReservationMapper()
    useCase = new CreateReservationUseCase(
      mockReservationService,
      mockUserRepository,
      mapper
    )
  })

  describe('execute', () => {
    const dto = {
      deviceId: 'device-1',
      date: '2025-07-25',
      timeSlot: '14:00-16:00'
    }

    it('should create reservation successfully', async () => {
      mockUserRepository.findById.mockResolvedValue(mockUser)
      mockReservationService.createReservation.mockResolvedValue(mockReservation)

      const result = await useCase.execute('user-1', dto)

      expect(mockUserRepository.findById).toHaveBeenCalledWith('user-1')
      expect(mockReservationService.createReservation).toHaveBeenCalledWith(
        {
          userId: 'user-1',
          deviceId: 'device-1',
          date: '2025-07-25',
          timeSlot: '14:00-16:00'
        },
        mockUser
      )

      expect(result).toEqual({
        id: 'res-1',
        userId: 'user-1',
        deviceId: 'device-1',
        date: '2025-07-25',
        timeSlot: '14:00-16:00',
        status: 'pending',
        statusDisplayName: '승인 대기',
        reservationNumber: expect.stringMatching(/^GP-20250725-\d{4}$/),
        startDateTime: expect.any(String),
        endDateTime: expect.any(String),
        createdAt: expect.any(String),
        updatedAt: expect.any(String)
      })
    })

    it('should throw error if user not found', async () => {
      mockUserRepository.findById.mockResolvedValue(null)

      await expect(useCase.execute('user-1', dto))
        .rejects.toThrow('User not found')

      expect(mockReservationService.createReservation).not.toHaveBeenCalled()
    })

    it('should propagate domain service errors', async () => {
      mockUserRepository.findById.mockResolvedValue(mockUser)
      mockReservationService.createReservation.mockRejectedValue(
        new Error('Device not available')
      )

      await expect(useCase.execute('user-1', dto))
        .rejects.toThrow('Device not available')
    })
  })
})