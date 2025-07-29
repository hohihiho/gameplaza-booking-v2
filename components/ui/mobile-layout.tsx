'use client';

import { ReactNode } from 'react';
import { ChevronLeft, Home } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useIsMobile } from './mobile-responsive';

interface MobileHeaderProps {
  title: string;
  onBack?: () => void;
  rightAction?: ReactNode;
}

export function MobileHeader({ title, onBack, rightAction }: MobileHeaderProps) {
  const router = useRouter();
  const handleBack = onBack || (() => router.back());
  
  return (
    <header className="mobile-header flex items-center justify-between h-14 px-4">
      <button
        onClick={handleBack}
        className="p-2 -ml-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      
      <h1 className="text-lg font-semibold text-center flex-1">{title}</h1>
      
      <div className="w-10 flex justify-end">
        {rightAction}
      </div>
    </header>
  );
}

interface MobileLayoutProps {
  children: ReactNode;
  header?: ReactNode;
  footer?: ReactNode;
  className?: string;
}

export function MobileLayout({ children, header, footer, className = '' }: MobileLayoutProps) {
  return (
    <div className={`mobile-full-height flex flex-col ${className}`}>
      {header}
      
      <main className="flex-1 overflow-y-auto mobile-scroll">
        {children}
      </main>
      
      {footer}
    </div>
  );
}

interface MobileBottomNavigationProps {
  items: Array<{
    icon: any;
    label: string;
    href: string;
    active?: boolean;
  }>;
}

export function MobileBottomNavigation({ items }: MobileBottomNavigationProps) {
  const router = useRouter();
  
  return (
    <nav className="mobile-nav">
      <div className="grid grid-cols-4 h-16">
        {items.map((item) => (
          <button
            key={item.href}
            onClick={() => router.push(item.href)}
            className={`mobile-nav-item ${item.active ? 'active' : ''}`}
          >
            <item.icon className="w-5 h-5 mb-1" />
            <span>{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}

interface MobileStepperProps {
  currentStep: number;
  totalSteps: number;
  onStepChange?: (step: number) => void;
}

export function MobileStepper({ currentStep, totalSteps, onStepChange }: MobileStepperProps) {
  return (
    <div className="mobile-stepper">
      <div className="flex items-center gap-2">
        {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
          <button
            key={step}
            onClick={() => onStepChange?.(step)}
            disabled={step > currentStep}
            className={`
              w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
              transition-all duration-200
              ${step === currentStep 
                ? 'bg-indigo-600 text-white' 
                : step < currentStep 
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
              }
              ${step <= currentStep && onStepChange ? 'cursor-pointer' : ''}
            `}
          >
            {step < currentStep ? '✓' : step}
          </button>
        ))}
      </div>
      
      <div className="text-sm text-gray-600 dark:text-gray-400">
        {currentStep} / {totalSteps}
      </div>
    </div>
  );
}

interface MobileTabsProps {
  tabs: Array<{
    id: string;
    label: string;
    count?: number;
  }>;
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export function MobileTabs({ tabs, activeTab, onTabChange }: MobileTabsProps) {
  return (
    <div className="mobile-tabs">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`mobile-tab ${activeTab === tab.id ? 'active' : ''}`}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span className="ml-1 text-xs">({tab.count})</span>
          )}
        </button>
      ))}
    </div>
  );
}

interface MobileActionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  actions: Array<{
    label: string;
    onClick: () => void;
    variant?: 'default' | 'primary' | 'danger';
    icon?: any;
  }>;
}

export function MobileActionSheet({ isOpen, onClose, title, actions }: MobileActionSheetProps) {
  if (!isOpen) return null;
  
  return (
    <>
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />
      
      <div className="mobile-action-sheet">
        {title && (
          <h3 className="text-lg font-semibold mb-3">{title}</h3>
        )}
        
        {actions.map((action, index) => (
          <button
            key={index}
            onClick={() => {
              action.onClick();
              onClose();
            }}
            className={`
              w-full px-4 py-3 rounded-lg font-medium text-left
              flex items-center gap-3
              transition-all duration-200
              ${action.variant === 'primary' 
                ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                : action.variant === 'danger'
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-600'
              }
            `}
          >
            {action.icon && <action.icon className="w-5 h-5" />}
            {action.label}
          </button>
        ))}
        
        <button
          onClick={onClose}
          className="w-full px-4 py-3 mt-2 rounded-lg font-medium
            bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100
            hover:bg-gray-200 dark:hover:bg-gray-600
            transition-all duration-200"
        >
          취소
        </button>
      </div>
    </>
  );
}