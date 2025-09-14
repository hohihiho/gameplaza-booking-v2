// 회원 관리 페이지 - Better Auth 통합 버전
// 비전공자 설명: 관리자가 모든 회원을 조회하고 권한을 관리하는 고급 페이지입니다
'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  Filter,
  MoreVertical,
  Users,
  ShieldCheck,
  AlertTriangle,
  Ban,
  UserX,
  UserCheck,
  Shield,
  ShieldAlert,
  Crown,
  Star,
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Download,
  RefreshCw,
  Edit,
  Trash2,
  UserPlus,
  Mail,
  Phone,
  MapPin,
  Activity,
  AlertCircle,
  Check,
  X,
  Hash,
  Gamepad2,
  MessageCircle,
  Eye
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { format, parseISO, addDays, subDays } from 'date-fns'
import { ko } from 'date-fns/locale'

// 사용자 역할 타입 - Better Auth 기반
type UserRole = 'user' | 'vip' | 'staff' | 'admin' | 'super_admin' | 'owner'

// 제재 타입
type RestrictionType = 'warning' | 'suspension' | 'ban'

// 사용자 상태
type UserStatus = 'active' | 'restricted' | 'suspended' | 'banned'

// 사용자 타입 - Better Auth 통합
type User = {
  id: string
  email: string
  name: string
  nickname?: string
  phone?: string
  role: UserRole
  status: UserStatus
  createdAt: string
  lastLogin?: string
  reservationCount: number
  noShowCount: number
  restrictionHistory: Restriction[]
  image?: string
  address?: string
  birthDate?: string
  isVerified: boolean
  adminNotes?: string
  recentReservation?: {
    date: string
    deviceName: string
    status: string
  }
}

// 제재 기록 타입
type Restriction = {
  id: string
  type: RestrictionType
  reason: string
  createdAt: string
  expiresAt?: string
  createdBy: string
  notes?: string
}

// 역할별 색상과 아이콘 설정
const roleConfig = {
  user: { label: '일반유저', color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300', icon: Users },
  vip: { label: 'VIP', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', icon: Star },
  staff: { label: '스태프', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', icon: Shield },
  admin: { label: '관리자', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400', icon: ShieldCheck },
  super_admin: { label: '슈퍼관리자', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', icon: ShieldAlert },
  owner: { label: '오너', color: 'bg-gradient-to-r from-yellow-400 to-orange-400 text-white', icon: Crown }
}

// 상태별 색상 설정
const statusConfig = {
  active: { label: '정상', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  restricted: { label: '제한', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
  suspended: { label: '정지', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
  banned: { label: '차단', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' }
}

export default function UsersManagementPage() {
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRole, setSelectedRole] = useState<UserRole | 'all'>('all')
  const [selectedStatus, setSelectedStatus] = useState<UserStatus | 'all'>('all')
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set())
  const [showBulkActions, setShowBulkActions] = useState(false)
  const [showUserModal, setShowUserModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showRestrictionModal, setShowRestrictionModal] = useState(false)
  const [sortBy, setSortBy] = useState<'name' | 'createdAt' | 'lastLogin' | 'reservationCount'>('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(20)

  // 통계 데이터
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    restricted: 0,
    suspended: 0,
    banned: 0,
    newThisMonth: 0
  })

  // 데이터 로드
  useEffect(() => {
    fetchUsers()
  }, [])

  // 사용자 목록 가져오기 - Better Auth 통합
  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/users')
      const data = await res.json()

      if (data.users) {
        // 데이터 변환 (기존 API 구조를 새 타입에 맞게 매핑)
        const transformedUsers: User[] = data.users.map((u: any) => ({
          id: u.id,
          email: u.email,
          name: u.name,
          nickname: u.nickname,
          phone: u.phone,
          role: mapRole(u.role, u.is_admin),
          status: mapStatus(u.is_blacklisted, u.is_banned),
          createdAt: u.created_at,
          lastLogin: u.last_login,
          reservationCount: u.total_reservations || 0,
          noShowCount: u.no_show_count || 0,
          restrictionHistory: [],
          isVerified: true,
          adminNotes: u.admin_notes,
          recentReservation: u.recent_reservation ? {
            date: u.recent_reservation.date,
            deviceName: u.recent_reservation.device_name,
            status: u.recent_reservation.status
          } : undefined
        }))

        setUsers(transformedUsers)

        // 통계 계산
        const stats = {
          total: transformedUsers.length,
          active: transformedUsers.filter((u: User) => u.status === 'active').length,
          restricted: transformedUsers.filter((u: User) => u.status === 'restricted').length,
          suspended: transformedUsers.filter((u: User) => u.status === 'suspended').length,
          banned: transformedUsers.filter((u: User) => u.status === 'banned').length,
          newThisMonth: transformedUsers.filter((u: User) => {
            const created = new Date(u.createdAt)
            const now = new Date()
            return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear()
          }).length
        }
        setStats(stats)
      }
    } catch (error) {
      console.error('Failed to fetch users:', error)
    } finally {
      setLoading(false)
    }
  }

  // 역할 매핑 헬퍼
  const mapRole = (role: string, isAdmin: boolean): UserRole => {
    if (role === 'super_admin') return 'super_admin'
    if (role === 'admin' || isAdmin) return 'admin'
    if (role === 'staff') return 'staff'
    if (role === 'vip') return 'vip'
    return 'user'
  }

  // 상태 매핑 헬퍼
  const mapStatus = (isBlacklisted: boolean, isBanned: boolean): UserStatus => {
    if (isBanned || isBlacklisted) return 'banned'
    return 'active'
  }

  // 필터링 및 정렬
  useEffect(() => {
    let filtered = [...users]

    // 검색
    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.nickname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.phone?.includes(searchTerm)
      )
    }

    // 역할 필터
    if (selectedRole !== 'all') {
      filtered = filtered.filter(user => user.role === selectedRole)
    }

    // 상태 필터
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(user => user.status === selectedStatus)
    }

    // 정렬
    filtered.sort((a, b) => {
      let aVal: any, bVal: any

      switch(sortBy) {
        case 'name':
          aVal = a.name
          bVal = b.name
          break
        case 'createdAt':
          aVal = new Date(a.createdAt).getTime()
          bVal = new Date(b.createdAt).getTime()
          break
        case 'lastLogin':
          aVal = a.lastLogin ? new Date(a.lastLogin).getTime() : 0
          bVal = b.lastLogin ? new Date(b.lastLogin).getTime() : 0
          break
        case 'reservationCount':
          aVal = a.reservationCount
          bVal = b.reservationCount
          break
      }

      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1
      } else {
        return aVal < bVal ? 1 : -1
      }
    })

    setFilteredUsers(filtered)
    setCurrentPage(1)
  }, [users, searchTerm, selectedRole, selectedStatus, sortBy, sortOrder])

  // 역할 변경
  const updateUserRole = async (userId: string, newRole: UserRole) => {
    try {
      const res = await fetch(`/api/v3/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole })
      })

      if (res.ok) {
        await fetchUsers()
      }
    } catch (error) {
      console.error('Failed to update role:', error)
    }
  }

  // 제재 처리
  const applyRestriction = async (userId: string, restriction: {
    type: RestrictionType
    reason: string
    duration?: number // 일 단위
    notes?: string
  }) => {
    try {
      const res = await fetch(`/api/v3/admin/ban-user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          action: restriction.type === 'ban' ? 'ban' : 'warn',
          reason: restriction.reason,
          duration: restriction.duration,
          notes: restriction.notes
        })
      })

      if (res.ok) {
        await fetchUsers()
        setShowRestrictionModal(false)
      }
    } catch (error) {
      console.error('Failed to apply restriction:', error)
    }
  }

  // 제재 해제
  const removeRestriction = async (userId: string) => {
    try {
      const res = await fetch(`/api/v3/admin/ban-user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          action: 'unban'
        })
      })

      if (res.ok) {
        await fetchUsers()
      }
    } catch (error) {
      console.error('Failed to remove restriction:', error)
    }
  }

  // 일괄 역할 변경
  const bulkUpdateRoles = async (newRole: UserRole) => {
    const promises = Array.from(selectedUsers).map(userId =>
      updateUserRole(userId, newRole)
    )
    await Promise.all(promises)
    setSelectedUsers(new Set())
    setShowBulkActions(false)
  }

  // CSV 내보내기
  const exportToCSV = () => {
    const headers = ['이름', '닉네임', '이메일', '전화번호', '역할', '상태', '가입일', '마지막 로그인', '예약 수', '노쇼 수']
    const rows = filteredUsers.map(user => [
      user.name,
      user.nickname || '',
      user.email,
      user.phone || '',
      roleConfig[user.role].label,
      statusConfig[user.status].label,
      format(parseISO(user.createdAt), 'yyyy-MM-dd'),
      user.lastLogin ? format(parseISO(user.lastLogin), 'yyyy-MM-dd HH:mm') : '',
      user.reservationCount,
      user.noShowCount
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `users_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`
    link.click()
  }

  // 페이지네이션
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage)
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* 헤더 */}
      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/admin')}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-6 h-6 text-gray-700 dark:text-gray-300" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">사용자 관리</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                전체 {stats.total}명 • 이번 달 신규 {stats.newThisMonth}명
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => fetchUsers()}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              새로고침
            </button>
            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              CSV 내보내기
            </button>
          </div>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-xl border border-gray-200/50 dark:border-gray-700/50 p-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">전체</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.total}</p>
            </div>
            <Users className="w-8 h-8 text-gray-400" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-xl border border-gray-200/50 dark:border-gray-700/50 p-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">정상</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">{stats.active}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-xl border border-gray-200/50 dark:border-gray-700/50 p-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">제한</p>
              <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mt-1">{stats.restricted}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-yellow-400" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-xl border border-gray-200/50 dark:border-gray-700/50 p-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">정지</p>
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400 mt-1">{stats.suspended}</p>
            </div>
            <UserX className="w-8 h-8 text-orange-400" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-xl border border-gray-200/50 dark:border-gray-700/50 p-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">차단</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">{stats.banned}</p>
            </div>
            <Ban className="w-8 h-8 text-red-400" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-xl border border-gray-200/50 dark:border-gray-700/50 p-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">이번달 신규</p>
              <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">{stats.newThisMonth}</p>
            </div>
            <UserPlus className="w-8 h-8 text-indigo-400" />
          </div>
        </motion.div>
      </div>

      {/* 필터 및 검색 */}
      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* 검색 */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="이름, 닉네임, 이메일, 전화번호로 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* 역할 필터 */}
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value as UserRole | 'all')}
            className="px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">모든 역할</option>
            {Object.entries(roleConfig).map(([key, config]) => (
              <option key={key} value={key}>{config.label}</option>
            ))}
          </select>

          {/* 상태 필터 */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as UserStatus | 'all')}
            className="px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">모든 상태</option>
            {Object.entries(statusConfig).map(([key, config]) => (
              <option key={key} value={key}>{config.label}</option>
            ))}
          </select>

          {/* 정렬 */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="createdAt">가입일순</option>
            <option value="lastLogin">최근 로그인순</option>
            <option value="name">이름순</option>
            <option value="reservationCount">예약 많은순</option>
          </select>

          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            {sortOrder === 'asc' ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>

        {/* 일괄 작업 */}
        {selectedUsers.size > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-4 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-200 dark:border-indigo-800"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm text-indigo-700 dark:text-indigo-300">
                {selectedUsers.size}명 선택됨
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowBulkActions(true)}
                  className="px-3 py-1 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  일괄 역할 변경
                </button>
                <button
                  onClick={() => setSelectedUsers(new Set())}
                  className="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  선택 해제
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* 사용자 목록 그리드 */}
      <div className="grid gap-4">
        <AnimatePresence>
          {paginatedUsers.map((user, index) => (
            <motion.div
              key={user.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ delay: index * 0.02 }}
              className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-4 sm:p-6 hover:shadow-lg transition-all duration-200"
            >
              <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                {/* 체크박스 */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedUsers.has(user.id)}
                    onChange={(e) => {
                      const newSelected = new Set(selectedUsers)
                      if (e.target.checked) {
                        newSelected.add(user.id)
                      } else {
                        newSelected.delete(user.id)
                      }
                      setSelectedUsers(newSelected)
                    }}
                    className="rounded border-gray-300 dark:border-gray-600"
                  />
                </div>

                {/* 사용자 정보 */}
                <div className="flex-1">
                  <div className="flex items-start gap-4">
                    {/* 프로필 아이콘 */}
                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                      {user.nickname?.[0] || user.name?.[0] || 'U'}
                    </div>

                    {/* 정보 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="font-bold text-gray-900 dark:text-white truncate">
                          {user.nickname || user.name}
                        </h3>
                        {user.nickname && user.name && (
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            ({user.name})
                          </span>
                        )}
                        <span className={`px-3 py-1 rounded-lg text-sm font-medium ${roleConfig[user.role].color}`}>
                          {roleConfig[user.role].label}
                        </span>
                        <span className={`px-3 py-1 rounded-lg text-sm font-medium ${statusConfig[user.status].color}`}>
                          {statusConfig[user.status].label}
                        </span>
                        {user.noShowCount > 0 && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300 text-xs font-medium rounded-full">
                            <UserX className="w-3 h-3" />
                            노쇼 {user.noShowCount}회
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                          <Mail className="w-4 h-4" />
                          <span className="truncate">{user.email}</span>
                        </div>
                        {user.phone && (
                          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                            <Phone className="w-4 h-4" />
                            <span>{user.phone}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                          <Calendar className="w-4 h-4" />
                          <span>가입: {format(parseISO(user.createdAt), 'yyyy.MM.dd')}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                          <Hash className="w-4 h-4" />
                          <span>예약: {user.reservationCount}건</span>
                        </div>
                        {user.adminNotes && (
                          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                            <MessageCircle className="w-4 h-4" />
                            <span>메모 있음</span>
                          </div>
                        )}
                      </div>

                      {/* 최근 예약 */}
                      {user.recentReservation && (
                        <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">최근 예약</p>
                          <div className="flex items-center gap-2 text-sm">
                            <Gamepad2 className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-700 dark:text-gray-300">
                              {user.recentReservation.deviceName}
                            </span>
                            <span className="text-gray-400">•</span>
                            <span className="text-gray-600 dark:text-gray-400">
                              {format(parseISO(user.recentReservation.date), 'yyyy.MM.dd')}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 액션 버튼 */}
                <div className="flex gap-2">
                  <button
                    onClick={() => router.push(`/admin/users/${user.id}`)}
                    className="flex items-center justify-center p-2.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
                    title="상세보기"
                  >
                    <Eye className="w-5 h-5" />
                  </button>
                  <select
                    value={user.role}
                    onChange={(e) => updateUserRole(user.id, e.target.value as UserRole)}
                    className="px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {Object.entries(roleConfig).map(([key, config]) => (
                      <option key={key} value={key}>{config.label}</option>
                    ))}
                  </select>
                  {user.status === 'active' ? (
                    <button
                      onClick={() => {
                        setSelectedUser(user)
                        setShowRestrictionModal(true)
                      }}
                      className="p-2.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                      title="제재하기"
                    >
                      <Ban className="w-5 h-5" />
                    </button>
                  ) : (
                    <button
                      onClick={() => removeRestriction(user.id)}
                      className="p-2.5 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-xl hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
                      title="제재 해제"
                    >
                      <UserCheck className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum = currentPage - 2 + i
              if (pageNum < 1) pageNum = 1
              if (pageNum > totalPages) return null
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`w-10 h-10 rounded-lg font-medium transition-all ${
                    currentPage === pageNum
                      ? 'bg-indigo-500 text-white shadow-lg'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  {pageNum}
                </button>
              )
            }).filter(Boolean)}
          </div>

          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* 제재 처리 모달 */}
      <AnimatePresence>
        {showRestrictionModal && selectedUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowRestrictionModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-md w-full"
            >
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">사용자 제재</h2>

              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  const formData = new FormData(e.currentTarget)
                  applyRestriction(selectedUser.id, {
                    type: formData.get('type') as RestrictionType,
                    reason: formData.get('reason') as string,
                    duration: formData.get('duration') ? parseInt(formData.get('duration') as string) : undefined,
                    notes: formData.get('notes') as string
                  })
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    제재 대상
                  </label>
                  <p className="px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    {selectedUser.nickname || selectedUser.name} ({selectedUser.email})
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    제재 유형
                  </label>
                  <select
                    name="type"
                    required
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="warning">경고</option>
                    <option value="suspension">정지</option>
                    <option value="ban">차단</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    제재 사유
                  </label>
                  <input
                    type="text"
                    name="reason"
                    required
                    placeholder="제재 사유를 입력하세요"
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    제재 기간 (일)
                  </label>
                  <input
                    type="number"
                    name="duration"
                    placeholder="영구 제재는 비워두세요"
                    min="1"
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    추가 메모 (선택)
                  </label>
                  <textarea
                    name="notes"
                    rows={3}
                    placeholder="관리자용 메모"
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowRestrictionModal(false)}
                    className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    제재 적용
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 일괄 역할 변경 모달 */}
      <AnimatePresence>
        {showBulkActions && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowBulkActions(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-md w-full"
            >
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                일괄 역할 변경
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                선택한 {selectedUsers.size}명의 사용자 역할을 변경합니다.
              </p>

              <div className="space-y-2">
                {Object.entries(roleConfig).map(([key, config]) => {
                  const Icon = config.icon
                  return (
                    <button
                      key={key}
                      onClick={() => bulkUpdateRoles(key as UserRole)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors hover:scale-[1.02] ${config.color}`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{config.label}</span>
                    </button>
                  )
                })}
              </div>

              <button
                onClick={() => setShowBulkActions(false)}
                className="w-full mt-4 px-4 py-2 bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
              >
                취소
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}