// 콘텐츠 관리 메인 메뉴 페이지
'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  ChevronLeft,
  ChevronRight,
  // FileText,
  Info,
  Calendar,
  // Settings,
  Edit3,
  Gamepad2
} from 'lucide-react';

type ContentMenuItem = {
  title: string;
  description: string;
  icon: React.ElementType;
  href: string;
  color: string;
};

export default function ContentMenuPage() {
  const menuItems: ContentMenuItem[] = [
    {
      title: '대여 이용안내',
      description: '예약 시 사용자에게 보여줄 대여 이용 안내사항을 관리합니다',
      icon: Info,
      href: '/admin/content/rental-guide',
      color: 'bg-blue-500'
    },
    {
      title: '기기 현황 안내',
      description: '기기 현황 페이지 하단에 표시되는 안내사항을 관리합니다',
      icon: Gamepad2,
      href: '/admin/content/machine-guide',
      color: 'bg-orange-500'
    },
    {
      title: '오락실 이용안내',
      description: '오락실 영업 정보와 이용 방법 안내 페이지를 편집합니다',
      icon: Edit3,
      href: '/guide',
      color: 'bg-green-500'
    },
    {
      title: '예약 안내',
      description: '예약 시스템 사용 방법과 주의사항 안내 페이지를 편집합니다',
      icon: Calendar,
      href: '/guide/reservation',
      color: 'bg-purple-500'
    }
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-2">
          <Link
            href="/admin"
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          </Link>
          <h1 className="text-2xl font-bold dark:text-white">콘텐츠 관리</h1>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 ml-11">
          웹사이트에 표시되는 각종 안내 문구와 콘텐츠를 관리합니다
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {menuItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Link
                href={item.href}
                className="block bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-all group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-lg ${item.color} bg-opacity-10`}>
                    <Icon className={`w-6 h-6 text-white`} style={{ color: item.color.replace('bg-', '') }} />
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:translate-x-1 transition-transform" />
                </div>
                
                <h2 className="text-lg font-semibold dark:text-white mb-2">
                  {item.title}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {item.description}
                </p>
              </Link>
            </motion.div>
          );
        })}
      </div>

      <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
        <h3 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
          콘텐츠 관리 안내
        </h3>
        <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
          <li>• 각 콘텐츠는 실시간으로 웹사이트에 반영됩니다</li>
          <li>• 관리자 권한이 있을 때만 편집 버튼이 표시됩니다</li>
          <li>• 수정 후 저장 버튼을 클릭해야 변경사항이 적용됩니다</li>
        </ul>
      </div>
    </div>
  );
}