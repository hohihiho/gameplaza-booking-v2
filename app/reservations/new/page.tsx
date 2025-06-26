// 예약 신청 페이지
// 비전공자 설명: 새로운 게임기 예약을 신청하는 페이지입니다
'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, Gamepad2, Hash, Users, Check, ChevronLeft } from 'lucide-react';

type Device = {
  id: string;
  name: string;
  type: string;
  supports2P: boolean;
  priceMode: string;
  creditPrice?: number;
  freeplayPrice?: number;
  unlimitedPrice?: number;
  additionalPlayerRate?: number;
};

type TimeSlot = {
  id: string;
  time: string;
  duration: number;
  type: string;
  gameTypes?: string[];
  teenOnly?: boolean;
  available?: boolean;
};

export default function NewReservationPage() {
  // 각 단계별 선택 상태 관리
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('');
  const [selectedDevice, setSelectedDevice] = useState('');
  const [selectedDeviceNumber, setSelectedDeviceNumber] = useState('');
  const [is2Player, setIs2Player] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [showPolicy, setShowPolicy] = useState(false);

  // 현재 단계 관리 (1-6)
  const [currentStep, setCurrentStep] = useState(1);

  // API에서 가져올 데이터들 (실제로는 useEffect로 fetch)
  const devices = useMemo<Device[]>(() => [
    { id: '1', name: '마이마이', type: 'rhythm', supports2P: true, priceMode: 'credit', creditPrice: 500, additionalPlayerRate: 2 },
    { id: '2', name: '츄니즘', type: 'rhythm', supports2P: false, priceMode: 'freeplay', freeplayPrice: 5000 },
    { id: '3', name: '사운드 볼텍스', type: 'rhythm', supports2P: false, priceMode: 'unlimited', unlimitedPrice: 20000 },
    { id: '4', name: '비트매니아 IIDX', type: 'rhythm', supports2P: true, priceMode: 'credit', creditPrice: 600, additionalPlayerRate: 1.8 },
    { id: '5', name: '철권8', type: 'fighting', supports2P: true, priceMode: 'freeplay', freeplayPrice: 6000, additionalPlayerRate: 1.5 },
    { id: '6', name: '스트리트파이터6', type: 'fighting', supports2P: true, priceMode: 'freeplay', freeplayPrice: 6000, additionalPlayerRate: 1.5 },
  ], []);

  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [deviceNumbers, setDeviceNumbers] = useState<string[]>([]);

  // 선택한 정보 가져오기
  const selectedDeviceInfo = devices.find(d => d.id === selectedDevice);
  const selectedTimeSlotInfo = timeSlots.find(s => s.id === selectedTimeSlot);

  // 가격 계산 (기기와 시간대에 따라 다름)
  const calculatePrice = () => {
    if (!selectedDeviceInfo || !selectedTimeSlotInfo) return 0;
    
    let basePrice = 0;
    const duration = selectedTimeSlotInfo.duration;
    
    // 요금제에 따른 가격 계산
    if (selectedDeviceInfo.priceMode === 'credit') {
      basePrice = (selectedDeviceInfo.creditPrice || 0) * duration * 10; // 시간당 10크레딧 기준
    } else if (selectedDeviceInfo.priceMode === 'freeplay') {
      basePrice = (selectedDeviceInfo.freeplayPrice || 0) * duration;
    } else if (selectedDeviceInfo.priceMode === 'unlimited') {
      basePrice = selectedDeviceInfo.unlimitedPrice || 0; // 시간 무관
    }
    
    // 2인 플레이 추가 요금
    if (is2Player && selectedDeviceInfo.additionalPlayerRate) {
      basePrice = basePrice * (selectedDeviceInfo.additionalPlayerRate || 1.5);
    }
    
    return basePrice;
  };

  // 기기 선택시 사용 가능한 시간대 불러오기
  useEffect(() => {
    if (selectedDevice && selectedDate) {
      // 실제로는 API 호출
      // const response = await fetch(`/api/timeslots?device=${selectedDevice}&date=${selectedDate}`);
      
      // 임시 데이터
      const device = devices.find(d => d.id === selectedDevice);
      if (device?.type === 'rhythm') {
        setTimeSlots([
          { id: 't1', time: '07:00-12:00', duration: 5, type: 'early', available: true },
          { id: 't2', time: '08:00-12:00', duration: 4, type: 'early', available: true },
          { id: 't3', time: '09:00-13:00', duration: 4, type: 'early', available: true, teenOnly: true },
          { id: 't4', time: '24:00-28:00', duration: 4, type: 'overnight', available: true },
          { id: 't5', time: '24:00-29:00', duration: 5, type: 'overnight', available: true },
        ]);
      } else {
        setTimeSlots([
          { id: 't1', time: '07:00-12:00', duration: 5, type: 'early', available: true },
          { id: 't2', time: '08:00-12:00', duration: 4, type: 'early', available: true },
          { id: 't3', time: '09:00-13:00', duration: 4, type: 'early', available: true, teenOnly: true },
        ]);
      }
      
      // 기기 번호도 불러오기
      setDeviceNumbers(['1번기', '2번기', '3번기', '4번기']);
    }
  }, [selectedDevice, selectedDate, devices]);

  const totalPrice = calculatePrice();

  // 애니메이션 설정
  const pageAnimation = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
    transition: { duration: 0.2, ease: "easeInOut" as const }
  };

  const steps = [
    { num: 1, label: '날짜', icon: Calendar },
    { num: 2, label: '기기', icon: Gamepad2 },
    { num: 3, label: '시간', icon: Clock },
    { num: 4, label: '번호', icon: Hash },
    { num: 5, label: '인원', icon: Users },
    { num: 6, label: '확인', icon: Check }
  ];

  // 날짜를 더 예쁘게 표시하는 함수
  const formatDateDisplay = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    return `${date.getMonth() + 1}월 ${date.getDate()}일 ${days[date.getDay()]}요일`;
  };

  // 날짜 선택을 위한 달력 데이터 생성
  const generateCalendarDays = () => {
    const today = new Date();
    const days = [];
    
    for (let i = 0; i < 21; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      days.push(date);
    }
    
    return days;
  };

  const calendarDays = generateCalendarDays();

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-lg mx-auto px-5 py-6">
        {/* 헤더 */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold dark:text-white">예약하기</h1>
        </div>

        {/* 진행 단계 */}
        <div className="relative mb-8">
          <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200 dark:bg-gray-800" />
          <div 
            className="absolute top-5 left-0 h-0.5 bg-gray-900 dark:bg-white transition-all duration-300"
            style={{ width: `${((currentStep - 1) / 5) * 100}%` }}
          />
          
          <div className="relative flex justify-between">
            {steps.map((step) => {
              const Icon = step.icon;
              return (
                <div key={step.num} className="flex flex-col items-center">
                  <motion.div
                    animate={{
                      scale: currentStep === step.num ? 1.1 : 1,
                    }}
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                      currentStep >= step.num 
                        ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900' 
                        : 'bg-gray-200 dark:bg-gray-800 text-gray-400'
                    }`}
                  >
                    {currentStep > step.num ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <Icon className="w-5 h-5" />
                    )}
                  </motion.div>
                  <span className={`mt-2 text-xs transition-colors ${
                    currentStep >= step.num 
                      ? 'text-gray-900 dark:text-white font-medium' 
                      : 'text-gray-400'
                  }`}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 단계별 컨텐츠 */}
        <AnimatePresence mode="wait">
          {/* 1단계: 날짜 선택 */}
          {currentStep === 1 && (
            <motion.div {...pageAnimation} key="step1">
              <div className="bg-white dark:bg-gray-900 rounded-2xl p-6">
                <h2 className="text-lg font-semibold mb-6 dark:text-white">날짜 선택</h2>
                
                <div className="grid grid-cols-7 gap-2 mb-6">
                  {['월', '화', '수', '목', '금', '토', '일'].map((day, index) => (
                    <div key={day} className={`text-center text-sm font-medium py-2 ${
                      index === 5 ? 'text-blue-500' : index === 6 ? 'text-red-500' : 'text-gray-600 dark:text-gray-400'
                    }`}>
                      {day}
                    </div>
                  ))}
                  
                  {/* 첫 번째 날짜가 시작되는 요일까지 빈 칸 추가 */}
                  {calendarDays.length > 0 && Array.from({ length: (calendarDays[0].getDay() + 6) % 7 }).map((_, i) => (
                    <div key={`empty-${i}`} />
                  ))}
                  
                  {calendarDays.map((date, index) => {
                    const dateString = date.toISOString().split('T')[0];
                    const isToday = index === 0;
                    const dayOfWeek = date.getDay();
                    
                    return (
                      <motion.button
                        key={dateString}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setSelectedDate(dateString || '')}
                        className={`aspect-square rounded-lg flex flex-col items-center justify-center transition-all ${
                          selectedDate === dateString
                            ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                            : isToday
                              ? 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
                              : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                        }`}
                      >
                        <span className={`text-sm font-medium ${
                          selectedDate === dateString 
                            ? '' 
                            : dayOfWeek === 0 ? 'text-red-500' : dayOfWeek === 6 ? 'text-blue-500' : 'text-gray-900 dark:text-gray-300'
                        }`}>
                          {date.getDate()}
                        </span>
                        {isToday && (
                          <span className={`text-xs ${
                            selectedDate === dateString ? 'text-white/70 dark:text-gray-900/70' : 'text-gray-500'
                          }`}>
                            오늘
                          </span>
                        )}
                      </motion.button>
                    );
                  })}
                </div>
                
                {selectedDate && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg mb-6"
                  >
                    <p className="text-sm text-gray-600 dark:text-gray-400">선택한 날짜</p>
                    <p className="font-medium dark:text-white">{formatDateDisplay(selectedDate)}</p>
                  </motion.div>
                )}
                
                <button 
                  className={`w-full py-3.5 rounded-lg font-medium transition-all ${
                    selectedDate
                      ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
                  }`}
                  onClick={() => selectedDate && setCurrentStep(2)}
                  disabled={!selectedDate}
                >
                  다음
                </button>
              </div>
            </motion.div>
          )}

          {/* 2단계: 기기 선택 */}
          {currentStep === 2 && (
            <motion.div {...pageAnimation} key="step2">
              <div className="bg-white dark:bg-gray-900 rounded-2xl p-6">
                <h2 className="text-lg font-semibold mb-6 dark:text-white">게임기 선택</h2>
                
                <div className="space-y-3">
                  {devices.map((device, index) => (
                    <motion.button
                      key={device.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => setSelectedDevice(device.id)}
                      className={`w-full p-4 rounded-lg border text-left transition-all ${
                        selectedDevice === device.id
                          ? 'border-gray-900 dark:border-white bg-gray-50 dark:bg-gray-800'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="font-medium dark:text-white">{device.name}</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                            {device.type === 'rhythm' ? '리듬게임' : '격투게임'}
                            {device.supports2P && ' · 2인 가능'}
                          </p>
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                          selectedDevice === device.id
                            ? 'border-gray-900 dark:border-white bg-gray-900 dark:bg-white'
                            : 'border-gray-300 dark:border-gray-600'
                        }`}>
                          {selectedDevice === device.id && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="w-2 h-2 bg-white dark:bg-gray-900 rounded-full"
                            />
                          )}
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>
                
                <div className="flex gap-3 mt-6">
                  <button 
                    className="px-4 py-3.5 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    onClick={() => setCurrentStep(1)}
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button 
                    className={`flex-1 py-3.5 rounded-lg font-medium transition-all ${
                      selectedDevice
                        ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
                    }`}
                    onClick={() => selectedDevice && setCurrentStep(3)}
                    disabled={!selectedDevice}
                  >
                    다음
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* 3단계: 시간대 선택 */}
          {currentStep === 3 && (
            <motion.div {...pageAnimation} key="step3">
              <div className="bg-white dark:bg-gray-900 rounded-2xl p-6">
                <h2 className="text-lg font-semibold mb-6 dark:text-white">시간 선택</h2>
                
                <div className="space-y-6">
                  {/* 조기대여 */}
                  {timeSlots.filter(s => s.type === 'early').length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">조기대여</h3>
                      <div className="space-y-2">
                        {timeSlots.filter(s => s.type === 'early').map((slot, index) => (
                          <motion.button
                            key={slot.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            onClick={() => slot.available && setSelectedTimeSlot(slot.id)}
                            disabled={!slot.available}
                            className={`w-full p-4 rounded-lg border transition-all ${
                              selectedTimeSlot === slot.id
                                ? 'border-gray-900 dark:border-white bg-gray-50 dark:bg-gray-800'
                                : slot.available
                                  ? 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                  : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 opacity-50 cursor-not-allowed'
                            }`}
                          >
                            <div className="flex justify-between items-center">
                              <div className="text-left">
                                <div className="font-medium dark:text-white">{slot.time}</div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                  {slot.duration}시간
                                  {slot.teenOnly && ' · 청소년 전용'}
                                </div>
                              </div>
                              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                selectedTimeSlot === slot.id
                                  ? 'border-gray-900 dark:border-white bg-gray-900 dark:bg-white'
                                  : 'border-gray-300 dark:border-gray-600'
                              }`}>
                                {selectedTimeSlot === slot.id && (
                                  <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="w-2 h-2 bg-white dark:bg-gray-900 rounded-full"
                                  />
                                )}
                              </div>
                            </div>
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* 밤샘대여 */}
                  {timeSlots.filter(s => s.type === 'overnight').length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">밤샘대여</h3>
                      <div className="space-y-2">
                        {timeSlots.filter(s => s.type === 'overnight').map((slot, index) => (
                          <motion.button
                            key={slot.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            onClick={() => slot.available && setSelectedTimeSlot(slot.id)}
                            disabled={!slot.available}
                            className={`w-full p-4 rounded-lg border transition-all ${
                              selectedTimeSlot === slot.id
                                ? 'border-gray-900 dark:border-white bg-gray-50 dark:bg-gray-800'
                                : slot.available
                                  ? 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                  : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 opacity-50 cursor-not-allowed'
                            }`}
                          >
                            <div className="flex justify-between items-center">
                              <div className="text-left">
                                <div className="font-medium dark:text-white">{slot.time}</div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">{slot.duration}시간</div>
                              </div>
                              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                selectedTimeSlot === slot.id
                                  ? 'border-gray-900 dark:border-white bg-gray-900 dark:bg-white'
                                  : 'border-gray-300 dark:border-gray-600'
                              }`}>
                                {selectedTimeSlot === slot.id && (
                                  <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="w-2 h-2 bg-white dark:bg-gray-900 rounded-full"
                                  />
                                )}
                              </div>
                            </div>
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex gap-3 mt-6">
                  <button 
                    className="px-4 py-3.5 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    onClick={() => setCurrentStep(2)}
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button 
                    className={`flex-1 py-3.5 rounded-lg font-medium transition-all ${
                      selectedTimeSlot
                        ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
                    }`}
                    onClick={() => selectedTimeSlot && setCurrentStep(4)}
                    disabled={!selectedTimeSlot}
                  >
                    다음
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* 4단계: 기기 번호 선택 */}
          {currentStep === 4 && (
            <motion.div {...pageAnimation} key="step4">
              <div className="bg-white dark:bg-gray-900 rounded-2xl p-6">
                <h2 className="text-lg font-semibold mb-6 dark:text-white">기기 번호 선택</h2>
                
                <div className="grid grid-cols-2 gap-3">
                  {deviceNumbers.map((number, index) => (
                    <motion.button
                      key={number}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => setSelectedDeviceNumber(number)}
                      className={`p-6 rounded-lg border transition-all ${
                        selectedDeviceNumber === number
                          ? 'border-gray-900 dark:border-white bg-gray-50 dark:bg-gray-800'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                    >
                      <div className="text-lg font-medium dark:text-white">{number}</div>
                    </motion.button>
                  ))}
                </div>
                
                <div className="flex gap-3 mt-6">
                  <button 
                    className="px-4 py-3.5 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    onClick={() => setCurrentStep(3)}
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button 
                    className={`flex-1 py-3.5 rounded-lg font-medium transition-all ${
                      selectedDeviceNumber
                        ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
                    }`}
                    onClick={() => selectedDeviceNumber && setCurrentStep(5)}
                    disabled={!selectedDeviceNumber}
                  >
                    다음
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* 5단계: 인원 선택 */}
          {currentStep === 5 && (
            <motion.div {...pageAnimation} key="step5">
              <div className="bg-white dark:bg-gray-900 rounded-2xl p-6">
                <h2 className="text-lg font-semibold mb-6 dark:text-white">이용 인원</h2>
                
                {selectedDeviceInfo?.supports2P ? (
                  <div className="space-y-3">
                    <button
                      onClick={() => setIs2Player(false)}
                      className={`w-full p-4 rounded-lg border text-left transition-all ${
                        !is2Player
                          ? 'border-gray-900 dark:border-white bg-gray-50 dark:bg-gray-800'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-medium dark:text-white">1인 플레이</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                            기본 요금
                          </div>
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          !is2Player
                            ? 'border-gray-900 dark:border-white bg-gray-900 dark:bg-white'
                            : 'border-gray-300 dark:border-gray-600'
                        }`}>
                          {!is2Player && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="w-2 h-2 bg-white dark:bg-gray-900 rounded-full"
                            />
                          )}
                        </div>
                      </div>
                    </button>
                    
                    <button
                      onClick={() => setIs2Player(true)}
                      className={`w-full p-4 rounded-lg border text-left transition-all ${
                        is2Player
                          ? 'border-gray-900 dark:border-white bg-gray-50 dark:bg-gray-800'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-medium dark:text-white">2인 플레이</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                            {selectedDeviceInfo.additionalPlayerRate}배 요금
                          </div>
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          is2Player
                            ? 'border-gray-900 dark:border-white bg-gray-900 dark:bg-white'
                            : 'border-gray-300 dark:border-gray-600'
                        }`}>
                          {is2Player && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="w-2 h-2 bg-white dark:bg-gray-900 rounded-full"
                            />
                          )}
                        </div>
                      </div>
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Users className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-500 dark:text-gray-400">
                      이 게임은 1인 플레이만 가능합니다
                    </p>
                  </div>
                )}
                
                <div className="flex gap-3 mt-6">
                  <button 
                    className="px-4 py-3.5 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    onClick={() => setCurrentStep(4)}
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button 
                    className="flex-1 py-3.5 rounded-lg font-medium bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 transition-all"
                    onClick={() => setCurrentStep(6)}
                  >
                    다음
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* 6단계: 예약 확인 */}
          {currentStep === 6 && (
            <motion.div {...pageAnimation} key="step6">
              <div className="bg-white dark:bg-gray-900 rounded-2xl p-6">
                <h2 className="text-lg font-semibold mb-6 dark:text-white">예약 확인</h2>
                
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between py-3 border-b border-gray-100 dark:border-gray-800">
                    <span className="text-gray-500 dark:text-gray-400">날짜</span>
                    <span className="font-medium dark:text-white">{formatDateDisplay(selectedDate)}</span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-gray-100 dark:border-gray-800">
                    <span className="text-gray-500 dark:text-gray-400">시간</span>
                    <span className="font-medium dark:text-white">{selectedTimeSlotInfo?.time}</span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-gray-100 dark:border-gray-800">
                    <span className="text-gray-500 dark:text-gray-400">게임</span>
                    <span className="font-medium dark:text-white">{selectedDeviceInfo?.name}</span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-gray-100 dark:border-gray-800">
                    <span className="text-gray-500 dark:text-gray-400">기기</span>
                    <span className="font-medium dark:text-white">{selectedDeviceNumber}</span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-gray-100 dark:border-gray-800">
                    <span className="text-gray-500 dark:text-gray-400">인원</span>
                    <span className="font-medium dark:text-white">{is2Player ? '2명' : '1명'}</span>
                  </div>
                  <div className="flex justify-between py-4">
                    <span className="font-medium dark:text-white">총 금액</span>
                    <span className="text-xl font-bold dark:text-white">{totalPrice.toLocaleString()}원</span>
                  </div>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-6">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="w-5 h-5 mt-0.5 rounded border-gray-300 text-gray-900 focus:ring-gray-900 dark:border-gray-600 dark:focus:ring-white"
                      checked={agreed}
                      onChange={(e) => setAgreed(e.target.checked)}
                    />
                    <div className="flex-1">
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        예약 규정 및 취소 정책에 동의합니다
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowPolicy(!showPolicy)}
                        className="text-sm text-gray-500 dark:text-gray-400 underline ml-2"
                      >
                        자세히 보기
                      </button>
                    </div>
                  </label>
                  
                  {showPolicy && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400 space-y-2"
                    >
                      <p>• 예약 시간 10분 전까지 도착해주세요</p>
                      <p>• 예약 취소는 이용 2시간 전까지 가능합니다</p>
                      <p>• 노쇼(No-show) 시 다음 예약이 제한될 수 있습니다</p>
                      <p>• 게임기 파손 시 손해배상 책임이 있습니다</p>
                      <p>• 타인에게 예약을 양도할 수 없습니다</p>
                    </motion.div>
                  )}
                </div>
                
                <div className="flex gap-3">
                  <button 
                    className="px-4 py-3.5 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    onClick={() => setCurrentStep(5)}
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button 
                    className={`flex-1 py-3.5 rounded-lg font-medium transition-all ${
                      agreed
                        ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
                    }`}
                    disabled={!agreed}
                  >
                    예약하기
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}