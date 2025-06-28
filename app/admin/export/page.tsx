// 데이터 내보내기 페이지
// 비전공자 설명: 각종 데이터를 엑셀 파일로 다운로드할 수 있는 페이지입니다
'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { 
  Download,
  ChevronLeft,
  // FileSpreadsheet,
  Calendar,
  Users,
  Gamepad2,
  DollarSign,
  Clock,
  AlertCircle,
  Settings,
  Database,
  FileText,
  Package,
  TrendingUp
} from 'lucide-react';

type ExportType = {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  fields: string[];
  category: 'reservation' | 'customer' | 'revenue' | 'device' | 'operation';
  estimatedSize: string;
  lastExported?: string;
};

type ExportOptions = {
  dateRange: 'all' | '7days' | '30days' | '90days' | '12months' | 'custom';
  format: 'xlsx' | 'csv';
  includeHeaders: boolean;
  timezone: string;
  encoding: 'UTF-8' | 'EUC-KR';
};

export default function DataExportPage() {
  const [selectedExports, setSelectedExports] = useState<string[]>([]);
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    dateRange: '30days',
    format: 'xlsx',
    includeHeaders: true,
    timezone: 'Asia/Seoul',
    encoding: 'UTF-8'
  });
  const [isExporting, setIsExporting] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // 내보내기 가능한 데이터 목록
  const exportTypes: ExportType[] = [
    // 예약 관련
    {
      id: 'reservations',
      name: '예약 내역',
      description: '전체 예약 내역 및 상태 정보',
      icon: Calendar,
      fields: ['예약번호', '고객명', '연락처', '기기명', '날짜', '시간', '상태', '결제금액', '결제방법'],
      category: 'reservation',
      estimatedSize: '~2MB',
      lastExported: '2024-01-25'
    },
    {
      id: 'reservation-stats',
      name: '예약 통계',
      description: '일별/월별 예약 통계 및 분석 데이터',
      icon: TrendingUp,
      fields: ['날짜', '총예약수', '완료', '취소', '노쇼', '매출', '인기시간대', '인기기기'],
      category: 'reservation',
      estimatedSize: '~500KB'
    },
    
    // 고객 관련
    {
      id: 'customers',
      name: '고객 정보',
      description: '전체 고객 목록 및 이용 내역',
      icon: Users,
      fields: ['고객ID', '이름', '연락처', '이메일', '가입일', '총이용횟수', '총결제금액', '마지막방문'],
      category: 'customer',
      estimatedSize: '~1MB',
      lastExported: '2024-01-20'
    },
    {
      id: 'customer-analysis',
      name: '고객 분석',
      description: '고객 세그먼트 및 행동 분석',
      icon: Package,
      fields: ['고객등급', '인원수', '평균이용횟수', '평균결제금액', '재방문율', '이탈율'],
      category: 'customer',
      estimatedSize: '~200KB'
    },
    
    // 매출 관련
    {
      id: 'revenue',
      name: '매출 내역',
      description: '상세 매출 내역 및 결제 정보',
      icon: DollarSign,
      fields: ['날짜', '예약번호', '고객명', '기기명', '이용시간', '결제금액', '결제방법', '할인', '순매출'],
      category: 'revenue',
      estimatedSize: '~3MB',
      lastExported: '2024-01-24'
    },
    {
      id: 'revenue-summary',
      name: '매출 요약',
      description: '일별/월별 매출 요약 보고서',
      icon: FileText,
      fields: ['날짜', '총매출', '현금매출', '이체매출', '예약건수', '평균객단가', '전일대비'],
      category: 'revenue',
      estimatedSize: '~300KB'
    },
    
    // 기기 관련
    {
      id: 'devices',
      name: '기기 현황',
      description: '기기 목록 및 상태 정보',
      icon: Gamepad2,
      fields: ['기기ID', '카테고리', '기종명', '기기번호', '상태', '도입일', '총이용시간', '수리이력'],
      category: 'device',
      estimatedSize: '~100KB'
    },
    {
      id: 'device-usage',
      name: '기기 이용률',
      description: '기기별 이용률 및 가동 통계',
      icon: Clock,
      fields: ['기기명', '총예약수', '이용시간', '가동률', '매출기여도', '인기순위'],
      category: 'device',
      estimatedSize: '~200KB'
    },
    
    // 운영 관련
    {
      id: 'operation-log',
      name: '운영 로그',
      description: '시스템 운영 및 관리 로그',
      icon: Database,
      fields: ['날짜시간', '작업유형', '관리자', '대상', '변경내용', 'IP주소'],
      category: 'operation',
      estimatedSize: '~5MB'
    }
  ];

  // 카테고리별 그룹화
  const groupedExports = exportTypes.reduce((acc, type) => {
    if (!acc[type.category]) acc[type.category] = [];
    acc[type.category]!.push(type);
    return acc;
  }, {} as Record<string, ExportType[]>);

  const categoryNames = {
    reservation: '예약 관리',
    customer: '고객 관리',
    revenue: '매출 관리',
    device: '기기 관리',
    operation: '운영 관리'
  };

  // 전체 선택/해제
  const toggleAll = (category?: string) => {
    if (category) {
      const categoryExports = groupedExports[category];
      if (!categoryExports) return;
      
      const categoryIds = categoryExports.map(e => e.id);
      const allSelected = categoryIds.every(id => selectedExports.includes(id));
      
      if (allSelected) {
        setSelectedExports(selectedExports.filter(id => !categoryIds.includes(id)));
      } else {
        setSelectedExports([...new Set([...selectedExports, ...categoryIds])]);
      }
    } else {
      if (selectedExports.length === exportTypes.length) {
        setSelectedExports([]);
      } else {
        setSelectedExports(exportTypes.map(e => e.id));
      }
    }
  };

  // 개별 선택/해제
  const toggleExport = (id: string) => {
    if (selectedExports.includes(id)) {
      setSelectedExports(selectedExports.filter(e => e !== id));
    } else {
      setSelectedExports([...selectedExports, id]);
    }
  };

  // 내보내기 실행
  const handleExport = async () => {
    if (selectedExports.length === 0) {
      alert('내보낼 데이터를 선택해주세요.');
      return;
    }

    setIsExporting(true);

    // 실제로는 여기서 API 호출하여 데이터 다운로드
    // 각 선택된 항목별로 파일 생성
    setTimeout(() => {
      setIsExporting(false);
      alert(`${selectedExports.length}개의 파일이 다운로드되었습니다.`);
      
      // 내보내기 기록 업데이트
      const now = new Date().toISOString().split('T')[0];
      selectedExports.forEach(id => {
        const type = exportTypes.find(t => t.id === id);
        if (type) type.lastExported = now;
      });
      
      setSelectedExports([]);
    }, 2000);
  };

  // 예상 파일 크기 계산
  const getTotalSize = () => {
    const totalBytes = selectedExports.reduce((sum, id) => {
      const type = exportTypes.find(t => t.id === id);
      if (!type) return sum;
      
      const sizeStr = type.estimatedSize.replace('~', '');
      if (sizeStr.includes('MB')) {
        return sum + parseFloat(sizeStr) * 1024 * 1024;
      } else if (sizeStr.includes('KB')) {
        return sum + parseFloat(sizeStr) * 1024;
      }
      return sum;
    }, 0);

    if (totalBytes > 1024 * 1024) {
      return `~${(totalBytes / (1024 * 1024)).toFixed(1)}MB`;
    } else if (totalBytes > 1024) {
      return `~${(totalBytes / 1024).toFixed(0)}KB`;
    }
    return '0KB';
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* 헤더 */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-2">
          <Link
            href="/admin"
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          </Link>
          <h1 className="text-2xl font-bold dark:text-white">데이터 내보내기</h1>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 ml-11">
          필요한 데이터를 선택하여 엑셀 파일로 다운로드하세요
        </p>
      </div>

      {/* 옵션 패널 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold dark:text-white">내보내기 옵션</h2>
          <button
            onClick={() => setShowOptions(!showOptions)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <Settings className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        <div className={`space-y-4 ${showOptions ? '' : 'hidden'}`}>
          {/* 기간 설정 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              데이터 기간
            </label>
            <div className="flex flex-wrap gap-2">
              {['all', '7days', '30days', '90days', '12months', 'custom'].map((range) => (
                <button
                  key={range}
                  onClick={() => setExportOptions({ ...exportOptions, dateRange: range as ExportOptions['dateRange'] })}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    exportOptions.dateRange === range
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {range === 'all' && '전체'}
                  {range === '7days' && '최근 7일'}
                  {range === '30days' && '최근 30일'}
                  {range === '90days' && '최근 90일'}
                  {range === '12months' && '최근 12개월'}
                  {range === 'custom' && '직접 선택'}
                </button>
              ))}
            </div>

            {exportOptions.dateRange === 'custom' && (
              <div className="flex gap-4 mt-3">
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <span className="self-center text-gray-500">~</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            )}
          </div>

          {/* 파일 형식 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                파일 형식
              </label>
              <select
                value={exportOptions.format}
                onChange={(e) => setExportOptions({ ...exportOptions, format: e.target.value as ExportOptions['format'] })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="xlsx">Excel (.xlsx)</option>
                <option value="csv">CSV (.csv)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                인코딩
              </label>
              <select
                value={exportOptions.encoding}
                onChange={(e) => setExportOptions({ ...exportOptions, encoding: e.target.value as ExportOptions['encoding'] })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="UTF-8">UTF-8 (권장)</option>
                <option value="EUC-KR">EUC-KR (한글 엑셀)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                옵션
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={exportOptions.includeHeaders}
                  onChange={(e) => setExportOptions({ ...exportOptions, includeHeaders: e.target.checked })}
                  className="rounded text-blue-600"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">헤더 포함</span>
              </label>
            </div>
          </div>
        </div>

        {/* 간단 요약 */}
        {!showOptions && (
          <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
            <span>기간: {
              exportOptions.dateRange === 'all' ? '전체' :
              exportOptions.dateRange === '7days' ? '최근 7일' :
              exportOptions.dateRange === '30days' ? '최근 30일' :
              exportOptions.dateRange === '90days' ? '최근 90일' :
              exportOptions.dateRange === '12months' ? '최근 12개월' : '직접 선택'
            }</span>
            <span>•</span>
            <span>형식: {exportOptions.format.toUpperCase()}</span>
            <span>•</span>
            <span>인코딩: {exportOptions.encoding}</span>
          </div>
        )}
      </div>

      {/* 데이터 선택 */}
      <div className="space-y-6 mb-8">
        {Object.entries(groupedExports).map(([category, types]) => (
          <motion.div
            key={category}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700"
          >
            {/* 카테고리 헤더 */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold dark:text-white">
                  {categoryNames[category as keyof typeof categoryNames]}
                </h3>
                <button
                  onClick={() => toggleAll(category)}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  {types.every(t => selectedExports.includes(t.id)) ? '전체 해제' : '전체 선택'}
                </button>
              </div>
            </div>

            {/* 항목 목록 */}
            <div className="p-4 space-y-3">
              {types.map((type) => {
                const Icon = type.icon;
                const isSelected = selectedExports.includes(type.id);

                return (
                  <label
                    key={type.id}
                    className={`flex items-start gap-4 p-4 rounded-lg cursor-pointer transition-all ${
                      isSelected 
                        ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800' 
                        : 'bg-gray-50 dark:bg-gray-900/50 border border-transparent hover:bg-gray-100 dark:hover:bg-gray-900'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleExport(type.id)}
                      className="mt-1 rounded text-blue-600"
                    />
                    <Icon className="w-5 h-5 text-gray-600 dark:text-gray-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium dark:text-white">{type.name}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {type.description}
                          </p>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {type.fields.slice(0, 5).map((field) => (
                              <span 
                                key={field}
                                className="text-xs px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded"
                              >
                                {field}
                              </span>
                            ))}
                            {type.fields.length > 5 && (
                              <span className="text-xs text-gray-500">
                                +{type.fields.length - 5}개
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right ml-4">
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {type.estimatedSize}
                          </p>
                          {type.lastExported && (
                            <p className="text-xs text-gray-500 mt-1">
                              최근: {type.lastExported}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          </motion.div>
        ))}
      </div>

      {/* 하단 액션 영역 */}
      <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-950 p-4 -mx-6 border-t border-gray-200 dark:border-gray-800">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {selectedExports.length}개 선택됨
            </span>
            {selectedExports.length > 0 && (
              <>
                <span className="text-sm text-gray-500">•</span>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  예상 크기: {getTotalSize()}
                </span>
              </>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setSelectedExports([])}
              disabled={selectedExports.length === 0}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              선택 취소
            </button>
            <button
              onClick={handleExport}
              disabled={selectedExports.length === 0 || isExporting}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isExporting ? (
                <>
                  <Download className="w-4 h-4 animate-bounce" />
                  내보내는 중...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  내보내기
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 안내 메시지 */}
      <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800 dark:text-blue-200">
            <h4 className="font-medium mb-1">내보내기 안내</h4>
            <ul className="space-y-1 text-blue-700 dark:text-blue-300">
              <li>• 대용량 데이터는 처리 시간이 길어질 수 있습니다</li>
              <li>• 한글 엑셀에서 열 경우 EUC-KR 인코딩을 선택하세요</li>
              <li>• 개인정보가 포함된 파일은 안전하게 관리해주세요</li>
              <li>• 내보낸 파일은 다운로드 폴더에 저장됩니다</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}