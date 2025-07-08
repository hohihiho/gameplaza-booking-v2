'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import { Trophy, Calendar, Users, Shield, ArrowRight, Sparkles } from 'lucide-react';
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
      icon: Trophy,
      title: '최신 기기 보유',
      description: '사운드볼텍스, 마이마이, 츄니즘 등\n다양한 최신 리듬게임 보유 및 업데이트'
    },
    {
      icon: Calendar,
      title: '편리한 예약 시스템',
      description: '원하는 시간에 기기를 미리 예약하세요'
    },
    {
      icon: Users,
      title: '활발한 커뮤니티',
      description: '함께 즐기는 리듬게임 문화'
    },
    {
      icon: Shield,
      title: '최상의 기체 상태',
      description: '정기적인 점검과 즉각적인 보수로 항상 최고의 컨디션 유지'
    }
  ];

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center px-5 py-6">
      <div className="w-full max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-6"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mb-3"
          >
            <Sparkles className="w-7 h-7 text-white" />
          </motion.div>
          
          <h1 className="text-2xl font-bold mb-2 dark:text-white">
            환영합니다{nickname && `, ${nickname}님`}!
          </h1>
          
          <p className="text-base text-gray-600 dark:text-gray-400">
            광주 게임플라자의<br />
            새로운 멤버가 되신 것을 환영합니다!
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
              className="bg-white dark:bg-gray-900 rounded-xl p-5 border border-gray-200 dark:border-gray-800 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start gap-4">
                <div className="p-2.5 bg-gray-100 dark:bg-gray-800 rounded-lg flex-shrink-0">
                  <feature.icon className="w-5 h-5 text-gray-900 dark:text-white" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1 text-sm dark:text-white">
                    {feature.title}
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400 whitespace-pre-line leading-relaxed">
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
          className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-6 text-white text-center"
        >
          <h2 className="text-xl font-bold mb-4">
            이제 시작해볼까요? 🎮
          </h2>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => router.push('/')}
            className="group relative inline-flex items-center gap-3 px-10 py-4 rounded-full font-bold text-base transition-all duration-300 overflow-hidden bg-white dark:bg-gray-900 text-gray-900 dark:text-white border-2 border-transparent"
          >
            {/* 움직이는 보더 애니메이션 */}
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{
                background: "linear-gradient(90deg, #6366f1 0%, #ec4899 25%, #06b6d4 50%, #6366f1 100%)",
                backgroundSize: "200% 100%",
                padding: "2px",
              }}
              animate={{
                backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "linear"
              }}
            >
              <div className="absolute inset-[2px] rounded-full bg-white dark:bg-gray-900" />
            </motion.div>
            
            {/* 글로우 효과 */}
            <motion.div
              className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              style={{
                background: "radial-gradient(circle at center, rgba(99, 102, 241, 0.15) 0%, transparent 70%)",
                filter: "blur(20px)",
              }}
            />
            
            {/* 반짝이는 별 효과 */}
            <motion.div className="absolute inset-0 rounded-full">
              {[...Array(3)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-1 h-1 bg-white rounded-full"
                  style={{
                    top: `${20 + i * 25}%`,
                    left: `${10 + i * 30}%`,
                  }}
                  animate={{
                    opacity: [0, 1, 0],
                    scale: [0, 1.5, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: i * 0.4,
                    ease: "easeInOut"
                  }}
                />
              ))}
            </motion.div>
            
            <span className="relative z-10 font-semibold">시작하기</span>
            <motion.div 
              className="relative z-10"
              animate={{ x: [0, 3, 0] }}
              transition={{ 
                duration: 1.5, 
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <ArrowRight className="w-5 h-5" />
            </motion.div>
          </motion.button>
        </motion.div>

      </div>
    </main>
  );
}