'use client';

import { create } from 'zustand';
import { ToastMessage, ToastContainer } from '@/app/components/ui/Toast';

interface ToastStore {
  toasts: ToastMessage[];
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
  removeToast: (id: string) => void;
}

const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  addToast: (toast) => {
    const id = Math.random().toString(36).substr(2, 9);
    set((state) => ({
      toasts: [...state.toasts, { ...toast, id }],
    }));
  },
  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },
}));

// 간편 사용 함수들
export const toast = {
  success: (message: string, title?: string, duration?: number) => 
    useToastStore.getState().addToast({ type: 'success', message, title, duration }),
  
  error: (message: string, title?: string, duration?: number) => 
    useToastStore.getState().addToast({ type: 'error', message, title, duration }),
  
  warning: (message: string, title?: string, duration?: number) => 
    useToastStore.getState().addToast({ type: 'warning', message, title, duration }),
  
  info: (message: string, title?: string, duration?: number) => 
    useToastStore.getState().addToast({ type: 'info', message, title, duration }),
};

// 토스트 프로바이더 컴포넌트
export function ToastProvider() {
  const toasts = useToastStore((state) => state.toasts);
  const removeToast = useToastStore((state) => state.removeToast);

  return <ToastContainer toasts={toasts} onClose={removeToast} />;
}

export default function useToast() {
  const addToast = useToastStore((state) => state.addToast);
  const removeToast = useToastStore((state) => state.removeToast);
  
  return {
    addToast,
    removeToast,
    ...toast,
  };
}