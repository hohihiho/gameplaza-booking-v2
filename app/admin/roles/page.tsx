'use client'

import { useState, useEffect } from 'react'
import { ROLES, ROLE_HIERARCHY, MEMBER_BENEFITS } from '@/lib/auth/permissions'
import { toast } from 'react-hot-toast'

interface User {
  id: string
  email: string
  name: string
  role: string
  createdAt: string
}

export default function RoleManagementPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRole, setSelectedRole] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchUsers()
  }, [selectedRole])

  const fetchUsers = async () => {
    try {
      const params = new URLSearchParams()
      if (selectedRole) params.append('role', selectedRole)
      
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

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole })
      })

      if (response.ok) {
        toast.success('권한이 변경되었습니다')
        fetchUsers()
      } else {
        toast.error('권한 변경에 실패했습니다')
      }
    } catch (error) {
      console.error('권한 변경 실패:', error)
      toast.error('권한 변경에 실패했습니다')
    }
  }

  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.name?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case ROLES.SUPER_ADMIN:
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
      case ROLES.ADMIN:
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      case ROLES.VIP_MEMBER:
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200'
      case ROLES.GOLD_MEMBER:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case ROLES.SILVER_MEMBER:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
      default:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
    }
  }

  const getRoleDisplayName = (role: string) => {
    const roleNames: Record<string, string> = {
      [ROLES.SUPER_ADMIN]: '슈퍼 관리자',
      [ROLES.ADMIN]: '관리자',
      [ROLES.VIP_MEMBER]: 'VIP 회원',
      [ROLES.GOLD_MEMBER]: '골드 회원',
      [ROLES.SILVER_MEMBER]: '실버 회원',
      [ROLES.MEMBER]: '일반 회원',
    }
    return roleNames[role] || role
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">회원 등급 관리</h1>
        <p className="text-gray-600 dark:text-gray-400">
          회원의 등급을 관리하고 권한을 설정합니다
        </p>
      </div>

      {/* 회원 등급별 혜택 표시 */}
      <div className="mb-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(MEMBER_BENEFITS).map(([role, benefits]) => (
          <div key={role} className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
            <h3 className="font-semibold mb-2">{getRoleDisplayName(role)}</h3>
            <ul className="text-sm space-y-1 text-gray-600 dark:text-gray-400">
              <li>동시 예약: {benefits.reservationLimit}개</li>
              <li>예약 가능 기간: {benefits.reservationDays}일</li>
              <li>할인율: {benefits.discountRate}%</li>
              {benefits.priorityBooking && (
                <li className="text-amber-600 dark:text-amber-400 font-semibold">
                  우선 예약 가능
                </li>
              )}
            </ul>
          </div>
        ))}
      </div>

      {/* 필터와 검색 */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <select
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value)}
          className="px-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
        >
          <option value="">모든 등급</option>
          {Object.values(ROLES).map(role => (
            <option key={role} value={role}>
              {getRoleDisplayName(role)}
            </option>
          ))}
        </select>

        <input
          type="text"
          placeholder="이름 또는 이메일로 검색..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 px-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
        />
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
                  현재 등급
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  가입일
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  등급 변경
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
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleBadgeColor(user.role)}`}>
                      {getRoleDisplayName(user.role)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={user.role}
                      onChange={(e) => updateUserRole(user.id, e.target.value)}
                      className="text-sm border rounded px-2 py-1 dark:bg-gray-700 dark:border-gray-600"
                    >
                      {Object.values(ROLES).map(role => (
                        <option key={role} value={role}>
                          {getRoleDisplayName(role)}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}