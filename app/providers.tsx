'use client'

import { BetterAuthProvider } from './components/BetterAuthProvider'
import { useEffect } from 'react'
import { ModalProvider, modal } from '@/hooks/useModal'
import { ToastProvider } from '@/hooks/useToast'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Service Worker 등록 (개발 환경에서도 테스트 가능)
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            console.log('SW registered: ', registration)
            
            // 업데이트 감지
            registration.addEventListener('updatefound', () => {
              const newWorker = registration.installing
              if (newWorker) {
                newWorker.addEventListener('statechange', async () => {
                  if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    // 새 버전이 설치되었을 때 사용자에게 알림
                    const confirmed = await modal.confirm(
                      '새로운 버전이 있습니다. 새로고침하시겠습니까?',
                      '업데이트 알림'
                    );
                    if (confirmed) {
                      window.location.reload()
                    }
                  }
                })
              }
            })
          })
          .catch((registrationError) => {
            console.log('SW registration failed: ', registrationError)
          })
      })
    }

    // PWA 설치 프롬프트 처리
    let deferredPrompt: BeforeInstallPromptEvent | null = null
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault()
      deferredPrompt = e as BeforeInstallPromptEvent
      
      // 설치 버튼 표시 (필요한 경우)
      const installButton = document.getElementById('install-pwa')
      if (installButton) {
        installButton.style.display = 'block'
        installButton.addEventListener('click', () => {
          if (deferredPrompt) {
            deferredPrompt.prompt()
            deferredPrompt.userChoice.then((choiceResult) => {
              if (choiceResult.outcome === 'accepted') {
                console.log('User accepted the PWA prompt')
              }
              deferredPrompt = null
            })
          }
        })
      }
    })
  }, [])

  return (
    <BetterAuthProvider>
      {children}
      <ModalProvider />
      <ToastProvider />
    </BetterAuthProvider>
  )
}