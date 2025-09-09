import { NextRequest } from 'next/server'
import { DeviceStatusManager } from '@/lib/services/device-status-manager'

// 모든 기기 상태 조회
export async function GET(request: NextRequest) {
  try {
    // 실제로는 DB에서 기기 목록을 가져와서 상태와 결합
    // 여기서는 예시로 하드코딩된 기기 목록 사용
    const deviceList = [
      { id: 'ps5-1', name: 'PS5 #1', type: 'PlayStation 5' },
      { id: 'ps5-2', name: 'PS5 #2', type: 'PlayStation 5' },
      { id: 'switch-1', name: 'Switch #1', type: 'Nintendo Switch' },
      { id: 'switch-2', name: 'Switch #2', type: 'Nintendo Switch' },
      { id: 'switch-3', name: 'Switch #3', type: 'Nintendo Switch' },
      { id: 'racing-1', name: '레이싱 시뮬레이터 #1', type: '레이싱 시뮬레이터' },
      { id: 'vr-1', name: 'VR #1', type: 'VR 장비' },
    ]
    
    // 각 기기의 현재 상태 가져오기
    const devices = deviceList.map(device => {
      const status = DeviceStatusManager.getStatus(device.id) || {
        deviceId: device.id,
        status: 'available' as const
      }
      
      return {
        ...device,
        status: status.status,
        currentUser: status.userId,
        startTime: status.startTime?.toISOString(),
        endTime: status.endTime?.toISOString(),
        remainingTime: status.endTime 
          ? Math.max(0, Math.floor((status.endTime.getTime() - Date.now()) / 60000))
          : undefined
      }
    })
    
    return Response.json({ devices })
  } catch (error) {
    console.error('기기 상태 조회 오류:', error)
    return Response.json({ error: '기기 상태 조회 실패' }, { status: 500 })
  }
}