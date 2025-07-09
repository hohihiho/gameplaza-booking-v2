'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, MoreHorizontal } from 'lucide-react';
import TouchRipple from './TouchRipple';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange?: (itemsPerPage: number) => void;
  showItemsPerPage?: boolean;
  className?: string;
}

export default function Pagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  showItemsPerPage = true,
  className = ''
}: PaginationProps) {
  const [inputPage, setInputPage] = useState(currentPage.toString());
  const [showPageInput, setShowPageInput] = useState(false);

  useEffect(() => {
    setInputPage(currentPage.toString());
  }, [currentPage]);

  // 페이지 번호 생성 로직
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisiblePages = 5;
    const halfVisible = Math.floor(maxVisiblePages / 2);

    if (totalPages <= maxVisiblePages) {
      // 전체 페이지가 5개 이하면 모두 표시
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // 현재 페이지 주변 페이지들 표시
      if (currentPage <= halfVisible + 1) {
        // 시작 부분
        for (let i = 1; i <= maxVisiblePages - 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - halfVisible) {
        // 끝 부분
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - maxVisiblePages + 2; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        // 중간 부분
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      }
    }

    return pages;
  };

  const handlePageInput = () => {
    const page = parseInt(inputPage);
    if (page >= 1 && page <= totalPages) {
      onPageChange(page);
      setShowPageInput(false);
    } else {
      setInputPage(currentPage.toString());
      setShowPageInput(false);
    }
  };

  // 현재 표시 중인 아이템 범위
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  // 키보드 단축키 지원
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      
      if (e.key === 'ArrowLeft' && currentPage > 1) {
        onPageChange(currentPage - 1);
      } else if (e.key === 'ArrowRight' && currentPage < totalPages) {
        onPageChange(currentPage + 1);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentPage, totalPages, onPageChange]);

  if (totalPages <= 1) return null;

  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      {/* 페이지 정보 및 아이템 수 선택 */}
      <div className="flex items-center justify-between text-sm text-gray-700 dark:text-gray-300">
        <span>
          총 {totalItems.toLocaleString()}개 중 {startItem}-{endItem} 표시
        </span>
        
        {showItemsPerPage && onItemsPerPageChange && (
          <select
            value={itemsPerPage}
            onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
            className="px-3 py-1.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 text-gray-900 dark:text-white"
            aria-label="페이지당 표시 개수"
          >
            <option value="10">10개씩</option>
            <option value="20">20개씩</option>
            <option value="50">50개씩</option>
          </select>
        )}
      </div>

      {/* 페이지네이션 컨트롤 */}
      <div className="flex items-center justify-center gap-1">
        {/* 처음으로 */}
        <TouchRipple>
          <button
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-60 disabled:cursor-not-allowed transition-colors touch-target"
            aria-label="처음 페이지"
          >
            <ChevronsLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          </button>
        </TouchRipple>

        {/* 이전 */}
        <TouchRipple>
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-60 disabled:cursor-not-allowed transition-colors touch-target"
            aria-label="이전 페이지"
          >
            <ChevronLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          </button>
        </TouchRipple>

        {/* 페이지 번호들 */}
        <div className="flex items-center gap-1 mx-2">
          {getPageNumbers().map((page, index) => {
            if (page === '...') {
              return (
                <span key={`ellipsis-${index}`} className="px-2 text-gray-400">
                  <MoreHorizontal className="w-4 h-4" />
                </span>
              );
            }

            const pageNum = page as number;
            const isActive = pageNum === currentPage;

            return (
              <TouchRipple key={pageNum}>
                <button
                  onClick={() => onPageChange(pageNum)}
                  className={`min-w-[44px] h-[44px] px-3 rounded-lg font-medium transition-all ${
                    isActive
                      ? 'bg-indigo-600 text-white'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                  aria-label={`페이지 ${pageNum}`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {pageNum}
                </button>
              </TouchRipple>
            );
          })}
        </div>

        {/* 다음 */}
        <TouchRipple>
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-60 disabled:cursor-not-allowed transition-colors touch-target"
            aria-label="다음 페이지"
          >
            <ChevronRight className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          </button>
        </TouchRipple>

        {/* 마지막으로 */}
        <TouchRipple>
          <button
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage === totalPages}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-60 disabled:cursor-not-allowed transition-colors touch-target"
            aria-label="마지막 페이지"
          >
            <ChevronsRight className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          </button>
        </TouchRipple>
      </div>

      {/* 페이지 직접 입력 */}
      <div className="flex items-center justify-center">
        <AnimatePresence mode="wait">
          {showPageInput ? (
            <motion.div
              key="input"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex items-center gap-2"
            >
              <input
                type="number"
                value={inputPage}
                onChange={(e) => setInputPage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handlePageInput()}
                onBlur={handlePageInput}
                min="1"
                max={totalPages}
                className="w-20 px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-indigo-500"
                autoFocus
              />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                / {totalPages} 페이지
              </span>
            </motion.div>
          ) : (
            <motion.button
              key="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPageInput(true)}
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              {currentPage} / {totalPages} 페이지
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}