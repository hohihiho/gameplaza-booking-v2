'use client';

import { useState, useEffect } from 'react';
import { Clock, Plus, Trash2, Users } from 'lucide-react';

interface TimeSlot {
  id?: string;
  device_type_id: string;
  slot_type: 'early' | 'overnight';
  start_time: string;
  end_time: string;
  credit_options: {
    type: 'fixed' | 'freeplay' | 'unlimited';
    price: number;
    fixed_credits?: number; // 고정크레딧인 경우 크레딧 수
  }[];
  enable_2p: boolean;
  price_2p_extra?: number;
  is_youth_time?: boolean; // 청소년 시간대 여부
}

interface Props {
  deviceTypeId: string;
  slot?: TimeSlot;
  onSave: (data: TimeSlot) => void;
  onCancel: () => void;
}

export default function TimeSlotForm({ deviceTypeId, slot, onSave, onCancel }: Props) {
  const [formData, setFormData] = useState<TimeSlot>({
    device_type_id: deviceTypeId,
    slot_type: slot?.slot_type || 'early',
    start_time: slot?.start_time || '10:00',
    end_time: slot?.end_time || '14:00',
    credit_options: slot?.credit_options || [],
    enable_2p: slot?.enable_2p || false,
    price_2p_extra: slot?.price_2p_extra || 10000,
    is_youth_time: slot?.is_youth_time || false,
    ...slot
  });

  const [newCreditType, setNewCreditType] = useState<'fixed' | 'freeplay' | 'unlimited'>('freeplay');
  const [endTimeDisplay, setEndTimeDisplay] = useState(formData.end_time);

  // 실제 시간을 표시용 시간으로 변환 (새벽 시간은 24시 이상으로 표시)
  const convertToDisplayTime = (time: string, isOvernight: boolean) => {
    if (!isOvernight) return time;
    
    const [hour, min] = time.split(':').map(Number);
    if (hour < 6) { // 새벽 0~5시는 24~29시로 표시
      return `${hour + 24}:${min.toString().padStart(2, '0')}`;
    }
    return time;
  };

  // 표시용 시간을 실제 시간으로 변환
  const convertFromDisplayTime = (displayTime: string) => {
    const [hour, min] = displayTime.split(':').map(Number);
    if (hour >= 24) {
      return `${(hour - 24).toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
    }
    return displayTime;
  };

  // 시간대 타입 변경시 기본 시간 설정
  useEffect(() => {
    if (formData.slot_type === 'overnight') {
      setFormData(prev => ({
        ...prev,
        start_time: '22:00',
        end_time: '05:00' // 실제로는 05:00 (다음날 새벽 5시)
      }));
      setEndTimeDisplay('29:00'); // 표시는 29:00
    } else {
      setFormData(prev => ({
        ...prev,
        start_time: '10:00',
        end_time: '18:00'
      }));
      setEndTimeDisplay('18:00');
    }
  }, [formData.slot_type]);

  // 시간 계산
  const calculateHours = () => {
    const [startHour, startMin] = formData.start_time.split(':').map(Number);
    let [endHour, endMin] = formData.end_time.split(':').map(Number);
    
    // 종료 시간이 시작 시간보다 작으면 다음날로 계산
    if (endHour < startHour || (endHour === startHour && endMin < startMin)) {
      endHour += 24;
    }
    
    const duration = (endHour * 60 + endMin - startHour * 60 - startMin) / 60;
    return Math.floor(duration);
  };

  // 시간대 변경시 크레딧 옵션 초기화
  useEffect(() => {
    const hours = calculateHours();
    
    // 크레딧 옵션이 없으면 기본값 추가
    if (formData.credit_options.length === 0 && hours > 0) {
      setFormData({
        ...formData,
        credit_options: [
          { type: 'fixed', price: 0, fixed_credits: 100 },
          { type: 'freeplay', price: 0 },
          { type: 'unlimited', price: 0 }
        ]
      });
    }
  }, [formData.start_time, formData.end_time]);

  // 크레딧 옵션 추가
  const addCreditOption = () => {
    const newOption = {
      type: newCreditType,
      price: 0,
      fixed_credits: newCreditType === 'fixed' ? 100 : undefined
    };
    setFormData({
      ...formData,
      credit_options: [...formData.credit_options, newOption]
    });
  };

  // 크레딧 옵션 삭제
  const removeCreditOption = (index: number) => {
    setFormData({
      ...formData,
      credit_options: formData.credit_options.filter((_, i) => i !== index)
    });
  };

  // 가격 업데이트
  const updatePrice = (optionIndex: number, price: number) => {
    const options = [...formData.credit_options];
    options[optionIndex].price = price;
    setFormData({ ...formData, credit_options: options });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const hours = calculateHours();

  // 조기대여 시간 선택 옵션 생성
  const generateEarlyTimeOptions = () => {
    const options = [];
    // 7시부터 23시까지 (영업 시간 내)
    for (let h = 7; h <= 23; h++) {
      options.push({ value: `${h.toString().padStart(2, '0')}:00`, label: `${h}:00` });
      options.push({ value: `${h.toString().padStart(2, '0')}:30`, label: `${h}:30` });
    }
    return options;
  };

  // 밤샘대여 시간 선택 옵션 생성
  const generateOvernightTimeOptions = () => {
    const options = [];
    // 7시부터 23시까지 (영업 시작부터 23시까지)
    for (let h = 7; h <= 23; h++) {
      options.push({ value: `${h.toString().padStart(2, '0')}:00`, label: `${h}:00` });
      options.push({ value: `${h.toString().padStart(2, '0')}:30`, label: `${h}:30` });
    }
    // 24시(자정)부터 29시(새벽 5시)까지
    for (let h = 0; h <= 5; h++) {
      const displayHour = h + 24;
      options.push({ value: `${h.toString().padStart(2, '0')}:00`, label: `${displayHour}:00` });
      options.push({ value: `${h.toString().padStart(2, '0')}:30`, label: `${displayHour}:30` });
    }
    return options;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-6 bg-gray-50 dark:bg-gray-800 rounded-lg">
      <h3 className="text-lg font-semibold dark:text-white">
        {slot ? '시간대 수정' : '새 시간대 추가'}
      </h3>

      {/* 시간대 타입 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          시간대 구분
        </label>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="slot_type"
              value="early"
              checked={formData.slot_type === 'early'}
              onChange={(e) => setFormData({ ...formData, slot_type: 'early' })}
              className="text-blue-600"
            />
            <span className="text-sm dark:text-white">조기 대여</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="slot_type"
              value="overnight"
              checked={formData.slot_type === 'overnight'}
              onChange={(e) => setFormData({ ...formData, slot_type: 'overnight' })}
              className="text-blue-600"
            />
            <span className="text-sm dark:text-white">밤샘 대여</span>
          </label>
        </div>
      </div>


      {/* 시간 설정 */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            시작 시간
          </label>
          <select
            value={formData.start_time}
            onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            required
          >
            {formData.slot_type === 'early' ? (
              // 조기대여: 7시부터 20시까지 선택 가능
              generateEarlyTimeOptions().filter(opt => {
                const hour = parseInt(opt.value.split(':')[0]);
                return hour >= 7 && hour <= 20;
              }).map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))
            ) : (
              // 밤샘대여: 20시부터 새벽 2시까지만 시작 가능
              generateOvernightTimeOptions().filter(opt => {
                const hour = parseInt(opt.value.split(':')[0]);
                return hour >= 20 || hour <= 2;
              }).map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))
            )}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            종료 시간
          </label>
          <select
            value={formData.end_time}
            onChange={(e) => {
              const actualTime = e.target.value;
              setFormData({ ...formData, end_time: actualTime });
              // 밤샘대여의 경우 표시용 시간 업데이트
              if (formData.slot_type === 'overnight') {
                const [hour] = actualTime.split(':').map(Number);
                if (hour <= 5) {
                  setEndTimeDisplay(convertToDisplayTime(actualTime, true));
                } else {
                  setEndTimeDisplay(actualTime);
                }
              }
            }}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            required
          >
            {formData.slot_type === 'early' ? (
              // 조기대여: 시작 시간 이후부터 23시까지 선택 가능
              generateEarlyTimeOptions().filter(opt => {
                const hour = parseInt(opt.value.split(':')[0]);
                const [startHour, startMin] = formData.start_time.split(':').map(Number);
                const [optHour, optMin] = opt.value.split(':').map(Number);
                // 시작 시간 이후만 선택 가능
                if (hour > startHour || (hour === startHour && optMin > startMin)) {
                  return hour <= 23;
                }
                return false;
              }).map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))
            ) : (
              // 밤샘대여: 기존 로직 유지
              generateOvernightTimeOptions().filter(opt => {
                const hour = parseInt(opt.value.split(':')[0]);
                const startHour = parseInt(formData.start_time.split(':')[0]);
                // 시작 시간 이후부터 29시(새벽 5시)까지만 선택 가능
                if (startHour >= 20) {
                  // 20시 이후 시작인 경우, 다음날 새벽까지 가능
                  return hour <= 5 || hour > startHour;
                } else {
                  // 새벽 시작인 경우, 같은 날 새벽 5시까지만
                  return hour > startHour && hour <= 5;
                }
              }).map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))
            )}
          </select>
        </div>
      </div>
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          대여 시간: <span className="font-semibold">{hours}시간</span>
          {hours > 0 && (
            <span className="ml-2 text-xs">
              ({formData.slot_type === 'overnight' 
                ? `${parseInt(formData.start_time)}~${parseInt(endTimeDisplay)}` 
                : `${parseInt(formData.start_time)}~${parseInt(formData.end_time)}`})
            </span>
          )}
        </p>
      </div>

      {/* 크레딧 옵션별 가격 */}
      {hours > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium dark:text-white">
              {hours}시간 대여 가격 설정
            </h4>
            {formData.credit_options.filter(opt => 
              opt.type === newCreditType
            ).length === 0 && (
              <div className="flex items-center gap-2">
                <select
                  value={newCreditType}
                  onChange={(e) => setNewCreditType(e.target.value as any)}
                  className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                >
                  {!formData.credit_options.find(opt => opt.type === 'fixed') && 
                    <option value="fixed">고정크레딧</option>}
                  {!formData.credit_options.find(opt => opt.type === 'freeplay') && 
                    <option value="freeplay">프리플레이</option>}
                  {!formData.credit_options.find(opt => opt.type === 'unlimited') && 
                    <option value="unlimited">무한크레딧</option>}
                </select>
                <button
                  type="button"
                  onClick={addCreditOption}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
                >
                  추가
                </button>
              </div>
            )}
          </div>

          {formData.credit_options.map((option, optionIndex) => (
            <div key={optionIndex} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <h5 className="font-medium dark:text-white">
                    {option.type === 'fixed' ? '고정크레딧' : 
                     option.type === 'freeplay' ? '프리플레이' : '무한크레딧'}
                  </h5>
                  {option.type === 'fixed' && (
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={option.fixed_credits || 100}
                        onChange={(e) => {
                          const options = [...formData.credit_options];
                          options[optionIndex].fixed_credits = Number(e.target.value);
                          setFormData({ ...formData, credit_options: options });
                        }}
                        className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                      />
                      <span className="text-sm text-gray-600 dark:text-gray-400">크레딧</span>
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => removeCreditOption(optionIndex)}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                >
                  <Trash2 className="w-4 h-4 text-red-600" />
                </button>
              </div>

              <div>
                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">
                  {hours}시간 대여 가격
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={option.price || ''}
                    onChange={(e) => updatePrice(optionIndex, Number(e.target.value))}
                    className="w-32 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="가격"
                    required
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-400">원</span>
                </div>
              </div>
            </div>
          ))}

          {formData.credit_options.length === 0 && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
              크레딧 옵션을 추가해주세요
            </div>
          )}
        </div>
      )}

      {hours === 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            ⚠️ 시간을 설정해주세요. 시작 시간과 종료 시간이 같으면 가격을 설정할 수 없습니다.
          </p>
        </div>
      )}

      {/* 2인 플레이 설정 */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.enable_2p}
            onChange={(e) => setFormData({ ...formData, enable_2p: e.target.checked })}
            className="w-4 h-4 text-blue-600 rounded"
          />
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            <span className="font-medium dark:text-white">2인 플레이 가능</span>
          </div>
        </label>
        
        {formData.enable_2p && (
          <div className="mt-3 ml-7">
            <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">
              2인 플레이 추가 요금
            </label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">+</span>
              <input
                type="number"
                min="0"
                step="1000"
                value={formData.price_2p_extra}
                onChange={(e) => setFormData({ ...formData, price_2p_extra: Number(e.target.value) })}
                className="w-32 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <span className="text-sm text-gray-600 dark:text-gray-400">원</span>
            </div>
          </div>
        )}
        
        {/* 청소년 시간대 설정 */}
        <label className="flex items-center gap-3 cursor-pointer pt-3 border-t border-gray-200 dark:border-gray-700">
          <input
            type="checkbox"
            checked={formData.is_youth_time}
            onChange={(e) => setFormData({ ...formData, is_youth_time: e.target.checked })}
            className="w-4 h-4 text-blue-600 rounded"
          />
          <div className="flex items-center gap-2">
            <span className="font-medium dark:text-white">청소년 시간대</span>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              (청소년 이용 가능 시간)
            </span>
          </div>
        </label>
      </div>

      {/* 버튼 */}
      <div className="flex justify-end gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          취소
        </button>
        <button
          type="submit"
          disabled={hours === 0 || formData.credit_options.length === 0}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          저장
        </button>
      </div>
    </form>
  );
}