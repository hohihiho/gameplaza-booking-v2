'use client';

import { useState, useEffect } from 'react';
import { Clock, RotateCcw, Calendar } from 'lucide-react';

export default function TimeControlPage() {
  const [mockDate, setMockDate] = useState<string>('');
  const [isEnabled, setIsEnabled] = useState(false);

  useEffect(() => {
    // 로컬 스토리지에서 모킹 설정 복원
    const savedMockDate = localStorage.getItem('MOCK_DATE');
    if (savedMockDate) {
      setMockDate(savedMockDate);
      setIsEnabled(true);
    }
  }, []);

  const handleToggle = () => {
    if (!isEnabled) {
      // 모킹 활성화
      const dateToMock = mockDate || new Date().toISOString();
      localStorage.setItem('MOCK_DATE', dateToMock);
      setIsEnabled(true);
    } else {
      // 모킹 비활성화
      localStorage.removeItem('MOCK_DATE');
      setIsEnabled(false);
    }
    // 페이지 새로고침으로 적용
    window.location.reload();
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMockDate(e.target.value);
  };

  const quickSetDate = (days: number) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    const localDateTime = date.toISOString().slice(0, 16);
    setMockDate(localDateTime);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="flex items-center gap-3 mb-6">
            <Clock className="w-8 h-8 text-blue-500" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              시간 제어 도구 (개발용)
            </h1>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              ⚠️ 이 도구는 개발 환경에서만 사용하세요. 
              실제 운영 환경에서는 작동하지 않습니다.
            </p>
          </div>

          <div className="space-y-6">
            {/* 현재 시간 표시 */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                현재 시간
              </h3>
              <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3">
                <p className="text-lg font-mono text-gray-900 dark:text-white">
                  {new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}
                </p>
              </div>
            </div>

            {/* 모킹할 날짜 선택 */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                모킹할 날짜/시간
              </h3>
              <input
                type="datetime-local"
                value={mockDate}
                onChange={handleDateChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                         focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* 빠른 설정 버튼 */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                빠른 설정
              </h3>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => quickSetDate(1)}
                  className="px-3 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg text-sm
                           hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  내일
                </button>
                <button
                  onClick={() => quickSetDate(7)}
                  className="px-3 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg text-sm
                           hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  1주 후
                </button>
                <button
                  onClick={() => quickSetDate(14)}
                  className="px-3 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg text-sm
                           hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  2주 후
                </button>
                <button
                  onClick={() => quickSetDate(21)}
                  className="px-3 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg text-sm
                           hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  3주 후
                </button>
                <button
                  onClick={() => quickSetDate(22)}
                  className="px-3 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg text-sm
                           hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  3주 초과
                </button>
                <button
                  onClick={() => setMockDate(new Date().toISOString().slice(0, 16))}
                  className="px-3 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg text-sm
                           hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  현재
                </button>
              </div>
            </div>

            {/* 활성화 버튼 */}
            <div className="flex gap-3">
              <button
                onClick={handleToggle}
                className={`flex-1 px-4 py-3 rounded-lg font-medium transition-colors
                  ${isEnabled 
                    ? 'bg-red-500 hover:bg-red-600 text-white' 
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                  }`}
              >
                {isEnabled ? '시간 모킹 비활성화' : '시간 모킹 활성화'}
              </button>
              {isEnabled && (
                <button
                  onClick={() => {
                    localStorage.removeItem('MOCK_DATE');
                    window.location.reload();
                  }}
                  className="px-4 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg
                           font-medium transition-colors flex items-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  초기화
                </button>
              )}
            </div>

            {/* 현재 상태 */}
            {isEnabled && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  ✅ 시간 모킹이 활성화되었습니다.
                  <br />
                  모킹된 시간: {new Date(localStorage.getItem('MOCK_DATE') || '').toLocaleString('ko-KR')}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* 사용 방법 */}
        <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            사용 방법
          </h2>
          <ol className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <li>1. 원하는 날짜와 시간을 선택하거나 빠른 설정 버튼을 사용합니다.</li>
            <li>2. "시간 모킹 활성화" 버튼을 클릭합니다.</li>
            <li>3. 페이지가 새로고침되고 선택한 시간이 적용됩니다.</li>
            <li>4. 테스트가 끝나면 "시간 모킹 비활성화"를 클릭하여 원래대로 돌아갑니다.</li>
          </ol>
          <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              참고: 이 설정은 브라우저의 로컬 스토리지에 저장되며, 
              각 브라우저마다 독립적으로 작동합니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}