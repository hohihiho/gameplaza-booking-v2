'use client'

import { useState, useEffect } from 'react'
import { USER_STATUS, UserStatus } from '@/lib/auth/permissions'
import { toast } from 'react-hot-toast'
import { Shield, UserX, Clock, AlertCircle, Search, Filter } from 'lucide-react'

interface User {
  id: string
  email: string
  name: string
  role: string
  status: UserStatus
  blockReason?: string
  blockedAt?: string
  blockedBy?: string
  blockExpiresAt?: string
  createdAt: string
}

export default function BlacklistManagementPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [blockModal, setBlockModal] = useState<{
    isOpen: boolean
    user: User | null
    action: 'block' | 'unblock' | 'suspend'
  }>({ isOpen: false, user: null, action: 'block' })

  useEffect(() => {
    fetchUsers()
  }, [filterStatus])

  const fetchUsers = async () => {
    try {
      const params = new URLSearchParams()
      if (filterStatus !== 'all') params.append('status', filterStatus)
      
      const response = await fetch(`/api/admin/users?${params}`)
      const data = await response.json()
      setUsers(data.users || [])
    } catch (error) {
      console.error('사용자 목록 조회 실패:', error)
      toast.error('사용자 목록을 불러올 수 없습니다')
    } finally {
      setLoading(false)
    }
  }

  const handleBlockUser = async (userId: string, action: 'block' | 'unblock' | 'suspend', reason?: string, expiresAt?: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/block`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action, 
          reason,
          expiresAt
        })
      })

      if (response.ok) {
        const actionText = action === 'block' ? '차단' : action === 'unblock' ? '차단 해제' : '일시 정지'
        toast.success(`사용자가 ${actionText}되었습니다`)
        fetchUsers()
        setBlockModal({ isOpen: false, user: null, action: 'block' })
      } else {
        toast.error('작업 실패')
      }
    } catch (error) {
      console.error('사용자 차단 상태 변경 실패:', error)
      toast.error('작업 실패')
    }
  }

  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.name?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getStatusBadge = (status: UserStatus) => {
    switch (status) {
      case USER_STATUS.BLOCKED:
        return (
          <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
            <UserX className="w-3 h-3 mr-1" />
            예약 제한
          </span>
        )
      case USER_STATUS.SUSPENDED:
        return (
          <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
            <Clock className="w-3 h-3 mr-1" />
            일시 정지
          </span>
        )
      default:
        return (
          <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
            정상
          </span>
        )
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <Shield className="w-8 h-8 text-amber-600" />
          예약 제한 관리
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          사용자의 예약 권한을 제한하거나 일시 정지시킬 수 있습니다
        </p>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">전체 사용자</p>
              <p className="text-2xl font-bold">{users.length}</p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
              <Shield className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">예약 제한</p>
              <p className="text-2xl font-bold text-red-600">
                {users.filter(u => u.status === USER_STATUS.BLOCKED).length}
              </p>
            </div>
            <div className="p-3 bg-red-100 dark:bg-red-900 rounded-full">
              <UserX className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">일시 정지</p>
              <p className="text-2xl font-bold text-amber-600">
                {users.filter(u => u.status === USER_STATUS.SUSPENDED).length}
              </p>
            </div>
            <div className="p-3 bg-amber-100 dark:bg-amber-900 rounded-full">
              <Clock className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">정상 사용자</p>
              <p className="text-2xl font-bold text-green-600">
                {users.filter(u => u.status === USER_STATUS.ACTIVE).length}
              </p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
              <Shield className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>
      </div>

      {/* 필터와 검색 */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-500" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
          >
            <option value="all">모든 상태</option>
            <option value={USER_STATUS.ACTIVE}>정상</option>
            <option value={USER_STATUS.BLOCKED}>차단됨</option>
            <option value={USER_STATUS.SUSPENDED}>일시 정지</option>
          </select>
        </div>

        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="이름 또는 이메일로 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
          />
        </div>
      </div>

      {/* 사용자 목록 */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  사용자
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  상태
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  제한 사유
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  제한 일시
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  만료 예정
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  작업
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {user.name || '이름 없음'}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {user.email}
                      </div>
                      <div className="text-xs text-gray-400">
                        {user.role}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(user.status)}
                  </td>
                  <td className="px-6 py-4">
                    {user.blockReason ? (
                      <div className="flex items-start gap-1">
                        <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {user.blockReason}
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {user.blockedAt ? new Date(user.blockedAt).toLocaleDateString() : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {user.blockExpiresAt ? (
                      <span className="text-amber-600">
                        {new Date(user.blockExpiresAt).toLocaleDateString()}
                      </span>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex gap-2">
                      {user.status === USER_STATUS.ACTIVE ? (
                        <>
                          <button
                            onClick={() => setBlockModal({ isOpen: true, user, action: 'block' })}
                            className="text-red-600 hover:text-red-900 dark:hover:text-red-400 text-sm font-medium"
                          >
                            차단
                          </button>
                          <button
                            onClick={() => setBlockModal({ isOpen: true, user, action: 'suspend' })}
                            className="text-amber-600 hover:text-amber-900 dark:hover:text-amber-400 text-sm font-medium"
                          >
                            일시 정지
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => handleBlockUser(user.id, 'unblock')}
                          className="text-green-600 hover:text-green-900 dark:hover:text-green-400 text-sm font-medium"
                        >
                          차단 해제
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 차단 모달 */}
      {blockModal.isOpen && blockModal.user && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold mb-4">
              {blockModal.action === 'block' ? '예약 제한 설정' : '일시 정지 설정'}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {blockModal.user.name || blockModal.user.email}님의 예약을 
              {blockModal.action === 'block' ? '제한' : '일시 정지'}하시겠습니까?
            </p>
            
            <form onSubmit={(e) => {
              e.preventDefault()
              const formData = new FormData(e.currentTarget)
              handleBlockUser(
                blockModal.user!.id,
                blockModal.action,
                formData.get('reason') as string,
                formData.get('expiresAt') as string
              )
            }}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  사유
                </label>
                <textarea
                  name="reason"
                  required
                  rows={3}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  placeholder="차단 또는 정지 사유를 입력하세요..."
                />
              </div>

              {blockModal.action === 'suspend' && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    정지 해제 일시
                  </label>
                  <input
                    type="datetime-local"
                    name="expiresAt"
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  />
                </div>
              )}

              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setBlockModal({ isOpen: false, user: null, action: 'block' })}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 rounded-lg text-white font-medium ${
                    blockModal.action === 'block'
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-amber-600 hover:bg-amber-700'
                  }`}
                >
                  {blockModal.action === 'block' ? '차단' : '일시 정지'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}