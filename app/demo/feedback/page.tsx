'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  LoadingButton, 
  AnimatedCard, 
  FormInput, 
  SuccessAnimation, 
  CountUpNumber,
  TouchRipple
} from '@/app/components/mobile';
import { ArrowRight, Mail, Lock, User, DollarSign } from 'lucide-react';

export default function FeedbackDemoPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingDelete, setIsLoadingDelete] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [revenue] = useState(12450000);

  const handleSubmit = async () => {
    setIsLoading(true);
    // 시뮬레이션
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsLoading(false);
    setSuccessMessage('예약이 완료되었습니다!');
    setShowSuccess(true);
    
    setTimeout(() => {
      setShowSuccess(false);
    }, 3000);
  };

  const handleDelete = async () => {
    setIsLoadingDelete(true);
    // 시뮬레이션
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsLoadingDelete(false);
    
    // Toast 메시지로 삭제 알림
    if (typeof window !== 'undefined' && (window as any).toast) {
      (window as any).toast.error('삭제 완료', '항목이 삭제되었습니다');
    }
  };

  const validateEmail = (email: string) => {
    if (!email) {
      setErrors(prev => ({ ...prev, email: '이메일을 입력해주세요' }));
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setErrors(prev => ({ ...prev, email: '올바른 이메일 형식이 아닙니다' }));
    } else {
      setErrors(prev => ({ ...prev, email: '' }));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-5">
      <h1 className="text-2xl font-bold mb-8 dark:text-white">시각적 피드백 데모</h1>
      
      {/* 로딩 버튼 데모 */}
      <section className="mb-12">
        <h2 className="text-lg font-semibold mb-4 dark:text-white">로딩 버튼</h2>
        <div className="grid grid-cols-2 gap-4">
          <LoadingButton
            onClick={handleSubmit}
            isLoading={isLoading}
            variant="primary"
            icon={<ArrowRight className="w-4 h-4" />}
            loadingText="처리중"
          >
            주문하기
          </LoadingButton>
          
          <LoadingButton
            onClick={handleDelete}
            isLoading={isLoadingDelete}
            variant="danger"
            size="sm"
          >
            삭제
          </LoadingButton>
        </div>
      </section>

      {/* 애니메이션 카드 데모 */}
      <section className="mb-12">
        <h2 className="text-lg font-semibold mb-4 dark:text-white">애니메이션 카드</h2>
        <div className="space-y-4">
          {['fade', 'slide', 'scale', 'flip'].map((variant, index) => (
            <AnimatedCard 
              key={variant}
              variant={variant as any}
              delay={index * 0.1}
              className="p-6"
              glow={variant === 'scale'}
            >
              <h3 className="font-medium mb-2 dark:text-white capitalize">{variant} 애니메이션</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                호버하면 확대되고 탭하면 축소됩니다
              </p>
            </AnimatedCard>
          ))}
        </div>
      </section>

      {/* 폼 입력 데모 */}
      <section className="mb-12">
        <h2 className="text-lg font-semibold mb-4 dark:text-white">폼 입력 피드백</h2>
        <div className="space-y-4 max-w-md">
          <FormInput
            label="이메일"
            type="email"
            icon={<Mail className="w-4 h-4" />}
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            onBlur={() => validateEmail(formData.email)}
            error={errors.email}
            hint="회사 이메일을 입력해주세요"
          />
          
          <FormInput
            label="비밀번호"
            type="password"
            icon={<Lock className="w-4 h-4" />}
            value={formData.password}
            onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
            showPasswordToggle
            success={formData.password.length >= 8}
            hint={formData.password.length < 8 ? "8자 이상 입력해주세요" : "안전한 비밀번호입니다"}
          />
          
          <FormInput
            label="이름"
            icon={<User className="w-4 h-4" />}
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            success={formData.name.length > 0}
          />
        </div>
      </section>

      {/* 성공 애니메이션 */}
      {showSuccess && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="bg-white dark:bg-gray-900 p-8 rounded-3xl"
          >
            <SuccessAnimation
              size="lg"
              message={successMessage}
              onComplete={() => setShowSuccess(false)}
            />
          </motion.div>
        </div>
      )}

      {/* 카운트업 숫자 데모 */}
      <section className="mb-12">
        <h2 className="text-lg font-semibold mb-4 dark:text-white">카운트업 애니메이션</h2>
        <AnimatedCard className="p-6" variant="slide">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">오늘의 매출</p>
              <p className="text-3xl font-bold dark:text-white">
                <CountUpNumber 
                  value={revenue} 
                  duration={2}
                  prefix="₩"
                />
              </p>
            </div>
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-2xl flex items-center justify-center">
              <DollarSign className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </AnimatedCard>
      </section>

      {/* 스태거 애니메이션 리스트 */}
      <section>
        <h2 className="text-lg font-semibold mb-4 dark:text-white">스태거 애니메이션</h2>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((item) => (
            <TouchRipple key={item}>
              <div className="stagger-item p-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
                <h4 className="font-medium dark:text-white">아이템 {item}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  순차적으로 나타나는 애니메이션
                </p>
              </div>
            </TouchRipple>
          ))}
        </div>
      </section>
    </div>
  );
}