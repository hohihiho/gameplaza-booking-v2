// 관리자 페이지
// 비전공자 설명: 관리자가 예약, 기기, 사용자를 관리하는 페이지입니다
'use client';

import { Calendar, Clock, Users, DollarSign, FileText, Gamepad2, UserCog, Settings, BarChart3 } from 'lucide-react';

export default function AdminPage() {
  const stats = [
    { label: '오늘 예약', value: '15', icon: Calendar, color: 'text-gray-900 dark:text-white' },
    { label: '대기중 예약', value: '3', icon: Clock, color: 'text-yellow-600 dark:text-yellow-400' },
    { label: '활성 사용자', value: '128', icon: Users, color: 'text-gray-900 dark:text-white' },
    { label: '오늘 매출', value: '₩85,000', icon: DollarSign, color: 'text-gray-900 dark:text-white' },
  ];

  const menuGroups = [
    {
      title: '예약 관리',
      icon: FileText,
      items: [
        { name: '대기중 예약 승인', href: '/admin/reservations' },
        { name: '오늘 예약 현황', href: '/admin/reservations/today' },
        { name: '전체 예약 조회', href: '/admin/reservations/all' },
      ]
    },
    {
      title: '기기 관리',
      icon: Gamepad2,
      items: [
        { name: '기기 목록', href: '/admin/machines' },
        { name: '기기 추가', href: '/admin/machines/new' },
        { name: '시간대 관리', href: '/admin/time-slots' },
      ]
    },
    {
      title: '사용자 관리',
      icon: UserCog,
      items: [
        { name: '회원 목록', href: '/admin/users' },
        { name: '블랙리스트 관리', href: '/admin/blacklist' },
        { name: '스태프 권한 관리', href: '/admin/staff' },
      ]
    },
    {
      title: '콘텐츠 관리',
      icon: FileText,
      items: [
        { name: '페이지 편집', href: '/admin/cms' },
        { name: '공지사항 관리', href: '/admin/notices' },
        { name: '이용안내 수정', href: '/admin/guide' },
      ]
    },
    {
      title: '통계 및 분석',
      icon: BarChart3,
      items: [
        { name: '매출 통계', href: '/admin/stats/revenue' },
        { name: '이용 통계', href: '/admin/stats/usage' },
        { name: '데이터 내보내기', href: '/admin/export' },
      ]
    },
    {
      title: '시스템 설정',
      icon: Settings,
      items: [
        { name: '기본 설정', href: '/admin/settings' },
        { name: '백업 관리', href: '/admin/backup' },
        { name: '시스템 로그', href: '/admin/logs' },
      ]
    },
  ];

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-7xl mx-auto px-5 py-6">
        {/* 페이지 헤더 */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold dark:text-white">관리자 대시보드</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">게임플라자 운영 현황을 관리하세요</p>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</p>
                  <Icon className="w-5 h-5 text-gray-400" />
                </div>
                <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              </div>
            );
          })}
        </div>

        {/* 관리 메뉴 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {menuGroups.map((group) => {
            const Icon = group.icon;
            return (
              <div key={group.title} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
                <h2 className="text-lg font-semibold mb-4 dark:text-white flex items-center gap-2">
                  <Icon className="w-5 h-5" />
                  {group.title}
                </h2>
                <div className="space-y-1">
                  {group.items.map((item) => (
                    <a
                      key={item.name}
                      href={item.href}
                      className="block px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    >
                      {item.name}
                    </a>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}