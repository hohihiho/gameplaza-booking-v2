export const mockUser = {
  id: 'mock-user-id',
  email: 'test@example.com',
  full_name: 'Test User',
  phone: null,
  role: 'user' as const,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

export const mockAdmin = {
  ...mockUser,
  id: 'mock-admin-id',
  email: 'admin@example.com',
  full_name: 'Admin User',
  role: 'admin' as const,
}

export const mockDevice = {
  id: 'device-1',
  device_type_id: 'type-1',
  device_number: 'PC-001',
  status: 'available' as const,
  created_at: new Date().toISOString(),
}

export const mockDeviceType = {
  id: 'type-1',
  category_id: 'cat-1',
  name: 'Gaming PC (RTX 4090)',
  description: 'High-end gaming PC with RTX 4090',
  specifications: {
    gpu: 'RTX 4090',
    cpu: 'Intel i9-13900K',
    ram: '32GB DDR5',
  },
  created_at: new Date().toISOString(),
}

export const mockDeviceCategory = {
  id: 'cat-1',
  name: 'PC',
  description: 'High-performance gaming computers',
  display_order: 1,
  created_at: new Date().toISOString(),
}

export const mockReservation = {
  id: 'reservation-1',
  user_id: 'mock-user-id',
  device_id: 'device-1',
  date: '2025-07-23',
  time_slot: '14:00-16:00',
  status: 'pending' as const,
  reservation_number: 'GP-20250723-0001',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

export const generateReservationNumber = (date: Date = new Date()) => {
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '')
  const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return `GP-${dateStr}-${randomNum}`
}