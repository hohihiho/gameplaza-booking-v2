'use client';

import { create } from 'zustand';
import Modal from '@/app/components/ui/Modal';

interface ModalState {
  isOpen: boolean;
  title?: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'confirm';
  onConfirm?: () => void;
  onClose?: () => void;
}

interface ModalStore {
  modal: ModalState | null;
  showModal: (options: Omit<ModalState, 'isOpen'>) => Promise<boolean>;
  closeModal: () => void;
}

const useModalStore = create<ModalStore>((set) => ({
  modal: null,
  showModal: (options) => {
    return new Promise((resolve) => {
      set({
        modal: {
          ...options,
          isOpen: true,
          onConfirm: () => {
            options.onConfirm?.();
            resolve(true);
            set({ modal: null });
          },
          onClose: () => {
            options.onClose?.();
            resolve(false);
            set({ modal: null });
          },
        },
      });
    });
  },
  closeModal: () => set({ modal: null }),
}));

// 간편 사용 함수들
export const modal = {
  info: (message: string, title?: string) => 
    useModalStore.getState().showModal({ message, title, type: 'info' }),
  
  success: (message: string, title?: string) => 
    useModalStore.getState().showModal({ message, title, type: 'success' }),
  
  warning: (message: string, title?: string) => 
    useModalStore.getState().showModal({ message, title, type: 'warning' }),
  
  error: (message: string, title?: string) => 
    useModalStore.getState().showModal({ message, title, type: 'error' }),
  
  confirm: (message: string, title?: string) => 
    useModalStore.getState().showModal({ message, title, type: 'confirm' }),
};

// 모달 프로바이더 컴포넌트
export function ModalProvider() {
  const modalState = useModalStore((state) => state.modal);
  const closeModal = useModalStore((state) => state.closeModal);

  if (!modalState) return null;

  return (
    <Modal
      isOpen={modalState.isOpen}
      onClose={modalState.onClose || closeModal}
      onConfirm={modalState.onConfirm}
      title={modalState.title}
      message={modalState.message}
      type={modalState.type}
    />
  );
}

export default function useModal() {
  const showModal = useModalStore((state) => state.showModal);
  const closeModal = useModalStore((state) => state.closeModal);
  
  return {
    showModal,
    closeModal,
    ...modal,
  };
}