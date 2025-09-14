// 예약 목록 페이지
// 비전공자 설명: 사용자의 예약 내역을 확인하는 페이지입니다
'use client';

import { useState } from 'react';
import { Calendar, Clock, CreditCard, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ReservationsPage() {
  const [activeTab, setActiveTab] = useState('all');

  const tabs = [
    { id: 'all', label: '전체', count: 3 },
    { id: 'pending', label: '대기중', count: 1 },
    { id: 'approved', label: '승인됨', count: 1 },
    { id: 'completed', label: '완료', count: 1 },
  ];

  const reservations = [
    {
      id: 1,
      machine: '마이마이 1번기',
      date: '2025년 6월 30일 (일)',
      time: '14:00 - 16:00',
      status: 'approved',
      statusText: '승인됨',
      price: 10000,
      duration: 2,
      reservedAt: '2025-06-26 10:30'
    },
    {
      id: 2,
      machine: '뉱키텐고 1번기',
      date: '2025년 7월 5일 (금)',
      time: '24:00 - 28:00',
      status: 'pending',
      statusText: '대기중',
      price: 20000,
      duration: 4,
      reservedAt: '2025-06-26 14:20'
    },
    {
      id: 3,
      machine: '리플렉 2번기',
      date: '2025년 6월 20일 (목)',
      time: '18:00 - 20:00',
      status: 'completed',
      statusText: '완료',
      price: 15000,
      duration: 2,
      reservedAt: '2025-06-15 09:15'
    },
  ];

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-50 dark:bg-yellow-900/10 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800';
      case 'approved':
        return 'bg-green-50 dark:bg-green-900/10 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800';
      case 'completed':
        return 'bg-gray-50 dark:bg-gray-900/10 text-gray-700 dark:text-gray-400 border-gray-200 dark:border-gray-800';
      default:
        return '';
    }
  };

  const filteredReservations = activeTab === 'all' 
    ? reservations 
    : reservations.filter(r => r.status === activeTab);

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-4xl mx-auto px-5 py-6">
        {/* 페이지 헤더 */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold dark:text-white">내 예약</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">예약 현황을 확인하고 관리하세요</p>
        </div>

        {/* 예약 상태 탭 */}
        <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-gray-800 overflow-x-auto scrollbar-thin">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap relative transition-all ${
                activeTab === tab.id
                  ? 'text-gray-900 dark:text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className="ml-2 text-xs">
                  {tab.count}
                </span>
              )}
              {activeTab === tab.id && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900 dark:bg-white"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
            </button>
          ))}
        </div>

        {/* 예약 목록 */}
        <div className="space-y-3">
          {filteredReservations.map((reservation) => (
            <motion.div
              key={reservation.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-200 dark:border-gray-800 cursor-pointer hover:shadow-sm transition-shadow"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold text-lg dark:text-white">{reservation.machine}</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                    {reservation.date} {reservation.time}
                  </p>
                </div>
                <span className={`px-3 py-1 text-xs font-medium rounded-full border ${getStatusStyle(reservation.status)}`}>
                  {reservation.statusText}
                </span>
              </div>
              
              <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                <span className="flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4" />
                  {reservation.price.toLocaleString()}원
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  {reservation.duration}시간
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  {reservation.reservedAt}
                </span>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <button className="text-sm font-medium text-gray-900 dark:text-white hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
                  상세보기
                </button>
                {reservation.status === 'pending' || reservation.status === 'approved' ? (
                  <button className="text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors">
                    취소하기
                  </button>
                ) : null}
              </div>
            </motion.div>
          ))}

          {filteredReservations.length === 0 && (
            <div className="text-center py-20">
              <p className="text-gray-500 dark:text-gray-400 mb-4">예약 내역이 없습니다</p>
              <a 
                href="/reservations/new" 
                className="inline-flex items-center gap-1 text-gray-900 dark:text-white font-medium hover:underline"
              >
                새로운 예약하기
                <ChevronRight className="w-4 h-4" />
              </a>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}