'use client'

import { useRef, useState, useEffect } from 'react'
import ReservationList from '../components/ReservationList'
import ReservationForm from '../components/ReservationForm'
import MobileLayout from '../components/MobileLayout'
import AdminPanel from '../components/AdminPanel'

export default function V3ReservationsPage() {
  const listRef = useRef<{ reload: () => void }>(null)
  const [mobileView, setMobileView] = useState<'list' | 'form' | 'admin'>('list')
  const [isAdmin, setIsAdmin] = useState(false)
  const [checkingAdmin, setCheckingAdmin] = useState(true)
  
  useEffect(() => {
    checkAdminStatus()
  }, [])
  
  const checkAdminStatus = async () => {
    try {
      const response = await fetch('/api/v3/admin')
      const data = await response.json()
      setIsAdmin(data.success)
    } catch (err) {
      setIsAdmin(false)
    } finally {
      setCheckingAdmin(false)
    }
  }
  
  const handleReservationSuccess = () => {
    // 예약 목록 새로고침
    if (listRef.current?.reload) {
      listRef.current.reload()
    }
    // 모바일에서는 목록 뷰로 전환
    setMobileView('list')
  }
  
  return (
    <MobileLayout title="예약 관리">
      {/* 모바일 뷰 전환 탭 (모바일에서만 표시) */}
      <div className="lg:hidden flex gap-2 mb-4">
        <button
          onClick={() => setMobileView('list')}
          className={`flex-1 py-2 px-4 rounded-lg font-medium transition ${
            mobileView === 'list'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 border'
          }`}
        >
          예약 목록
        </button>
        <button
          onClick={() => setMobileView('form')}
          className={`flex-1 py-2 px-4 rounded-lg font-medium transition ${
            mobileView === 'form'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 border'
          }`}
        >
          새 예약
        </button>
        {isAdmin && (
          <button
            onClick={() => setMobileView('admin')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition ${
              mobileView === 'admin'
                ? 'bg-purple-600 text-white'
                : 'bg-white text-gray-700 border'
            }`}
          >
            관리자
          </button>
        )}
      </div>

      {/* 데스크톱: 그리드 레이아웃 */}
      <div className="hidden lg:grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 왼쪽: 예약 생성 폼 */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">새 예약</h2>
            <ReservationForm onSuccess={handleReservationSuccess} />
          </div>
        </div>

        {/* 오른쪽: 예약 목록 */}
        <div className="lg:col-span-2">
          <ReservationList />
        </div>
      </div>

      {/* 모바일: 탭 기반 뷰 */}
      <div className="lg:hidden">
        {mobileView === 'list' ? (
          <ReservationList />
        ) : mobileView === 'form' ? (
          <div className="bg-white rounded-lg shadow p-4">
            <ReservationForm onSuccess={handleReservationSuccess} />
          </div>
        ) : mobileView === 'admin' && isAdmin ? (
          <AdminPanel />
        ) : null}
      </div>

      {/* 관리자 패널 (데스크톱에서 관리자만) */}
      {isAdmin && (
        <div className="hidden lg:block mt-8">
          <AdminPanel />
        </div>
      )}
      
      {/* 하단: 통계 (데스크톱에서만 표시, 비관리자) */}
      {!isAdmin && (
      <div className="hidden lg:block mt-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-sm font-medium text-gray-500">오늘 예약</h3>
            <p className="mt-1 text-2xl font-semibold">0건</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-sm font-medium text-gray-500">이번 주 예약</h3>
            <p className="mt-1 text-2xl font-semibold">0건</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-sm font-medium text-gray-500">총 매출</h3>
            <p className="mt-1 text-2xl font-semibold">0원</p>
          </div>
        </div>
      </div>
      )}
    </MobileLayout>
  )
}