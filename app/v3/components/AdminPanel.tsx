'use client'

import { useState, useEffect } from 'react'
import { Shield, Users, Calendar, Cpu, AlertCircle, Ban, UserCheck } from 'lucide-react'

interface AdminStats {
  todayReservations: number
  weekReservations: number
  totalUsers: number
  activeDevices: number
}

interface AdminInfo {
  id: string
  email: string
  role: string
  isSuperAdmin: boolean
}

export default function AdminPanel() {
  const [isAdmin, setIsAdmin] = useState(false)
  const [adminInfo, setAdminInfo] = useState<AdminInfo | null>(null)
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    checkAdminStatus()
  }, [])

  const checkAdminStatus = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/v3/admin')
      const data = await response.json()
      
      if (data.success) {
        setIsAdmin(true)
        setAdminInfo(data.admin)
        setStats(data.stats)
      } else {
        setError(data.error || '관리자 권한이 없습니다')
        setIsAdmin(false)
      }
    } catch (err) {
      setError('관리자 정보를 불러올 수 없습니다')
      setIsAdmin(false)
    } finally {
      setLoading(false)
    }
  }

  // 유저 정지 처리
  const handleBanUser = async (userId: string) => {
    if (!confirm('정말로 이 사용자를 정지하시겠습니까?')) return

    try {
      const response = await fetch('/api/v3/admin/ban-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, action: 'ban' })
      })

      const data = await response.json()
      if (data.success) {
        alert('사용자가 정지되었습니다')
        // 목록 새로고침 등 추가 작업
      } else {
        alert(data.error || '정지 처리 실패')
      }
    } catch (err) {
      alert('오류가 발생했습니다')
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-20 bg-gray-100 rounded"></div>
            <div className="h-20 bg-gray-100 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !isAdmin) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-3 text-red-600">
          <AlertCircle className="w-6 h-6" />
          <div>
            <h3 className="font-semibold">접근 거부</h3>
            <p className="text-sm">{error || '관리자 권한이 필요합니다'}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 관리자 정보 헤더 */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-indigo-600" />
            <div>
              <h2 className="text-xl font-bold">관리자 대시보드</h2>
              <p className="text-sm text-gray-600">
                {adminInfo?.email} ({adminInfo?.isSuperAdmin ? '최고 관리자' : '관리자'})
              </p>
            </div>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
            adminInfo?.isSuperAdmin 
              ? 'bg-purple-100 text-purple-800' 
              : 'bg-blue-100 text-blue-800'
          }`}>
            {adminInfo?.role?.toUpperCase()}
          </span>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-5 h-5 text-gray-600" />
              <span className="text-sm text-gray-600">오늘 예약</span>
            </div>
            <p className="text-2xl font-bold">{stats?.todayReservations || 0}건</p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-5 h-5 text-gray-600" />
              <span className="text-sm text-gray-600">이번 주 예약</span>
            </div>
            <p className="text-2xl font-bold">{stats?.weekReservations || 0}건</p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-5 h-5 text-gray-600" />
              <span className="text-sm text-gray-600">전체 사용자</span>
            </div>
            <p className="text-2xl font-bold">{stats?.totalUsers || 0}명</p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Cpu className="w-5 h-5 text-gray-600" />
              <span className="text-sm text-gray-600">활성 기기</span>
            </div>
            <p className="text-2xl font-bold">{stats?.activeDevices || 0}대</p>
          </div>
        </div>
      </div>

      {/* 관리 기능 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">관리 기능</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button 
            className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition"
            onClick={() => window.location.href = '/v3/admin/users'}
          >
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-gray-600" />
              <div className="text-left">
                <p className="font-medium">사용자 관리</p>
                <p className="text-sm text-gray-600">사용자 목록 및 권한 관리</p>
              </div>
            </div>
            <span className="text-gray-400">→</span>
          </button>

          <button 
            className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition"
            onClick={() => window.location.href = '/v3/admin/devices'}
          >
            <div className="flex items-center gap-3">
              <Cpu className="w-5 h-5 text-gray-600" />
              <div className="text-left">
                <p className="font-medium">기기 관리</p>
                <p className="text-sm text-gray-600">기기 상태 및 설정 관리</p>
              </div>
            </div>
            <span className="text-gray-400">→</span>
          </button>

          <button 
            className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition"
            onClick={() => window.location.href = '/v3/admin/reservations'}
          >
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-gray-600" />
              <div className="text-left">
                <p className="font-medium">예약 관리</p>
                <p className="text-sm text-gray-600">전체 예약 현황 및 관리</p>
              </div>
            </div>
            <span className="text-gray-400">→</span>
          </button>

          <button 
            className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition"
            onClick={() => window.location.href = '/v3/admin/banned'}
          >
            <div className="flex items-center gap-3">
              <Ban className="w-5 h-5 text-gray-600" />
              <div className="text-left">
                <p className="font-medium">정지 사용자</p>
                <p className="text-sm text-gray-600">정지된 사용자 목록 관리</p>
              </div>
            </div>
            <span className="text-gray-400">→</span>
          </button>
        </div>
      </div>

      {/* 최고 관리자 전용 기능 */}
      {adminInfo?.isSuperAdmin && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-purple-900 mb-4">
            최고 관리자 전용
          </h3>
          
          <div className="space-y-3">
            <button 
              className="w-full flex items-center justify-between p-4 bg-white rounded-lg hover:bg-purple-100 transition"
              onClick={() => window.location.href = '/v3/admin/admins'}
            >
              <div className="flex items-center gap-3">
                <UserCheck className="w-5 h-5 text-purple-600" />
                <div className="text-left">
                  <p className="font-medium">관리자 권한 부여</p>
                  <p className="text-sm text-gray-600">일반 사용자를 관리자로 승격</p>
                </div>
              </div>
              <span className="text-purple-600">→</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}