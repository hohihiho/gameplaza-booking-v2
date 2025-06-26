// 시간대 관리 페이지
// 비전공자 설명: 관리자가 예약 가능한 시간대를 설정하는 페이지입니다
'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

type TimeSlot = {
  id: string;
  startTime: string;
  endTime: string;
  duration: number;
  type: 'early' | 'overnight';
  gameTypes: string[];
  teenOnly: boolean;
  enabled: boolean;
};

export default function AdminTimeSlotsPage() {
  const [timeSlots, setTimeSlots] = useState({
    early: [
      { id: '1', startTime: '07:00', endTime: '12:00', duration: 5, type: 'early', gameTypes: ['all'], teenOnly: false, enabled: true },
      { id: '2', startTime: '08:00', endTime: '12:00', duration: 4, type: 'early', gameTypes: ['all'], teenOnly: false, enabled: true },
      { id: '3', startTime: '09:00', endTime: '13:00', duration: 4, type: 'early', gameTypes: ['all'], teenOnly: true, enabled: true },
    ],
    overnight: [
      { id: '4', startTime: '24:00', endTime: '28:00', duration: 4, type: 'overnight', gameTypes: ['sega'], teenOnly: false, enabled: true },
      { id: '5', startTime: '24:00', endTime: '29:00', duration: 5, type: 'overnight', gameTypes: ['konami'], teenOnly: false, enabled: true },
    ],
  });

  const [editingSlot, setEditingSlot] = useState<TimeSlot | null>(null);
  const [isAddingSlot, setIsAddingSlot] = useState(false);
  const [addingType, setAddingType] = useState<'early' | 'overnight'>('early');

  const handleSaveSlot = (slot: TimeSlot) => {
    const type = slot.type;
    if (slot.id) {
      setTimeSlots({
        ...timeSlots,
        [type]: timeSlots[type].map(s => s.id === slot.id ? slot : s)
      });
    } else {
      setTimeSlots({
        ...timeSlots,
        [type]: [...timeSlots[type], { ...slot, id: Date.now().toString() }]
      });
    }
    setEditingSlot(null);
    setIsAddingSlot(false);
  };

  const handleDeleteSlot = (type: 'early' | 'overnight', id: string) => {
    setTimeSlots({
      ...timeSlots,
      [type]: timeSlots[type].filter(s => s.id !== id)
    });
  };

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-light dark:text-white">시간대 관리</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">예약 가능한 시간대를 설정합니다</p>
        </div>

        {/* 조기대여 섹션 */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium dark:text-white">🌅 조기대여</h2>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setIsAddingSlot(true);
                setAddingType('early');
              }}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition-colors"
            >
              시간대 추가
            </motion.button>
          </div>
          
          <div className="grid gap-3">
            {timeSlots.early.map((slot, index) => (
              <motion.div
                key={slot.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm ${
                  !slot.enabled && 'opacity-50'
                }`}
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-6">
                    <div>
                      <div className="font-medium dark:text-white">
                        {slot.startTime} - {slot.endTime}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {slot.duration}시간
                        {slot.teenOnly && ' • 청소년 전용'}
                      </div>
                    </div>
                    
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={slot.enabled}
                        onChange={(e) => {
                          const updated = { ...slot, enabled: e.target.checked } as TimeSlot;
                          handleSaveSlot(updated);
                        }}
                        className="w-5 h-5 text-blue-500 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-600 dark:text-gray-400">활성화</span>
                    </label>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingSlot(slot as TimeSlot)}
                      className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      수정
                    </button>
                    <button
                      onClick={() => handleDeleteSlot('early', slot.id)}
                      className="px-3 py-1 text-sm text-red-600 border border-red-200 dark:border-red-900 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      삭제
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* 밤샘대여 섹션 */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium dark:text-white">🌙 밤샘대여</h2>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setIsAddingSlot(true);
                setAddingType('overnight');
              }}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition-colors"
            >
              시간대 추가
            </motion.button>
          </div>
          
          <div className="grid gap-3">
            {timeSlots.overnight.map((slot, index) => (
              <motion.div
                key={slot.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm ${
                  !slot.enabled && 'opacity-50'
                }`}
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-6">
                    <div>
                      <div className="font-medium dark:text-white">
                        {slot.startTime} - {slot.endTime}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {slot.duration}시간 • {slot.gameTypes.join(', ')} 전용
                      </div>
                    </div>
                    
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={slot.enabled}
                        onChange={(e) => {
                          const updated = { ...slot, enabled: e.target.checked } as TimeSlot;
                          handleSaveSlot(updated);
                        }}
                        className="w-5 h-5 text-blue-500 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-600 dark:text-gray-400">활성화</span>
                    </label>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingSlot(slot as TimeSlot)}
                      className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      수정
                    </button>
                    <button
                      onClick={() => handleDeleteSlot('overnight', slot.id)}
                      className="px-3 py-1 text-sm text-red-600 border border-red-200 dark:border-red-900 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      삭제
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* 시간대 추가/수정 모달 */}
        {(editingSlot || isAddingSlot) && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-gray-900 rounded-2xl p-8 max-w-md w-full"
            >
              <h2 className="text-xl font-light mb-6 dark:text-white">
                {editingSlot ? '시간대 수정' : '시간대 추가'}
              </h2>
              
              <TimeSlotForm
                slot={editingSlot || { type: addingType }}
                onSave={handleSaveSlot}
                onCancel={() => {
                  setEditingSlot(null);
                  setIsAddingSlot(false);
                }}
              />
            </motion.div>
          </div>
        )}
      </div>
    </main>
  );
}

// 시간대 폼 컴포넌트
function TimeSlotForm({ slot, onSave, onCancel }: {
  slot: Partial<TimeSlot> & { type: 'early' | 'overnight' };
  onSave: (slot: TimeSlot) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    type: slot.type,
    startTime: slot.startTime || '07:00',
    endTime: slot.endTime || '12:00',
    duration: slot.duration || 4,
    gameTypes: slot.gameTypes || ['all'],
    teenOnly: slot.teenOnly || false,
    enabled: slot.enabled !== undefined ? slot.enabled : true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ 
      ...slot, 
      ...formData,
      id: slot.id || Date.now().toString()
    } as TimeSlot);
  };

  // 시작 시간과 종료 시간으로 duration 자동 계산
  const calculateDuration = (start: string, end: string) => {
    const [startHour = 0] = start.split(':').map(Number);
    let [endHour = 0] = end.split(':').map(Number);
    
    // 새벽 시간대 처리
    if (endHour < startHour) {
      endHour += 24;
    }
    
    return endHour - startHour;
  };

  const handleTimeChange = (field: string, value: string) => {
    const newData = { ...formData, [field]: value };
    
    if (field === 'startTime' || field === 'endTime') {
      newData.duration = calculateDuration(
        field === 'startTime' ? value : formData.startTime,
        field === 'endTime' ? value : formData.endTime
      );
    }
    
    setFormData(newData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            시작 시간
          </label>
          <input
            type="time"
            value={formData.startTime}
            onChange={(e) => handleTimeChange('startTime', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            종료 시간
          </label>
          <input
            type="time"
            value={formData.endTime}
            onChange={(e) => handleTimeChange('endTime', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          이용 시간: {formData.duration}시간
        </label>
      </div>

      {formData.type === 'overnight' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            이용 가능 게임
          </label>
          <div className="space-y-2">
            {['sega', 'konami', 'all'].map((type) => (
              <label key={type} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.gameTypes.includes(type)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setFormData({
                        ...formData,
                        gameTypes: [...formData.gameTypes, type]
                      });
                    } else {
                      setFormData({
                        ...formData,
                        gameTypes: formData.gameTypes.filter(t => t !== type)
                      });
                    }
                  }}
                  className="w-5 h-5 text-blue-500 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {type === 'sega' && '세가 게임'}
                  {type === 'konami' && '코나미 게임'}
                  {type === 'all' && '모든 게임'}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      {formData.type === 'early' && (
        <div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.teenOnly}
              onChange={(e) => setFormData({ ...formData, teenOnly: e.target.checked })}
              className="w-5 h-5 text-blue-500 rounded focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              청소년 전용
            </span>
          </label>
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-3 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          취소
        </button>
        <button
          type="submit"
          className="flex-1 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
        >
          저장
        </button>
      </div>
    </form>
  );
}