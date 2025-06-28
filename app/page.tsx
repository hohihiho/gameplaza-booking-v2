'use client';

import { useState, useEffect } from 'react';
import { Calendar, FileText, Gamepad2, Info, MapPin, Phone, Clock, CalendarDays } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { createClient } from '@/lib/supabase';

export default function Home() {
  const { data: session } = useSession();
  const [supabase] = useState(() => createClient());
  const [storeInfo, setStoreInfo] = useState({
    phone: '062-123-4567',
    address: '광주광역시 서구 게임로 123',
    hours: '매일 10:00 - 22:00'
  });
  
  // Supabase에서 영업 정보 가져오기
  useEffect(() => {
    const fetchStoreInfo = async () => {
      try {
        const { data: settings } = await supabase
          .from('settings')
          .select('key, value')
          .in('key', ['store_phone', 'store_address', 'store_hours']);
        
        if (settings) {
          const info = { ...storeInfo };
          settings.forEach(setting => {
            if (setting.key === 'store_phone' && setting.value) {
              info.phone = setting.value;
            } else if (setting.key === 'store_address' && setting.value) {
              info.address = setting.value;
            } else if (setting.key === 'store_hours' && setting.value) {
              info.hours = setting.value;
            }
          });
          setStoreInfo(info);
        }
      } catch (error) {
        console.error('Failed to fetch store info:', error);
      }
    };
    
    fetchStoreInfo();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* 히어로 섹션 */}
      <section className="bg-white dark:bg-gray-900 py-16 px-5">
        <div className="max-w-6xl mx-auto">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 dark:text-white">
              광주 게임플라자
            </h1>
            <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 mb-8">
              최고의 게임 경험을 예약하세요
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="/reservations/new" className="px-8 py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors">
                예약하기
              </a>
              <a href="/machines" className="px-8 py-4 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                기기 현황
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 서비스 카드 섹션 */}
      <section className="py-16 px-5">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-12 dark:text-white">
            서비스
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* 예약하기 카드 */}
            <a href={session ? "/reservations/new" : "/login"} className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 transition-all group">
              <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center mb-4 group-hover:bg-gray-200 dark:group-hover:bg-gray-700 transition-colors">
                <Calendar className="w-6 h-6 text-gray-700 dark:text-gray-300" />
              </div>
              <h3 className="text-lg font-semibold mb-2 dark:text-white">예약하기</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                원하는 게임기를 선택하고 시간을 예약하세요
              </p>
              <span className="text-sm font-medium text-gray-900 dark:text-white group-hover:underline">
                바로가기 →
              </span>
            </a>
            
            {/* 내 예약 카드 */}
            <a href={session ? "/reservations" : "/login"} className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 transition-all group">
              <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center mb-4 group-hover:bg-gray-200 dark:group-hover:bg-gray-700 transition-colors">
                <FileText className="w-6 h-6 text-gray-700 dark:text-gray-300" />
              </div>
              <h3 className="text-lg font-semibold mb-2 dark:text-white">내 예약</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                예약 현황을 확인하고 관리하세요
              </p>
              <span className="text-sm font-medium text-gray-900 dark:text-white group-hover:underline">
                확인하기 →
              </span>
            </a>
            
            {/* 기기 현황 카드 */}
            <a href="/machines" className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 transition-all group">
              <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center mb-4 group-hover:bg-gray-200 dark:group-hover:bg-gray-700 transition-colors">
                <Gamepad2 className="w-6 h-6 text-gray-700 dark:text-gray-300" />
              </div>
              <h3 className="text-lg font-semibold mb-2 dark:text-white">기기 현황</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                보유 게임기와 실시간 상태를 확인하세요
              </p>
              <span className="text-sm font-medium text-gray-900 dark:text-white group-hover:underline">
                둘러보기 →
              </span>
            </a>
            
            {/* 운영 일정 카드 */}
            <a href="/schedule" className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 transition-all group">
              <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center mb-4 group-hover:bg-gray-200 dark:group-hover:bg-gray-700 transition-colors">
                <CalendarDays className="w-6 h-6 text-gray-700 dark:text-gray-300" />
              </div>
              <h3 className="text-lg font-semibold mb-2 dark:text-white">운영 일정</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                영업시간과 특별 일정을 확인하세요
              </p>
              <span className="text-sm font-medium text-gray-900 dark:text-white group-hover:underline">
                확인하기 →
              </span>
            </a>
            
            {/* 이용 안내 카드 */}
            <a href="/guide" className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 transition-all group">
              <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center mb-4 group-hover:bg-gray-200 dark:group-hover:bg-gray-700 transition-colors">
                <Info className="w-6 h-6 text-gray-700 dark:text-gray-300" />
              </div>
              <h3 className="text-lg font-semibold mb-2 dark:text-white">이용 안내</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                예약 방법과 이용 규칙을 확인하세요
              </p>
              <span className="text-sm font-medium text-gray-900 dark:text-white group-hover:underline">
                자세히 보기 →
              </span>
            </a>
            
            {/* 예약 안내 카드 */}
            <a href="/guide/reservation" className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 transition-all group">
              <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center mb-4 group-hover:bg-gray-200 dark:group-hover:bg-gray-700 transition-colors">
                <FileText className="w-6 h-6 text-gray-700 dark:text-gray-300" />
              </div>
              <h3 className="text-lg font-semibold mb-2 dark:text-white">예약 안내</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                대여 예약 방법과 FAQ를 확인하세요
              </p>
              <span className="text-sm font-medium text-gray-900 dark:text-white group-hover:underline">
                자세히 보기 →
              </span>
            </a>
          </div>
        </div>
      </section>

      {/* 게임 종류 섹션 */}
      <section className="py-16 px-5 bg-white dark:bg-gray-900">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-12 dark:text-white">
            다양한 게임
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-6 rounded-xl border border-gray-200 dark:border-gray-800">
              <h4 className="font-medium text-gray-900 dark:text-white">리듬게임</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">마이마이, 츄니즘</p>
            </div>
            <div className="text-center p-6 rounded-xl border border-gray-200 dark:border-gray-800">
              <h4 className="font-medium text-gray-900 dark:text-white">격투게임</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">철권, 스파</p>
            </div>
            <div className="text-center p-6 rounded-xl border border-gray-200 dark:border-gray-800">
              <h4 className="font-medium text-gray-900 dark:text-white">레이싱</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">이니셜D</p>
            </div>
            <div className="text-center p-6 rounded-xl border border-gray-200 dark:border-gray-800">
              <h4 className="font-medium text-gray-900 dark:text-white">아케이드</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">클래식 게임</p>
            </div>
          </div>
        </div>
      </section>

      {/* 연락처 섹션 */}
      <section className="py-16 px-5">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-12 dark:text-white">오시는 길</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Phone className="w-6 h-6 text-gray-700 dark:text-gray-300" />
              </div>
              <h4 className="font-medium mb-2 dark:text-white">전화번호</h4>
              <p className="text-gray-600 dark:text-gray-400">{storeInfo.phone}</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-6 h-6 text-gray-700 dark:text-gray-300" />
              </div>
              <h4 className="font-medium mb-2 dark:text-white">주소</h4>
              <p className="text-gray-600 dark:text-gray-400">{storeInfo.address}</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Clock className="w-6 h-6 text-gray-700 dark:text-gray-300" />
              </div>
              <h4 className="font-medium mb-2 dark:text-white">영업시간</h4>
              <p className="text-gray-600 dark:text-gray-400">{storeInfo.hours}</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}