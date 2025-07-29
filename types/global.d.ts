// Toast 전역 타입 정의
interface ToastFunction {
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  warning: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
}

declare global {
  interface Window {
    toast: ToastFunction;
  }
}

export {};