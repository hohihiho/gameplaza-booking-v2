// 운영 일정 관리 페이지
// 비전공자 설명: 관리자가 휴무일, 특별 운영 시간 등을 관리하는 페이지입니다
'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar,
  // CalendarDays,
  Plus,
  // Edit,
  Trash2,
  // Save,
  // X,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Clock,
  // Info,
  Sun,
  Moon,
  Coffee,
  XCircle
} from 'lucide-react';
import Link from 'next/link';

type ScheduleEvent = {
  id: string;
  date: string;
  endDate?: string; // 기간 설정시 사용
  title: string;
  type: 'special' | 'early_open' | 'overnight' | 'early_close' | 'event' | 'reservation_block';
  description?: string;
  startTime?: string;
  endTime?: string;
  isRecurring?: boolean;
  recurringType?: 'weekly' | 'monthly';
  affectsReservation: boolean;
  blockType?: 'early' | 'overnight' | 'all_day'; // 예약 제한 타입
};

const eventTypeConfig = {
  special: {
    label: '특별 운영',
    icon: Clock,
    color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/20',
    borderColor: 'border-blue-200 dark:border-blue-800'
  },
  early_open: {
    label: '조기 오픈',
    icon: Sun,
    color: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20',
    borderColor: 'border-yellow-200 dark:border-yellow-800'
  },
  overnight: {
    label: '밤샘 영업',
    icon: Moon,
    color: 'text-purple-600 bg-purple-100 dark:bg-purple-900/20',
    borderColor: 'border-purple-200 dark:border-purple-800'
  },
  early_close: {
    label: '조기 마감',
    icon: Coffee,
    color: 'text-orange-600 bg-orange-100 dark:bg-orange-900/20',
    borderColor: 'border-orange-200 dark:border-orange-800'
  },
  event: {
    label: '이벤트',
    icon: Calendar,
    color: 'text-green-600 bg-green-100 dark:bg-green-900/20',
    borderColor: 'border-green-200 dark:border-green-800'
  },
  reservation_block: {
    label: '예약 제한',
    icon: XCircle,
    color: 'text-red-600 bg-red-100 dark:bg-red-900/20',
    borderColor: 'border-red-200 dark:border-red-800'
  }
};

export default function ScheduleManagementPage() {
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [isAddingEvent, setIsAddingEvent] = useState(false);
  const [editingEvent, setEditingEvent] = useState<ScheduleEvent | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Mock 데이터
  useEffect(() => {
    setEvents([
      {
        id: '1',
        date: '2024-01-01',
        title: '신정 특별 운영',
        type: 'special',
        description: '새해 첫날 특별 운영 시간',
        startTime: '10:00',
        endTime: '20:00',
        affectsReservation: true
      },
      {
        id: '2',
        date: '2024-01-15',
        title: '조기 마감',
        type: 'early_close',
        description: '기기 정비로 인한 조기 마감',
        endTime: '18:00',
        affectsReservation: true
      },
      {
        id: '3',
        date: '2024-01-20',
        title: '주말 밤샘 영업',
        type: 'overnight',
        description: '주말 특별 밤샘 영업',
        endTime: '05:00',
        affectsReservation: false
      },
      {
        id: '4',
        date: '2024-01-25',
        title: '신규 기기 오픈 이벤트',
        type: 'event',
        description: '신규 기기 체험 이벤트',
        affectsReservation: false
      },
      {
        id: '5',
        date: '2024-01-28',
        endDate: '2024-01-30',
        title: '시스템 점검',
        type: 'reservation_block',
        description: '시스템 업그레이드로 인한 예약 제한',
        blockType: 'all_day',
        affectsReservation: true
      }
    ]);
  }, []);

  // 캘린더 데이터 생성
  const generateCalendarDays = () => {
    const year = selectedMonth.getFullYear();
    const month = selectedMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    const current = new Date(startDate);
    
    while (current <= lastDay || current.getDay() !== 0) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    return days;
  };

  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const getEventsForDate = (date: string) => {
    return events.filter(event => event.date === date);
  };

  const handleSaveEvent = (eventData: Partial<ScheduleEvent>) => {
    if (editingEvent) {
      setEvents(events.map(e => 
        e.id === editingEvent.id ? { ...e, ...eventData } as ScheduleEvent : e
      ));
    } else {
      const newEvent: ScheduleEvent = {
        id: Date.now().toString(),
        date: selectedDate || formatDate(new Date()),
        title: '',
        type: 'holiday',
        affectsReservation: true,
        ...eventData
      } as ScheduleEvent;
      setEvents([...events, newEvent]);
    }
    
    setIsAddingEvent(false);
    setEditingEvent(null);
    setSelectedDate(null);
  };

  const handleDeleteEvent = (eventId: string) => {
    if (!confirm('이 일정을 삭제하시겠습니까?')) return;
    setEvents(events.filter(e => e.id !== eventId));
  };

  const calendarDays = generateCalendarDays();

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* 헤더 */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-2">
          <Link
            href="/admin"
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          </Link>
          <h1 className="text-2xl font-bold dark:text-white">운영 일정 관리</h1>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 ml-11">
          특별 운영 시간, 밤샘 영업, 조기 마감, 이벤트 등을 관리합니다
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 캘린더 */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            {/* 캘린더 헤더 */}
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => {
                  const newMonth = new Date(selectedMonth);
                  newMonth.setMonth(newMonth.getMonth() - 1);
                  setSelectedMonth(newMonth);
                }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              </button>
              
              <h2 className="text-lg font-semibold dark:text-white">
                {selectedMonth.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' })}
              </h2>
              
              <button
                onClick={() => {
                  const newMonth = new Date(selectedMonth);
                  newMonth.setMonth(newMonth.getMonth() + 1);
                  setSelectedMonth(newMonth);
                }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              </button>
            </div>

            {/* 요일 헤더 */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['일', '월', '화', '수', '목', '금', '토'].map(day => (
                <div key={day} className="text-center text-sm font-medium text-gray-600 dark:text-gray-400 py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* 날짜 그리드 */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((date, index) => {
                const dateStr = formatDate(date);
                const dayEvents = dateStr ? getEventsForDate(dateStr) : [];
                const isCurrentMonth = date.getMonth() === selectedMonth.getMonth();
                const isToday = formatDate(new Date()) === dateStr;
                
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.01 }}
                    className={`min-h-[80px] p-2 border rounded-lg cursor-pointer transition-colors ${
                      isCurrentMonth
                        ? 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                        : 'bg-gray-50 dark:bg-gray-950 border-gray-100 dark:border-gray-800 text-gray-400 dark:text-gray-600'
                    } ${isToday ? 'ring-2 ring-blue-500' : ''}`}
                    onClick={() => {
                      if (isCurrentMonth && dateStr) {
                        setSelectedDate(dateStr);
                        setIsAddingEvent(true);
                      }
                    }}
                  >
                    <div className="text-sm font-medium mb-1">{date.getDate()}</div>
                    <div className="space-y-1">
                      {dayEvents.slice(0, 2).map(event => {
                        const config = eventTypeConfig[event.type];
                        const Icon = config.icon;
                        return (
                          <div
                            key={event.id}
                            className={`text-xs px-1 py-0.5 rounded flex items-center gap-1 ${config.color}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingEvent(event);
                            }}
                          >
                            <Icon className="w-3 h-3" />
                            <span className="truncate">{event.title}</span>
                          </div>
                        );
                      })}
                      {dayEvents.length > 2 && (
                        <div className="text-xs text-gray-500 dark:text-gray-500">
                          +{dayEvents.length - 2}개
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 이벤트 목록 및 추가 */}
        <div className="space-y-6">
          {/* 이벤트 추가 버튼 */}
          <button
            onClick={() => setIsAddingEvent(true)}
            className="w-full py-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl hover:border-gray-400 dark:hover:border-gray-500 transition-colors flex items-center justify-center gap-2 text-gray-600 dark:text-gray-400"
          >
            <Plus className="w-5 h-5" />
            <span>새 일정 추가</span>
          </button>

          {/* 이벤트 타입별 범례 */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <h3 className="font-medium dark:text-white mb-3">일정 유형</h3>
            <div className="space-y-2">
              {Object.entries(eventTypeConfig).map(([type, config]) => {
                const Icon = config.icon;
                return (
                  <div key={type} className="flex items-center gap-3">
                    <div className={`p-1.5 rounded ${config.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">{config.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 이번 달 일정 요약 */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <h3 className="font-medium dark:text-white mb-3">이번 달 일정</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {events
                .filter(event => {
                  const eventDate = new Date(event.date);
                  return eventDate.getMonth() === selectedMonth.getMonth() &&
                         eventDate.getFullYear() === selectedMonth.getFullYear();
                })
                .sort((a, b) => a.date.localeCompare(b.date))
                .map(event => {
                  const config = eventTypeConfig[event.type];
                  const Icon = config.icon;
                  return (
                    <div
                      key={event.id}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                      onClick={() => setEditingEvent(event)}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className={`w-4 h-4 ${config.color.split(' ')[0]}`} />
                        <div>
                          <div className="text-sm font-medium dark:text-white">
                            {new Date(event.date).getDate()}일
                            {event.endDate && ` ~ ${new Date(event.endDate).getDate()}일`}
                            {' - '}{event.title}
                          </div>
                          {event.type === 'reservation_block' && event.blockType && (
                            <div className="text-xs text-gray-500 dark:text-gray-500">
                              {event.blockType === 'early' && '조기 대여 제한'}
                              {event.blockType === 'overnight' && '밤샘 대여 제한'}
                              {event.blockType === 'all_day' && '종일 예약 제한'}
                            </div>
                          )}
                          {event.startTime && event.type !== 'reservation_block' && (
                            <div className="text-xs text-gray-500 dark:text-gray-500">
                              {event.startTime} ~ {event.endTime}
                            </div>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteEvent(event.id);
                        }}
                        className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      </div>

      {/* 일정 추가/수정 모달 */}
      {(isAddingEvent || editingEvent) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto"
          >
            <h2 className="text-xl font-semibold dark:text-white mb-6">
              {editingEvent ? '일정 수정' : '새 일정 추가'}
            </h2>
            
            <EventForm
              event={editingEvent || { date: selectedDate || formatDate(new Date()) || '' }}
              onSave={handleSaveEvent}
              onCancel={() => {
                setIsAddingEvent(false);
                setEditingEvent(null);
                setSelectedDate(null);
              }}
            />
          </motion.div>
        </div>
      )}

      {/* 안내 메시지 */}
      <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-1">
              운영 일정 관리 안내
            </h4>
            <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
              <li>• '예약 영향' 옵션을 체크하면 해당 날짜의 예약이 제한됩니다</li>
              <li>• 특별 운영 시간은 일반 운영 시간을 덮어씁니다</li>
              <li>• 밤샘 영업은 다음날 새벽까지 운영 시간을 연장합니다</li>
              <li>• 조기 마감은 영업 시간을 단축합니다</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

// 이벤트 폼 컴포넌트
function EventForm({ 
  event, 
  onSave, 
  onCancel 
}: {
  event: Partial<ScheduleEvent> & { date: string };
  onSave: (event: Partial<ScheduleEvent>) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    date: event.date || '',
    endDate: event.endDate || '',
    title: event.title || '',
    type: event.type || 'special',
    description: event.description || '',
    startTime: event.startTime || '',
    endTime: event.endTime || '',
    affectsReservation: event.affectsReservation ?? true,
    blockType: event.blockType || 'all_day'
  });
  const [isPeriod, setIsPeriod] = useState(!!event.endDate);
  const [blockOptions, setBlockOptions] = useState({
    early: event.blockType === 'early' || event.blockType === 'all_day',
    overnight: event.blockType === 'overnight' || event.blockType === 'all_day'
  });

  // 조기/밤샘 둘 다 선택시 자동으로 종일 선택
  useEffect(() => {
    if (formData.type === 'reservation_block') {
      if (blockOptions.early && blockOptions.overnight) {
        setFormData({ ...formData, blockType: 'all_day' });
      } else if (blockOptions.early) {
        setFormData({ ...formData, blockType: 'early' });
      } else if (blockOptions.overnight) {
        setFormData({ ...formData, blockType: 'overnight' });
      }
    }
  }, [blockOptions, formData.type]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const dataToSave: any = { ...formData };
    if (!isPeriod) {
      delete dataToSave.endDate;
    }
    onSave(dataToSave);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          날짜
        </label>
        <div className="space-y-2">
          <input
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={isPeriod}
              onChange={(e) => {
                setIsPeriod(e.target.checked);
                if (!e.target.checked) {
                  setFormData({ ...formData, endDate: '' });
                }
              }}
              className="text-blue-600 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">기간 설정</span>
          </label>
          {isPeriod && (
            <input
              type="date"
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              min={formData.date}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="종료 날짜"
              required
            />
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          일정 유형
        </label>
        <select
          value={formData.type}
          onChange={(e) => setFormData({ ...formData, type: e.target.value as ScheduleEvent['type'] })}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {Object.entries(eventTypeConfig).map(([type, config]) => (
            <option key={type} value={type}>{config.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          제목
        </label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          설명 (선택)
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows={3}
        />
      </div>

      {formData.type === 'reservation_block' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            예약 제한 범위
          </label>
          <div className="space-y-2">
            <label className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800">
              <input
                type="checkbox"
                checked={blockOptions.early}
                onChange={(e) => setBlockOptions({ ...blockOptions, early: e.target.checked })}
                className="text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="text-sm font-medium dark:text-white">조기 대여 제한</span>
            </label>
            <label className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800">
              <input
                type="checkbox"
                checked={blockOptions.overnight}
                onChange={(e) => setBlockOptions({ ...blockOptions, overnight: e.target.checked })}
                className="text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="text-sm font-medium dark:text-white">밤샘 대여 제한</span>
            </label>
            {blockOptions.early && blockOptions.overnight && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-700 dark:text-red-300">
                  ⚠️ 조기와 밤샘 모두 제한시 종일 예약이 차단됩니다
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {(formData.type === 'special' || formData.type === 'early_open' || formData.type === 'overnight' || formData.type === 'early_close') && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              시작 시간
            </label>
            <input
              type="time"
              value={formData.startTime}
              onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              종료 시간
            </label>
            <input
              type="time"
              value={formData.endTime}
              onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      )}

      {formData.type === 'reservation_block' && (
        <label className="flex items-center gap-3 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg cursor-pointer">
          <input
            type="checkbox"
            checked={formData.affectsReservation}
            onChange={(e) => setFormData({ ...formData, affectsReservation: e.target.checked })}
            className="w-5 h-5 text-yellow-600 rounded focus:ring-yellow-500"
          />
          <div>
            <span className="font-medium text-yellow-800 dark:text-yellow-200">예약에 영향</span>
            <p className="text-sm text-yellow-700 dark:text-yellow-300">
              체크하면 이 날짜의 예약이 제한됩니다
            </p>
          </div>
        </label>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          취소
        </button>
        <button
          type="submit"
          className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          저장
        </button>
      </div>
    </form>
  );
}