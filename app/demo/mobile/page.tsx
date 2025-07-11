'use client';

import { useState } from 'react';
import { 
  BottomSheet, 
  PullToRefresh, 
  SwipeableCard, 
  TouchRipple, 
  SkeletonList 
} from '@/app/components/mobile';
import { Trash2, Archive } from 'lucide-react';

export default function MobileComponentsDemo() {
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [cards, setCards] = useState([
    { id: 1, title: '카드 1', description: '왼쪽으로 스와이프하여 삭제' },
    { id: 2, title: '카드 2', description: '오른쪽으로 스와이프하여 보관' },
    { id: 3, title: '카드 3', description: '양방향 스와이프 가능' }
  ]);

  const handleRefresh = async () => {
    setRefreshing(true);
    // 실제 데이터 로딩 시뮬레이션
    await new Promise(resolve => setTimeout(resolve, 2000));
    setRefreshing(false);
    
    // Toast 메시지 표시
    if (typeof window !== 'undefined' && (window as any).toast) {
      (window as any).toast.success('새로고침 완료', '최신 데이터를 불러왔습니다');
    }
  };

  const handleDeleteCard = (id: number) => {
    setCards(prev => prev.filter(card => card.id !== id));
    if (typeof window !== 'undefined' && (window as any).toast) {
      (window as any).toast.error('삭제됨', '카드가 삭제되었습니다');
    }
  };

  const handleArchiveCard = () => {
    if (typeof window !== 'undefined' && (window as any).toast) {
      (window as any).toast.info('보관됨', '카드가 보관되었습니다');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <PullToRefresh onRefresh={handleRefresh} className="min-h-screen">
        <div className="p-5 pb-20">
          <h1 className="text-2xl font-bold mb-6 dark:text-white">모바일 컴포넌트 데모</h1>
          
          {/* TouchRipple 데모 */}
          <section className="mb-8">
            <h2 className="text-lg font-semibold mb-4 dark:text-white">TouchRipple 효과</h2>
            <div className="grid grid-cols-2 gap-3">
              <TouchRipple>
                <button className="w-full p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 touch-target">
                  <span className="dark:text-white">기본 리플</span>
                </button>
              </TouchRipple>
              <TouchRipple color="rgba(59, 130, 246, 0.3)">
                <button className="w-full p-4 bg-indigo-500 text-white rounded-xl touch-target">
                  컬러 리플
                </button>
              </TouchRipple>
            </div>
          </section>

          {/* BottomSheet 데모 */}
          <section className="mb-8">
            <h2 className="text-lg font-semibold mb-4 dark:text-white">BottomSheet</h2>
            <TouchRipple>
              <button
                onClick={() => setIsBottomSheetOpen(true)}
                className="w-full p-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-medium touch-target haptic-medium"
              >
                바텀시트 열기
              </button>
            </TouchRipple>
          </section>

          {/* SwipeableCard 데모 */}
          <section className="mb-8">
            <h2 className="text-lg font-semibold mb-4 dark:text-white">SwipeableCard</h2>
            <div className="space-y-3">
              {cards.map(card => (
                <SwipeableCard
                  key={card.id}
                  leftAction={{
                    icon: <Archive className="w-5 h-5" />,
                    label: '보관',
                    color: 'bg-blue-500',
                    action: () => handleArchiveCard()
                  }}
                  rightAction={{
                    icon: <Trash2 className="w-5 h-5" />,
                    label: '삭제',
                    color: 'bg-red-500',
                    action: () => handleDeleteCard(card.id)
                  }}
                >
                  <div className="p-5 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                    <h3 className="font-medium dark:text-white">{card.title}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {card.description}
                    </p>
                  </div>
                </SwipeableCard>
              ))}
            </div>
          </section>

          {/* Skeleton 데모 */}
          <section>
            <h2 className="text-lg font-semibold mb-4 dark:text-white">Skeleton Loader</h2>
            {refreshing ? (
              <SkeletonList items={3} />
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                위로 당겨서 스켈레톤 로더를 확인하세요
              </div>
            )}
          </section>
        </div>
      </PullToRefresh>

      {/* BottomSheet */}
      <BottomSheet
        isOpen={isBottomSheetOpen}
        onClose={() => setIsBottomSheetOpen(false)}
        title="바텀시트 예제"
        snapPoints={[0.3, 0.7, 1]}
        defaultSnapPoint={1}
      >
        <div className="p-5 space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            위아래로 드래그하여 높이를 조절할 수 있습니다.
          </p>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <TouchRipple key={i}>
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                  <h4 className="font-medium dark:text-white">항목 {i}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    터치하면 리플 효과가 나타납니다
                  </p>
                </div>
              </TouchRipple>
            ))}
          </div>
        </div>
      </BottomSheet>
    </div>
  );
}