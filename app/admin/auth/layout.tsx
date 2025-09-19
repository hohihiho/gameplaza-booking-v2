'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Users, 
  Activity, 
  Settings as SettingsIcon,
  Key
} from 'lucide-react';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const authMenuItems = [
    { 
      href: '/admin/auth', 
      label: '사용자 관리', 
      icon: Users,
      description: '가입자 목록 및 통계'
    },
    { 
      href: '/admin/auth/sessions', 
      label: '세션 관리', 
      icon: Activity,
      description: '활성 세션 및 접속 현황'
    },
    { 
      href: '/admin/auth/settings', 
      label: '인증 설정', 
      icon: SettingsIcon,
      description: 'OAuth 및 보안 설정'
    },
  ];

  return (
    <div className="p-6">
      {/* 페이지 헤더 */}
      <div className="mb-8">
        <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-2">
          <span>관리자</span>
          <span>/</span>
          <span>인증 관리</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Better Auth 관리</h1>
        <p className="text-muted-foreground">
          사용자 인증, 세션 관리 및 보안 설정을 통합 관리합니다
        </p>
      </div>

      {/* 서브 네비게이션 */}
      <div className="mb-6">
        <div className="border-b border-border">
          <nav className="flex space-x-8" aria-label="인증 관리 메뉴">
            {authMenuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors
                    ${isActive 
                      ? 'border-primary text-primary' 
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  <div className="flex flex-col">
                    <span>{item.label}</span>
                    <span className="text-xs opacity-70 hidden sm:block">
                      {item.description}
                    </span>
                  </div>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div>
        {children}
      </div>
    </div>
  );
}