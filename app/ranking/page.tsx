'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Trophy, Medal, Award, Star, Calendar, Gamepad2, Music, Target, Piano, Volume2, Disc3, Clock, Info } from 'lucide-react';
import { motion } from 'framer-motion';
import UserTierBadge, { UserTier } from '../components/UserTierBadge';

// 게임별 랭킹 데이터 타입
interface RankingEntry {
  rank: number;
  playerName: string;
  score: number;
  date: string;
  device?: string;
  userTier?: UserTier;
  totalPoints?: number;
}

interface GameRanking {
  gameId: string;
  gameName: string;
  icon: string;
  rankings: RankingEntry[];
}

// 시간대별 랭킹 타입
type TimeFilter = 'daily' | 'weekly' | 'monthly' | 'all';

// 게임 아이콘 컴포넌트
const GameIcon = ({ gameId, className = "w-5 h-5" }: { gameId: string; className?: string }) => {
  switch (gameId) {
    case 'all':
      return <Trophy className={className} />;
    case 'maimai':
      return <Target className={className} />;
    case 'chunithm':
      return <Piano className={className} />;
    case 'sound_voltex_valkyrie':
      return <Volume2 className={className} />;
    case 'beatmania_lightning':
      return <Disc3 className={className} />;
    default:
      return <Gamepad2 className={className} />;
  }
};

export default function RankingPage() {
  // 현재 날짜에서 월별 선택지 생성 (최근 6개월)
  const generateMonthFilters = () => {
    const filters = [];
    const now = new Date();

    for (let i = 0; i < 6; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');

      filters.push({
        id: `${year}-${month}`,
        name: `${year}-${month}`,
        description: `${year}.${month}`
      });
    }

    return filters;
  };

  const monthFilters = generateMonthFilters();

  const [selectedGame, setSelectedGame] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>(monthFilters[0].id);
  const [loading, setLoading] = useState(true);
  const [rankings, setRankings] = useState<GameRanking[]>([]);

  // 게임 목록 - 대여 가능한 리듬게임만
  const games = [
    { id: 'all', name: '전체' },
    { id: 'maimai', name: '마이마이' },
    { id: 'chunithm', name: '츄니즘' },
    { id: 'sound_voltex_valkyrie', name: '사운드볼텍스 발키리' },
    { id: 'beatmania_lightning', name: '비트매니아 라이트닝' },
  ];

  // 목업 데이터 (실제로는 API에서 가져와야 함)
  const mockRankings: GameRanking[] = [
    {
      gameId: 'sound_voltex_valkyrie',
      gameName: '사운드볼텍스 발키리',
      icon: '',
      rankings: [
        { rank: 1, playerName: '리듬마스터', score: 9950000, date: '2024-01-15', device: 'SDVX-01', userTier: 'GAMEPLA_KING' as UserTier, totalPoints: 12500 },
        { rank: 2, playerName: '볼텍스킹', score: 9890000, date: '2024-01-14', device: 'SDVX-01', userTier: 'GAMEPLA_VIP' as UserTier, totalPoints: 7800 },
        { rank: 3, playerName: '사운드프로', score: 9850000, date: '2024-01-13', device: 'SDVX-02', userTier: 'GAMEPLA_VIP' as UserTier, totalPoints: 6200 },
        { rank: 4, playerName: '노브마스터', score: 9800000, date: '2024-01-12', device: 'SDVX-01', userTier: 'GAMEPLA_REGULAR' as UserTier, totalPoints: 3400 },
        { rank: 5, playerName: '리듬킹', score: 9750000, date: '2024-01-11', device: 'SDVX-02', userTier: 'GAMEPLA_USER' as UserTier, totalPoints: 850 },
      ]
    },
    {
      gameId: 'maimai',
      gameName: '마이마이',
      icon: '',
      rankings: [
        { rank: 1, playerName: '마이스터', score: 101.5000, date: '2024-01-15', device: 'MAIMAI-01', userTier: 'GAMEPLA_KING' as UserTier, totalPoints: 15800 },
        { rank: 2, playerName: '터치킹', score: 101.2000, date: '2024-01-14', device: 'MAIMAI-02', userTier: 'GAMEPLA_VIP' as UserTier, totalPoints: 8900 },
        { rank: 3, playerName: '퍼펙트', score: 100.9000, date: '2024-01-13', device: 'MAIMAI-01', userTier: 'GAMEPLA_REGULAR' as UserTier, totalPoints: 2100 },
        { rank: 4, playerName: '마이프로', score: 100.5000, date: '2024-01-12', device: 'MAIMAI-02', userTier: 'GAMEPLA_REGULAR' as UserTier, totalPoints: 1500 },
        { rank: 5, playerName: '써클마스터', score: 100.2000, date: '2024-01-11', device: 'MAIMAI-01', userTier: 'GAMEPLA_USER' as UserTier, totalPoints: 450 },
      ]
    }
  ];

  useEffect(() => {
    // 실제로는 API 호출
    const fetchRankings = async () => {
      setLoading(true);
      // 시뮬레이션 딜레이
      await new Promise(resolve => setTimeout(resolve, 1000));
      setRankings(mockRankings);
      setLoading(false);
    };

    fetchRankings();
  }, [selectedGame, selectedMonth]);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return (
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center">
            <div className="w-3 h-3 rounded-full bg-yellow-200"></div>
          </div>
        );
      case 2:
        return (
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-gray-300 to-gray-500 flex items-center justify-center">
            <div className="w-3 h-3 rounded-full bg-gray-100"></div>
          </div>
        );
      case 3:
        return (
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
            <div className="w-3 h-3 rounded-full bg-amber-200"></div>
          </div>
        );
      default:
        return <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-600"></div>;
    }
  };

  const getRankStyle = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white';
      case 2:
        return 'bg-gradient-to-r from-gray-300 to-gray-500 text-white';
      case 3:
        return 'bg-gradient-to-r from-amber-400 to-amber-600 text-white';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300';
    }
  };

  const formatScore = (score: number, gameId: string) => {
    if (gameId === 'maimai') {
      return `${score.toFixed(4)}%`;
    }
    return score.toLocaleString();
  };

  const getCurrentRankings = () => {
    if (selectedGame === 'all') {
      // 전체 게임의 랭킹을 합치고 정렬
      const allRankings: RankingEntry[] = [];
      rankings.forEach(gameRanking => {
        gameRanking.rankings.forEach(entry => {
          allRankings.push({
            ...entry,
            device: `${gameRanking.gameName} ${entry.device}`,
          });
        });
      });

      // 점수별로 정렬하고 순위 재배정
      return allRankings
        .sort((a, b) => b.score - a.score)
        .slice(0, 10)
        .map((entry, index) => ({ ...entry, rank: index + 1 }));
    }

    const gameRanking = rankings.find(r => r.gameId === selectedGame);
    return gameRanking?.rankings || [];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* 헤더 */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 mb-8"
        >
          <Link
            href="/"
            className="p-2 rounded-xl bg-white dark:bg-gray-800 shadow-md hover:shadow-lg transition-all duration-200 touch-target"
          >
            <ArrowLeft className="w-6 h-6 text-gray-600 dark:text-gray-300" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Trophy className="w-8 h-8 text-yellow-500" />
              게임 랭킹
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              최고 실력자들의 기록을 확인해보세요
            </p>
          </div>
        </motion.div>

        {/* 필터 컨트롤 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg mb-8"
        >
          {/* 게임 선택 */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <Gamepad2 className="w-5 h-5" />
              게임 선택
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {games.map((game) => (
                <button
                  key={game.id}
                  onClick={() => setSelectedGame(game.id)}
                  className={`
                    p-3 rounded-xl font-medium transition-colors duration-200 touch-target
                    ${selectedGame === game.id
                      ? 'bg-blue-500 text-white shadow-lg'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }
                  `}
                >
                  <div className="flex flex-col items-center gap-1">
                    <GameIcon gameId={game.id} className="w-5 h-5" />
                    <div className="text-xs">{game.name}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* 월 단위 기간 선택 */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              기간 선택
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {monthFilters.map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setSelectedMonth(filter.id)}
                  className={`
                    p-3 rounded-xl font-medium transition-colors duration-200 touch-target text-center
                    ${selectedMonth === filter.id
                      ? 'bg-purple-500 text-white shadow-lg'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }
                  `}
                >
                  <div className="font-semibold text-sm">{filter.name}</div>
                  <div className="text-xs opacity-80">{filter.description}</div>
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* 랭킹 리스트 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden"
        >
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {selectedGame === 'all' ? '전체 게임' : games.find(g => g.id === selectedGame)?.name} 랭킹
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
              {selectedMonth} 기준
            </p>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">랭킹을 불러오는 중...</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {getCurrentRankings().map((entry, index) => (
                <motion.div
                  key={`${entry.playerName}-${entry.rank}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200"
                >
                  <div className="flex items-center gap-4">
                    {/* 순위 */}
                    <div className={`
                      w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg flex-shrink-0
                      ${getRankStyle(entry.rank)}
                    `}>
                      {entry.rank <= 3 ? getRankIcon(entry.rank) : entry.rank}
                    </div>

                    {/* 플레이어 정보 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {entry.userTier && (
                          <UserTierBadge tier={entry.userTier} size="sm" />
                        )}
                        <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                          {entry.playerName}
                        </h3>
                        {entry.rank <= 3 && (
                          <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 rounded-lg text-xs font-medium">
                            TOP {entry.rank}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                        <span>{entry.device}</span>
                        <span>{entry.date}</span>
                        {entry.totalPoints && (
                          <span className="text-xs">총 {entry.totalPoints.toLocaleString()}P</span>
                        )}
                      </div>
                    </div>

                    {/* 점수 */}
                    <div className="text-right">
                      <div className="text-xl font-bold text-gray-900 dark:text-white">
                        {formatScore(entry.score, selectedGame)}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        점수
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}

              {getCurrentRankings().length === 0 && (
                <div className="p-8 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-gray-200 to-gray-400 dark:from-gray-600 dark:to-gray-800 flex items-center justify-center">
                    <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700"></div>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400">
                    아직 랭킹 데이터가 없습니다.
                  </p>
                  <p className="text-gray-500 dark:text-gray-500 text-sm mt-1">
                    게임을 플레이하고 첫 번째 랭커가 되어보세요!
                  </p>
                </div>
              )}
            </div>
          )}
        </motion.div>

        {/* 하단 안내 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-8 text-center"
        >
          <p className="text-gray-600 dark:text-gray-400 text-sm flex items-center justify-center gap-2">
            <Info className="w-4 h-4" />
            랭킹은 매일 자정에 업데이트됩니다
          </p>
        </motion.div>
      </div>
    </div>
  );
}