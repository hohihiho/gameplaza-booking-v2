'use client';

import { Clock, Edit, Moon, Sun, Trash2, Users } from 'lucide-react';

interface TimeSlot {
  id?: string;
  device_type_id: string;
  slot_type: 'early' | 'overnight';
  start_time: string;
  end_time: string;
  credit_options: {
    type: 'fixed' | 'freeplay' | 'unlimited';
    price: number;
    fixed_credits?: number;
  }[];
  enable_2p: boolean;
  price_2p_extra?: number;
  is_youth_time?: boolean;
}

interface Props {
  slot: TimeSlot;
  onEdit: () => void;
  onDelete: () => void;
}

export default function TimeSlotDisplay({ slot, onEdit, onDelete }: Props) {
  // 시간 계산
  const calculateHours = () => {
    const [startHour, startMin] = slot.start_time.split(':').map(Number);
    let [endHour, endMin] = slot.end_time.split(':').map(Number);
    
    if (endHour < startHour || (endHour === startHour && endMin < startMin)) {
      endHour += 24;
    }
    
    const duration = (endHour * 60 + endMin - startHour * 60 - startMin) / 60;
    return Math.floor(duration);
  };

  // 시간 표시 변환 (밤샘대여의 경우 24시 이상으로 표시)
  const formatDisplayTime = (time: string, isEnd: boolean = false) => {
    const [hour, min] = time.split(':').map(Number);
    
    // 밤샘대여인 경우
    if (slot.slot_type === 'overnight') {
      // 새벽 시간(0~5시)은 24시 이상으로 표시
      if (hour < 6) {
        return hour + 24;
      }
    }
    
    return hour;
  };

  const hours = calculateHours();
  const displayStartTime = formatDisplayTime(slot.start_time, false);
  const displayEndTime = formatDisplayTime(slot.end_time, true);

  return (
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <div className="flex items-center gap-4 mb-3">
          {slot.slot_type === 'early' ? (
            <Sun className="w-5 h-5 text-yellow-600" />
          ) : (
            <Moon className="w-5 h-5 text-indigo-600" />
          )}
          <span className="text-lg font-medium dark:text-white">
            {displayStartTime}~{displayEndTime}
          </span>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {slot.slot_type === 'early' ? '조기 대여' : '밤샘 대여'} ({hours}시간)
          </span>
          {slot.is_youth_time && (
            <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs rounded-full">
              청소년 가능
            </span>
          )}
        </div>

        <div className="space-y-2">
          {(slot.credit_options || []).map((option, idx) => (
            <div key={idx} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium dark:text-white">
                  {option.type === 'fixed' ? `고정크레딧 (${option.fixed_credits || 100}크레딧)` : 
                   option.type === 'freeplay' ? '프리플레이' : '무한크레딧'}
                </span>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-600 dark:text-gray-400">{hours}시간</p>
                <p className="text-sm font-semibold dark:text-white">
                  ₩{option.price?.toLocaleString() || '0'}
                </p>
              </div>
            </div>
          ))}

          {slot.enable_2p && (
            <div className="mt-3 flex items-center gap-2 text-sm">
              <Users className="w-4 h-4 text-blue-600" />
              <span className="text-gray-700 dark:text-gray-300">
                2인 플레이 가능 (+₩{slot.price_2p_extra?.toLocaleString() || '0'})
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-2 ml-4">
        <button
          onClick={onEdit}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <Edit className="w-4 h-4 text-gray-600 dark:text-gray-400" />
        </button>
        <button
          onClick={onDelete}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <Trash2 className="w-4 h-4 text-gray-600 dark:text-gray-400" />
        </button>
      </div>
    </div>
  );
}