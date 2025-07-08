'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import { Gamepad2, Clock, Users, Trophy, ArrowRight, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function WelcomePage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [nickname, setNickname] = useState<string>('');

  useEffect(() => {
    // 축하 효과
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }

    const interval: any = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
      });
    }, 250);

    // 사용자 정보 가져오기
    const fetchUserInfo = async () => {
      try {
        const response = await fetch('/api/auth/profile');
        const data = await response.json();
        if (data.profile?.nickname) {
          setNickname(data.profile.nickname);
        }
      } catch (error) {
        console.error('프로필 조회 오류:', error);
      }
    };

    if (session?.user) {
      fetchUserInfo();
    }

    return () => clearInterval(interval);
  }, [session]);

  const features = [
    {
      icon: Gamepad2,
      title: '다양한 게임기',
      description: '최신 콘솔부터 레트로 게임기까지'
    },
    {
      icon: Clock,
      title: '편리한 예약',
      description: '원하는 시간에 미리 예약하고 방문'
    },
    {
      icon: Users,
      title: '함께하는 즐거움',
      description: '친구들과 멀티플레이 게임 즐기기'
    },
    {
      icon: Trophy,
      title: '특별한 혜택',
      description: '단골 고객을 위한 다양한 이벤트'
    }
  ];

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950 py-12 px-5">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mb-6"
          >
            <Sparkles className="w-10 h-10 text-white" />
          </motion.div>
          
          <h1 className="text-4xl font-bold mb-4 dark:text-white">
            환영합니다{nickname && `, ${nickname}님`}! 🎮
          </h1>
          
          <p className="text-xl text-gray-600 dark:text-gray-400">
            게임플라자 광주점의 새로운 멤버가 되신 것을 축하합니다!
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
              className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                  <feature.icon className="w-6 h-6 text-gray-900 dark:text-white" />
                </div>
                <div>
                  <h3 className="font-semibold mb-2 dark:text-white">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {feature.description}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-8 text-white text-center"
        >
          <h2 className="text-2xl font-bold mb-4">
            첫 예약 특별 혜택 🎁
          </h2>
          <p className="mb-6 text-blue-100">
            지금 바로 첫 예약을 하시고 특별 할인을 받아보세요!
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push('/reservations/new')}
            className="inline-flex items-center gap-2 bg-white text-gray-900 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
          >
            예약하러 가기
            <ArrowRight className="w-5 h-5" />
          </motion.button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-12 text-center"
        >
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            나중에 예약하시겠다면
          </p>
          <button
            onClick={() => router.push('/')}
            className="text-gray-900 dark:text-white hover:underline"
          >
            홈으로 이동
          </button>
        </motion.div>
      </div>
    </main>
  );
}