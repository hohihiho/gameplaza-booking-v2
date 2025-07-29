import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Calendar } from '../Calendar';
import { formatKSTDate } from '@/lib/utils/kst-date';

describe('Calendar', () => {
  const mockOnDateSelect = jest.fn();

  beforeEach(() => {
    mockOnDateSelect.mockClear();
  });

  it('렌더링이 정상적으로 되어야 한다', () => {
    render(<Calendar />);
    
    // 요일 헤더 확인
    expect(screen.getByText('일')).toBeInTheDocument();
    expect(screen.getByText('월')).toBeInTheDocument();
    expect(screen.getByText('화')).toBeInTheDocument();
    expect(screen.getByText('수')).toBeInTheDocument();
    expect(screen.getByText('목')).toBeInTheDocument();
    expect(screen.getByText('금')).toBeInTheDocument();
    expect(screen.getByText('토')).toBeInTheDocument();
  });

  it('현재 월이 표시되어야 한다', () => {
    const now = new Date();
    const monthYear = `${now.getFullYear()}년 ${now.getMonth() + 1}월`;
    
    render(<Calendar />);
    
    expect(screen.getByText(monthYear)).toBeInTheDocument();
  });

  it('날짜를 클릭하면 onDateSelect가 호출되어야 한다', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowDate = tomorrow.getDate();
    
    render(<Calendar onDateSelect={mockOnDateSelect} />);
    
    // 내일 날짜 클릭
    const tomorrowButton = screen.getByText(tomorrowDate.toString());
    fireEvent.click(tomorrowButton);
    
    expect(mockOnDateSelect).toHaveBeenCalledWith(formatKSTDate(tomorrow));
  });

  it('오늘 이전 날짜는 비활성화되어야 한다', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayDate = yesterday.getDate();
    
    render(<Calendar onDateSelect={mockOnDateSelect} />);
    
    // 어제 날짜가 있다면 비활성화 확인
    const yesterdayButtons = screen.queryAllByText(yesterdayDate.toString());
    if (yesterdayButtons.length > 0) {
      const yesterdayButton = yesterdayButtons[0].closest('button');
      expect(yesterdayButton).toBeDisabled();
    }
  });

  it('선택된 날짜가 하이라이트되어야 한다', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const selectedDate = formatKSTDate(tomorrow);
    
    render(<Calendar selectedDate={selectedDate} />);
    
    const tomorrowButton = screen.getByText(tomorrow.getDate().toString()).closest('button');
    expect(tomorrowButton).toHaveClass('bg-indigo-600');
  });

  it('이전/다음 월로 네비게이션이 가능해야 한다', () => {
    render(<Calendar />);
    
    const now = new Date();
    const currentMonthYear = `${now.getFullYear()}년 ${now.getMonth() + 1}월`;
    
    // 현재 월 확인
    expect(screen.getByText(currentMonthYear)).toBeInTheDocument();
    
    // 다음 월로 이동
    const nextButton = screen.getByLabelText('다음 달');
    fireEvent.click(nextButton);
    
    const nextMonth = new Date(now);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    const nextMonthYear = `${nextMonth.getFullYear()}년 ${nextMonth.getMonth() + 1}월`;
    
    expect(screen.getByText(nextMonthYear)).toBeInTheDocument();
    
    // 이전 월로 이동
    const prevButton = screen.getByLabelText('이전 달');
    fireEvent.click(prevButton);
    
    expect(screen.getByText(currentMonthYear)).toBeInTheDocument();
  });

  it('minDate와 maxDate 범위를 벗어난 날짜는 비활성화되어야 한다', () => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const dayAfterTomorrow = new Date(today);
    dayAfterTomorrow.setDate(today.getDate() + 2);
    
    render(
      <Calendar 
        minDate={today}
        maxDate={tomorrow}
        onDateSelect={mockOnDateSelect}
      />
    );
    
    // 내일까지는 활성화
    const tomorrowButton = screen.getByText(tomorrow.getDate().toString()).closest('button');
    expect(tomorrowButton).not.toBeDisabled();
    
    // 모레는 비활성화 (같은 월에 있다면)
    if (dayAfterTomorrow.getMonth() === today.getMonth()) {
      const dayAfterButton = screen.getByText(dayAfterTomorrow.getDate().toString()).closest('button');
      expect(dayAfterButton).toBeDisabled();
    }
  });

  it('커스텀 isDateDisabled 함수가 적용되어야 한다', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // 내일을 비활성화하는 함수
    const isDateDisabled = (date: Date) => {
      return date.getDate() === tomorrow.getDate();
    };
    
    render(
      <Calendar 
        isDateDisabled={isDateDisabled}
        onDateSelect={mockOnDateSelect}
      />
    );
    
    const tomorrowButton = screen.getByText(tomorrow.getDate().toString()).closest('button');
    expect(tomorrowButton).toBeDisabled();
  });

  it('dateMarks가 표시되어야 한다', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = formatKSTDate(tomorrow);
    
    const dateMarks = {
      [tomorrowStr]: { color: '#10b981', tooltip: '예약 가능' }
    };
    
    render(<Calendar dateMarks={dateMarks} />);
    
    const tomorrowButton = screen.getByText(tomorrow.getDate().toString()).closest('button');
    expect(tomorrowButton).toHaveAttribute('title', '예약 가능');
    
    // 마크 요소 확인
    const mark = tomorrowButton?.querySelector('[style*="background-color"]');
    expect(mark).toHaveStyle({ backgroundColor: '#10b981' });
  });

  it('주말(일요일, 토요일)은 다른 색상으로 표시되어야 한다', () => {
    render(<Calendar />);
    
    // 일요일은 빨간색
    const sunday = screen.getByText('일');
    expect(sunday).toHaveClass('text-red-500');
    
    // 토요일은 파란색
    const saturday = screen.getByText('토');
    expect(saturday).toHaveClass('text-blue-500');
  });
});