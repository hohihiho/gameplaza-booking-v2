'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { formatKSTDate } from '@/lib/utils/kst-date';

interface CalendarProps {
  // 선택된 날짜 (YYYY-MM-DD 형식)
  selectedDate?: string;
  // 날짜 선택 콜백
  onDateSelect?: (date: string) => void;
  // 비활성화할 날짜 판별 함수
  isDateDisabled?: (date: Date) => boolean;
  // 최소 선택 가능 날짜
  minDate?: Date;
  // 최대 선택 가능 날짜
  maxDate?: Date;
  // 표시할 월 수
  monthsToShow?: number;
  // 모바일에서 스와이프 지원 여부
  enableSwipe?: boolean;
  // 커스텀 날짜 렌더링
  renderDate?: (date: Date, isSelected: boolean, isDisabled: boolean) => React.ReactNode;
  // 특정 날짜에 표시할 마크
  dateMarks?: Record<string, { color: string; tooltip?: string }>;
  // 클래스명
  className?: string;
}

export function Calendar({
  selectedDate,
  onDateSelect,
  isDateDisabled,
  minDate,
  maxDate,
  monthsToShow = 1,
  enableSwipe = true,
  renderDate,
  dateMarks = {},
  className = ''
}: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // 요일 이름
  const weekDays = ['일', '월', '화', '수', '목', '금', '토'];

  // 현재 표시할 월의 날짜들 생성
  const calendarDays = useMemo(() => {
    const days: (Date | null)[][] = [];
    
    for (let monthOffset = 0; monthOffset < monthsToShow; monthOffset++) {
      const targetMonth = new Date(currentMonth);
      targetMonth.setMonth(currentMonth.getMonth() + monthOffset);
      
      const year = targetMonth.getFullYear();
      const month = targetMonth.getMonth();
      
      // 해당 월의 첫 날과 마지막 날
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      
      // 첫 주의 빈 날짜 채우기
      const monthDays: (Date | null)[] = [];
      const firstDayOfWeek = firstDay.getDay();
      
      for (let i = 0; i < firstDayOfWeek; i++) {
        monthDays.push(null);
      }
      
      // 실제 날짜들 추가
      for (let date = 1; date <= lastDay.getDate(); date++) {
        monthDays.push(new Date(year, month, date));
      }
      
      // 마지막 주의 빈 날짜 채우기 (7의 배수로 맞추기)
      while (monthDays.length % 7 !== 0) {
        monthDays.push(null);
      }
      
      // 주 단위로 분할
      const weeks: (Date | null)[][] = [];
      for (let i = 0; i < monthDays.length; i += 7) {
        weeks.push(monthDays.slice(i, i + 7));
      }
      
      days.push(...weeks);
    }
    
    return days;
  }, [currentMonth, monthsToShow]);

  // 날짜 비활성화 여부 확인
  const checkDateDisabled = (date: Date): boolean => {
    if (isDateDisabled) {
      return isDateDisabled(date);
    }
    
    // 기본적으로 오늘 이전 날짜는 비활성화
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dateOnly = new Date(date);
    dateOnly.setHours(0, 0, 0, 0);
    
    if (dateOnly < today) return true;
    
    // minDate/maxDate 체크
    if (minDate && dateOnly < minDate) return true;
    if (maxDate && dateOnly > maxDate) return true;
    
    return false;
  };

  // 이전/다음 월로 이동
  const navigateMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(currentMonth.getMonth() + (direction === 'prev' ? -1 : 1));
    setCurrentMonth(newMonth);
  };

  // 월 이름 포맷
  const formatMonthYear = (date: Date) => {
    return `${date.getFullYear()}년 ${date.getMonth() + 1}월`;
  };

  // 터치 이벤트 핸들링 (스와이프)
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  
  const minSwipeDistance = 50;
  
  const onTouchStart = (e: React.TouchEvent) => {
    if (!enableSwipe) return;
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };
  
  const onTouchMove = (e: React.TouchEvent) => {
    if (!enableSwipe) return;
    setTouchEnd(e.targetTouches[0].clientX);
  };
  
  const onTouchEnd = () => {
    if (!touchStart || !touchEnd || !enableSwipe) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe) {
      navigateMonth('next');
    } else if (isRightSwipe) {
      navigateMonth('prev');
    }
  };

  return (
    <div className={`select-none ${className}`}>
      {/* 월 네비게이션 */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => navigateMonth('prev')}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          aria-label="이전 달"
        >
          <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>
        
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {formatMonthYear(currentMonth)}
        </h3>
        
        <button
          onClick={() => navigateMonth('next')}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          aria-label="다음 달"
        >
          <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>
      </div>

      {/* 캘린더 그리드 */}
      <div
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* 요일 헤더 */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2">
          {weekDays.map((day, index) => (
            <div
              key={day}
              className={`text-center text-sm font-medium py-2 ${
                index === 0 ? 'text-red-500' : index === 6 ? 'text-blue-500' : 'text-gray-700 dark:text-gray-300'
              }`}
            >
              {day}
            </div>
          ))}
        </div>

        {/* 날짜 그리드 */}
        <div className="space-y-1 sm:space-y-2">
          {calendarDays.map((week, weekIndex) => (
            <div key={weekIndex} className="grid grid-cols-7 gap-1 sm:gap-2">
              {week.map((date, dayIndex) => {
                if (!date) {
                  return <div key={`empty-${weekIndex}-${dayIndex}`} className="aspect-square" />;
                }
                
                const dateStr = formatKSTDate(date);
                const isSelected = selectedDate === dateStr;
                const isToday = new Date().toDateString() === date.toDateString();
                const isDisabled = checkDateDisabled(date);
                const dayOfWeek = date.getDay();
                const mark = dateMarks[dateStr];
                
                // 커스텀 렌더링이 제공된 경우
                if (renderDate) {
                  return (
                    <div key={dateStr} className="aspect-square">
                      {renderDate(date, isSelected, isDisabled)}
                    </div>
                  );
                }
                
                return (
                  <motion.button
                    key={dateStr}
                    whileHover={!isDisabled ? { scale: 1.05 } : {}}
                    whileTap={!isDisabled ? { scale: 0.95 } : {}}
                    onClick={() => {
                      if (!isDisabled && onDateSelect) {
                        onDateSelect(dateStr);
                      }
                    }}
                    disabled={isDisabled}
                    className={`
                      aspect-square flex flex-col items-center justify-center rounded-lg sm:rounded-xl 
                      border-2 transition-all relative
                      ${isDisabled
                        ? 'opacity-50 cursor-not-allowed border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800'
                        : isSelected
                          ? 'border-indigo-600 bg-indigo-600 text-white'
                          : isToday
                            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-900'
                      }
                    `}
                    title={mark?.tooltip}
                  >
                    <span className={`
                      text-sm font-medium
                      ${isDisabled
                        ? 'text-gray-400 dark:text-gray-600'
                        : isSelected 
                          ? 'text-white' 
                          : dayOfWeek === 0 
                            ? 'text-red-500' 
                            : dayOfWeek === 6 
                              ? 'text-blue-500' 
                              : 'text-gray-700 dark:text-gray-300'
                      }
                    `}>
                      {date.getDate()}
                    </span>
                    
                    {/* 마크 표시 */}
                    {mark && !isDisabled && (
                      <div 
                        className="absolute bottom-1 w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: mark.color }}
                      />
                    )}
                  </motion.button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}