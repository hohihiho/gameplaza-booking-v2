// Mock 데이터 제공
export const mockDevices = [
  { id: '1', name: 'PS5 #1', type: 'PS5', status: 'available', position: 1 },
  { id: '2', name: 'PS5 #2', type: 'PS5', status: 'in_use', position: 2 },
  { id: '3', name: 'Switch #1', type: 'SWITCH', status: 'available', position: 3 },
  { id: '4', name: 'PC #1', type: 'PC', status: 'maintenance', position: 4 },
  { id: '5', name: 'Racing Sim', type: 'RACING', status: 'available', position: 5 },
];

export const mockRentals = [
  {
    id: '1',
    device_id: '2',
    user_id: 'user1',
    start_time: new Date().toISOString(),
    end_time: new Date(Date.now() + 3600000).toISOString(),
    status: 'active'
  }
];

export const getMockDevices = async () => {
  return { data: mockDevices, error: null };
};

export const getMockRentals = async () => {
  return { data: mockRentals, error: null };
};
