'use client';

import Link from 'next/link';
import { Calendar, FileText, Gamepad2, MessageCircle, Info, Clock, Trophy } from 'lucide-react';
import { useSession } from '@/components/providers/AuthProvider';
import { motion } from 'framer-motion';

export default function MainActionButtons() {
  const { data: session } = useSession();
  
  // 디버깅 로그 추가
  console.log('🔍 MainActionButtons - 세션 상태:', { session, hasUser: !!session?.user });
  
  // 관리자 체크
  const isAdmin = session?.user?.role === 'admin' || session?.user?.role === 'super_admin';

  const mainActions = [
    {
      id: 'reservation-new',
      href: session ? '/reservations/new' : '/login',
      icon: Calendar,
      label: '예약하기',
      description: '원하는 기기를 예약하세요',
      gradient: 'from-indigo-500 to-indigo-600',
      shadowColor: 'shadow-indigo-500/25',
      iconBg: 'bg-indigo-500/20',
      iconColor: 'text-indigo-600',
      darkShadow: 'dark:shadow-indigo-500/40',
    },
    {
      id: 'reservation-list',
      href: session ? '/reservations' : '/login',
      icon: FileText,
      label: '내 예약',
      description: '예약 현황을 확인하세요',
      gradient: 'from-cyan-500 to-cyan-600',
      shadowColor: 'shadow-cyan-500/25',
      iconBg: 'bg-cyan-500/20',
      iconColor: 'text-cyan-600',
      darkShadow: 'dark:shadow-cyan-500/40',
    },
    {
      id: 'machines',
      href: '/machines',
      icon: Gamepad2,
      label: '기기 현황',
      description: '보유 기기를 확인하세요',
      gradient: 'from-rose-500 to-rose-600',
      shadowColor: 'shadow-rose-500/25',
      iconBg: 'bg-rose-500/20',
      iconColor: 'text-rose-600',
      darkShadow: 'dark:shadow-rose-500/40',
    },
    {
      id: 'schedule',
      href: '/schedule',
      icon: Clock,
      label: '운영 일정',
      description: '영업 시간과 일정 확인',
      gradient: 'from-violet-500 to-violet-600',
      shadowColor: 'shadow-violet-500/25',
      iconBg: 'bg-violet-500/20',
      iconColor: 'text-violet-600',
      darkShadow: 'dark:shadow-violet-500/40',
    },
    {
      id: 'ranking',
      href: '/ranking',
      icon: Trophy,
      label: '랭킹',
      description: '대여 포인트 랭킹 확인',
      gradient: 'from-amber-500 to-orange-600',
      shadowColor: 'shadow-amber-500/25',
      iconBg: 'bg-amber-500/20',
      iconColor: 'text-amber-600',
      darkShadow: 'dark:shadow-amber-500/40',
    },
  ];

  const quickActions = [
    { 
      href: 'https://open.kakao.com/o/sJPbo3Sb',
      icon: MessageCircle,
      label: '카톡 문의',
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
      external: true
    },
    { 
      href: '/guide',
      icon: Info,
      label: '이용 안내',
      color: 'text-blue-500',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    },
  ];

  const communityLinks = [
    { 
      href: 'https://twitter.com/gameplaza94',
      name: 'X',
      icon: 'x',
      bgColor: 'bg-black',
      hoverColor: 'hover:bg-gray-700',
      description: '최신 소식과 이벤트'
    },
    { 
      href: 'https://www.youtube.com/@GAMEPLAZA_C',
      name: '유튜브',
      icon: 'youtube',
      bgColor: 'bg-[#FF0000]',
      hoverColor: 'hover:bg-[#cc0000]',
      description: '실시간 방송'
    },
    { 
      href: 'https://open.kakao.com/o/gItV8omc',
      name: '카카오톡',
      icon: 'kakao',
      bgColor: 'bg-[#FEE500]',
      hoverColor: 'hover:bg-[#e6cf00]',
      textColor: 'text-black',
      description: '커뮤니티 오픈챗'
    },
    { 
      href: 'https://discord.gg/vTx3y9wvVb',
      name: '디스코드',
      icon: 'discord',
      bgColor: 'bg-[#5865F2]',
      hoverColor: 'hover:bg-[#4752c4]',
      description: '친목 교류'
    },
  ];

  return (
    <div className="px-4 py-8 md:px-6 md:py-12">
      <div className="max-w-7xl mx-auto">
        {/* 관리자 대시보드 링크 */}
        {isAdmin && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mb-6 text-center"
          >
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl font-medium shadow-lg hover:shadow-xl hover:from-purple-700 hover:to-purple-800 transition-all duration-300 transform hover:-translate-y-0.5 touch-target touch-feedback"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              관리자 대시보드
            </Link>
          </motion.div>
        )}
        
        {/* 메인 액션 카드들 */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 auto-rows-[minmax(0,1fr)] gap-3 sm:gap-4 mb-8">
          {mainActions.map((action, index) => (
            <motion.div
              key={action.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="h-full"
            >
              <Link
                href={action.href}
                className="relative flex h-full w-full group touch-target touch-feedback"
              >
                <div className={`
                  relative overflow-hidden rounded-2xl sm:rounded-3xl p-4 sm:p-5 lg:p-6 h-full w-full min-h-[160px] sm:min-h-[170px] lg:min-h-[180px]
                  bg-white dark:bg-gray-900/80 backdrop-blur-sm
                  border border-gray-200 dark:border-gray-600
                  shadow-lg hover:shadow-2xl ${action.shadowColor} ${action.darkShadow}
                  transform transition-all duration-300 hover:-translate-y-2
                  flex flex-col
                `}>
                  {/* 배경 그라데이션 */}
                  <div className={`
                    absolute inset-0 opacity-0 group-hover:opacity-10
                    bg-gradient-to-br ${action.gradient}
                    transition-opacity duration-300
                  `} />

                  {/* 플로팅 아이콘 */}
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    transition={{ duration: 0.2 }}
                    className={`
                      inline-flex items-center justify-center
                      w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-xl sm:rounded-2xl mb-3 sm:mb-4
                      ${action.iconBg} dark:${action.iconBg.replace('/20', '/30')}
                      transition-transform duration-300
                    `}
                  >
                    <action.icon className={`w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 ${action.iconColor} dark:${action.iconColor.replace('-600', '-400')} flex-shrink-0`} />
                  </motion.div>

                  {/* 텍스트 콘텐츠 */}
                  <div className="flex-1 flex flex-col gap-1 sm:gap-1.5">
                    <h3 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 dark:text-white">
                      {action.label}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 text-xs sm:text-sm leading-snug line-clamp-2 min-h-[2.5rem] sm:min-h-[2.75rem]">
                      {action.description}
                    </p>
                  </div>


                  {/* 호버 시 화살표 */}
                  <div className="absolute top-4 right-4 sm:top-5 sm:right-5 lg:top-6 lg:right-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className={`
                      w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 rounded-full bg-gradient-to-r ${action.gradient}
                      flex items-center justify-center text-white text-xs sm:text-sm
                      transform group-hover:translate-x-1 transition-transform duration-300
                    `}>
                      →
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* 오시는 길 카드 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          id="location"
          className="bg-white dark:bg-gray-800 rounded-3xl p-6 md:p-8 border border-gray-200 dark:border-gray-700 shadow-sm mb-8"
        >
          <div className="mb-6">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">오시는 길</h3>
            <p className="text-lg text-gray-700 dark:text-gray-300 font-medium">광주광역시 동구 충장로안길 6</p>
          </div>
          
          {/* 지도 앱 버튼들 */}
          <div className="mb-6">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">지도로 찾아오기</p>
            <div className="grid grid-cols-3 gap-3">
            <a
              href="https://map.naver.com/v5/search/게임플라자 광주광역시 동구 충장로안길 6"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 bg-[#03C75A] hover:bg-[#02a74b] text-white py-3 px-4 rounded-xl font-medium transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl touch-target touch-feedback"
            >
              <span className="text-xl font-black">N</span>
              네이버지도
            </a>
            <a
              href="https://place.map.kakao.com/1155241361"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 bg-[#FEE500] hover:bg-[#e6cf00] text-black py-3 px-4 rounded-xl font-medium transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl touch-target touch-feedback"
            >
              <svg className="w-6 h-6 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 3c5.514 0 10 3.476 10 7.747 0 4.272-4.48 7.748-10 7.748-.899 0-1.767-.091-2.59-.259l-3.863 2.516a.5.5 0 01-.814-.41l.137-3.57C2.456 14.893 2 12.366 2 10.747 2 6.476 6.486 3 12 3z"/>
              </svg>
              카카오맵
            </a>
            <a
              href="https://www.google.com/maps/search/게임플라자 광주광역시 동구 충장로안길 6"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 bg-[#4285F4] hover:bg-[#3574e3] text-white py-3 px-4 rounded-xl font-medium transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl touch-target touch-feedback"
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09zM12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23zM5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62zM12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              구글맵
            </a>
            </div>
          </div>
          
          {/* 대중교통 안내 */}
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">대중교통 안내</p>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <span className="text-indigo-600 dark:text-indigo-400 font-medium min-w-[60px]">지하철</span>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <p>금남로4가역 3번 출구 도보 3분</p>
                  <p className="text-xs mt-1">광주 도시철도 1호선</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-indigo-600 dark:text-indigo-400 font-medium min-w-[60px]">버스</span>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <p>금남로4가 정류장 하차</p>
                  <p className="text-xs mt-1">금남58, 금남59, 수완12, 첨단95, 좌석02 등</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-indigo-600 dark:text-indigo-400 font-medium min-w-[60px]">주차</span>
                <p className="text-sm text-gray-600 dark:text-gray-400">인근 유료주차장 이용</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* 커뮤니티 배너 */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="bg-white dark:bg-gray-800 rounded-3xl p-6 md:p-8 border border-gray-200 dark:border-gray-700 shadow-sm"
        >
          <div className="relative z-10">
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">게임플라자 커뮤니티</h3>
              <p className="text-gray-600 dark:text-gray-400">최신 소식과 이벤트 정보를 받아보세요!</p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {communityLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${link.bgColor} ${link.hoverColor} ${link.textColor || 'text-white'} py-4 px-4 rounded-xl font-medium transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl flex flex-col items-center justify-center gap-2 text-center dark:ring-1 dark:ring-gray-700 dark:hover:ring-gray-600 touch-target touch-feedback`}
                >
                  {link.icon === 'x' && (
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                  )}
                  {link.icon === 'youtube' && (
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                    </svg>
                  )}
                  {link.icon === 'kakao' && (
                    <svg className="w-6 h-6 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 3c5.514 0 10 3.476 10 7.747 0 4.272-4.48 7.748-10 7.748-.899 0-1.767-.091-2.59-.259l-3.863 2.516a.5.5 0 01-.814-.41l.137-3.57C2.456 14.893 2 12.366 2 10.747 2 6.476 6.486 3 12 3z"/>
                    </svg>
                  )}
                  {link.icon === 'discord' && (
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z"/>
                    </svg>
                  )}
                  <span className="font-medium">{link.name}</span>
                  <span className="text-xs opacity-80">{link.description}</span>
                </a>
              ))}
            </div>
          </div>
        </motion.div>

        {/* 고객 지원 섹션 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.7 }}
          className="mt-8"
        >
          <h3 className="text-center text-gray-600 dark:text-gray-400 text-base font-medium mb-6">
            도움이 필요하신가요?
          </h3>
          <div className="grid grid-cols-2 gap-4 max-w-2xl mx-auto">
            {quickActions.map((action) => (
              action.external ? (
                <a
                  key={action.href}
                  href={action.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group touch-target"
                >
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-6 border border-gray-200/70 dark:border-gray-700/70 shadow-sm hover:shadow-lg transition-all duration-300 hover:bg-white dark:hover:bg-gray-800 touch-feedback">
                    <div className="flex items-center gap-4">
                      <div className={`${action.bgColor} w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300`}>
                        <action.icon className={`w-7 h-7 ${action.color}`} />
                      </div>
                      <div className="text-left">
                        <p className="text-base font-semibold text-gray-900 dark:text-white">
                          {action.label}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {action.label === '카톡 문의' ? '실시간 상담' : '이용방법 확인'}
                        </p>
                      </div>
                    </div>
                  </div>
                </a>
              ) : (
                <Link
                  key={action.href}
                  href={action.href}
                  className="group touch-target"
                >
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-6 border border-gray-200/70 dark:border-gray-700/70 shadow-sm hover:shadow-lg transition-all duration-300 hover:bg-white dark:hover:bg-gray-800 touch-feedback">
                    <div className="flex items-center gap-4">
                      <div className={`${action.bgColor} w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300`}>
                        <action.icon className={`w-7 h-7 ${action.color}`} />
                      </div>
                      <div className="text-left">
                        <p className="text-base font-semibold text-gray-900 dark:text-white">
                          {action.label}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {action.label === '카톡 문의' ? '실시간 상담' : '이용방법 확인'}
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              )
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
