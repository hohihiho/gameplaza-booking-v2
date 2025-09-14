'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Shield,
  Plus,
  Trash2,
  Edit2,
  Search,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff,
  Filter,
  BarChart,
  TrendingUp,
  Settings,
  Download,
  Upload,
  RefreshCw,
  Zap,
  Brain,
  AlertCircle,
  Info
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

type BannedWordCategory = 'profanity' | 'harassment' | 'spam' | 'sexual' | 'violence' | 'hate' | 'custom'
type Severity = 'low' | 'medium' | 'high' | 'critical'
type ActionType = 'warn' | 'mask' | 'block' | 'ban'

interface BannedWord {
  id: string
  word: string
  category: BannedWordCategory
  severity: Severity
  action: ActionType
  regex?: boolean
  context_sensitive?: boolean
  whitelist_contexts?: string[]
  created_at: string
  updated_at: string
  match_count: number
  last_matched?: string
  created_by?: string
  is_active: boolean
}

interface FilterStats {
  total_words: number
  active_words: number
  total_matches: number
  blocked_today: number
  warned_today: number
  masked_today: number
  top_matched: string[]
  category_breakdown: Record<BannedWordCategory, number>
  severity_breakdown: Record<Severity, number>
}

interface AIAnalysis {
  confidence: number
  suggested_severity: Severity
  suggested_action: ActionType
  reasoning: string
  similar_words?: string[]
}

export default function BannedWordsPage() {
  const router = useRouter()
  const [words, setWords] = useState<BannedWord[]>([])
  const [filteredWords, setFilteredWords] = useState<BannedWord[]>([])
  const [stats, setStats] = useState<FilterStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<BannedWordCategory | 'all'>('all')
  const [selectedSeverity, setSelectedSeverity] = useState<Severity | 'all'>('all')
  const [showInactive, setShowInactive] = useState(false)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isTestModalOpen, setIsTestModalOpen] = useState(false)
  const [selectedWord, setSelectedWord] = useState<BannedWord | null>(null)
  const [testText, setTestText] = useState('')
  const [testResults, setTestResults] = useState<any>(null)
  const [aiAnalyzing, setAiAnalyzing] = useState(false)
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null)

  // 새 단어 추가 상태
  const [newWord, setNewWord] = useState({
    word: '',
    category: 'profanity' as BannedWordCategory,
    severity: 'medium' as Severity,
    action: 'warn' as ActionType,
    regex: false,
    context_sensitive: false,
    whitelist_contexts: [] as string[]
  })

  // 카테고리 정보
  const categoryInfo = {
    profanity: { label: '욕설', color: 'bg-red-500', icon: '🤬' },
    harassment: { label: '괴롭힘', color: 'bg-orange-500', icon: '😠' },
    spam: { label: '스팸', color: 'bg-yellow-500', icon: '📧' },
    sexual: { label: '성적', color: 'bg-pink-500', icon: '🔞' },
    violence: { label: '폭력', color: 'bg-purple-500', icon: '⚔️' },
    hate: { label: '혐오', color: 'bg-gray-700', icon: '😡' },
    custom: { label: '사용자 정의', color: 'bg-blue-500', icon: '⚙️' }
  }

  // 심각도 정보
  const severityInfo = {
    low: { label: '낮음', color: 'text-green-500', bgColor: 'bg-green-100 dark:bg-green-900/30' },
    medium: { label: '보통', color: 'text-yellow-500', bgColor: 'bg-yellow-100 dark:bg-yellow-900/30' },
    high: { label: '높음', color: 'text-orange-500', bgColor: 'bg-orange-100 dark:bg-orange-900/30' },
    critical: { label: '심각', color: 'text-red-500', bgColor: 'bg-red-100 dark:bg-red-900/30' }
  }

  // 액션 정보
  const actionInfo = {
    warn: { label: '경고', icon: AlertTriangle, color: 'text-yellow-500' },
    mask: { label: '마스킹', icon: EyeOff, color: 'text-blue-500' },
    block: { label: '차단', icon: XCircle, color: 'text-orange-500' },
    ban: { label: '금지', icon: Shield, color: 'text-red-500' }
  }

  // 데이터 로드
  useEffect(() => {
    fetchWords()
    fetchStats()
  }, [])

  const fetchWords = async () => {
    try {
      setLoading(true)
      // Mock 데이터 - 실제로는 API 호출
      const mockWords: BannedWord[] = [
        {
          id: '1',
          word: '욕설1',
          category: 'profanity',
          severity: 'high',
          action: 'block',
          regex: false,
          context_sensitive: false,
          created_at: '2025-01-10T10:00:00Z',
          updated_at: '2025-01-10T10:00:00Z',
          match_count: 156,
          last_matched: '2025-01-14T15:30:00Z',
          created_by: 'admin',
          is_active: true
        },
        {
          id: '2',
          word: '광고.*텔레그램',
          category: 'spam',
          severity: 'medium',
          action: 'mask',
          regex: true,
          context_sensitive: false,
          created_at: '2025-01-09T10:00:00Z',
          updated_at: '2025-01-09T10:00:00Z',
          match_count: 89,
          last_matched: '2025-01-14T14:20:00Z',
          created_by: 'admin',
          is_active: true
        },
        {
          id: '3',
          word: '바보',
          category: 'harassment',
          severity: 'low',
          action: 'warn',
          regex: false,
          context_sensitive: true,
          whitelist_contexts: ['농담', '친구'],
          created_at: '2025-01-08T10:00:00Z',
          updated_at: '2025-01-08T10:00:00Z',
          match_count: 45,
          last_matched: '2025-01-14T12:00:00Z',
          created_by: 'admin',
          is_active: true
        }
      ]
      setWords(mockWords)
      setFilteredWords(mockWords)
    } catch (error) {
      console.error('Failed to fetch words:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      // Mock 통계 - 실제로는 API 호출
      const mockStats: FilterStats = {
        total_words: 128,
        active_words: 115,
        total_matches: 5432,
        blocked_today: 23,
        warned_today: 45,
        masked_today: 67,
        top_matched: ['욕설1', '광고.*텔레그램', '바보'],
        category_breakdown: {
          profanity: 45,
          harassment: 23,
          spam: 34,
          sexual: 12,
          violence: 8,
          hate: 4,
          custom: 2
        },
        severity_breakdown: {
          low: 35,
          medium: 52,
          high: 31,
          critical: 10
        }
      }
      setStats(mockStats)
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    }
  }

  // 필터링
  useEffect(() => {
    let filtered = [...words]

    // 검색어 필터
    if (searchTerm) {
      filtered = filtered.filter(word =>
        word.word.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // 카테고리 필터
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(word => word.category === selectedCategory)
    }

    // 심각도 필터
    if (selectedSeverity !== 'all') {
      filtered = filtered.filter(word => word.severity === selectedSeverity)
    }

    // 활성 상태 필터
    if (!showInactive) {
      filtered = filtered.filter(word => word.is_active)
    }

    // 매치 횟수로 정렬
    filtered.sort((a, b) => b.match_count - a.match_count)

    setFilteredWords(filtered)
  }, [words, searchTerm, selectedCategory, selectedSeverity, showInactive])

  // AI 분석
  const analyzeWithAI = async (word: string) => {
    setAiAnalyzing(true)
    setAiAnalysis(null)

    try {
      // Mock AI 분석 - 실제로는 AI API 호출
      await new Promise(resolve => setTimeout(resolve, 1500))

      const mockAnalysis: AIAnalysis = {
        confidence: 0.92,
        suggested_severity: 'high',
        suggested_action: 'block',
        reasoning: '이 단어는 강한 욕설로 분류되며, 커뮤니티 가이드라인을 심각하게 위반합니다.',
        similar_words: ['유사어1', '유사어2', '변형어1']
      }

      setAiAnalysis(mockAnalysis)
    } catch (error) {
      console.error('AI analysis failed:', error)
    } finally {
      setAiAnalyzing(false)
    }
  }

  // 단어 추가
  const handleAddWord = async () => {
    try {
      // API 호출 시뮬레이션
      const newBannedWord: BannedWord = {
        id: Date.now().toString(),
        ...newWord,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        match_count: 0,
        created_by: 'admin',
        is_active: true
      }

      setWords([newBannedWord, ...words])
      setIsAddModalOpen(false)
      setNewWord({
        word: '',
        category: 'profanity',
        severity: 'medium',
        action: 'warn',
        regex: false,
        context_sensitive: false,
        whitelist_contexts: []
      })
      setAiAnalysis(null)
    } catch (error) {
      console.error('Failed to add word:', error)
    }
  }

  // 단어 수정
  const handleEditWord = async () => {
    if (!selectedWord) return

    try {
      // API 호출 시뮬레이션
      const updatedWords = words.map(w =>
        w.id === selectedWord.id ? { ...selectedWord, updated_at: new Date().toISOString() } : w
      )
      setWords(updatedWords)
      setIsEditModalOpen(false)
      setSelectedWord(null)
    } catch (error) {
      console.error('Failed to edit word:', error)
    }
  }

  // 단어 삭제
  const handleDeleteWord = async (id: string) => {
    if (!confirm('정말 이 단어를 삭제하시겠습니까?')) return

    try {
      setWords(words.filter(w => w.id !== id))
    } catch (error) {
      console.error('Failed to delete word:', error)
    }
  }

  // 단어 활성/비활성
  const toggleWordActive = async (id: string) => {
    try {
      const updatedWords = words.map(w =>
        w.id === id ? { ...w, is_active: !w.is_active } : w
      )
      setWords(updatedWords)
    } catch (error) {
      console.error('Failed to toggle word:', error)
    }
  }

  // 텍스트 테스트
  const testFilter = async () => {
    if (!testText.trim()) return

    try {
      // Mock 테스트 결과 - 실제로는 API 호출
      const results = {
        is_clean: false,
        matches: [
          {
            word: '욕설1',
            category: 'profanity',
            severity: 'high',
            action: 'block',
            position: [10, 14]
          }
        ],
        suggested_action: 'block',
        masked_text: '이것은 테스트 ****입니다.'
      }

      setTestResults(results)
    } catch (error) {
      console.error('Test failed:', error)
    }
  }

  // CSV 내보내기
  const exportToCSV = () => {
    const headers = ['단어', '카테고리', '심각도', '액션', '정규식', '컨텍스트 민감', '매치 횟수', '활성 상태']
    const rows = words.map(w => [
      w.word,
      w.category,
      w.severity,
      w.action,
      w.regex ? 'O' : 'X',
      w.context_sensitive ? 'O' : 'X',
      w.match_count.toString(),
      w.is_active ? '활성' : '비활성'
    ])

    const csvContent = [headers, ...rows]
      .map(row => row.join(','))
      .join('\n')

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `banned_words_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* 헤더 */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-red-500 to-orange-600 rounded-2xl">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                AI 비속어 필터 관리
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                금지어를 관리하고 필터링 규칙을 설정합니다
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsTestModalOpen(true)}
              className="px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors flex items-center gap-2"
            >
              <Zap className="w-4 h-4" />
              테스트
            </button>
            <button
              onClick={exportToCSV}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              내보내기
            </button>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              단어 추가
            </button>
          </div>
        </div>

        {/* 통계 카드 */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">전체 금지어</span>
                <Shield className="w-4 h-4 text-gray-400" />
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.total_words}개
              </div>
              <div className="text-xs text-gray-500 mt-1">
                활성: {stats.active_words}개
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">오늘 차단</span>
                <XCircle className="w-4 h-4 text-red-400" />
              </div>
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                {stats.blocked_today}건
              </div>
              <div className="text-xs text-gray-500 mt-1">
                전체 매칭: {stats.total_matches}건
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">오늘 경고</span>
                <AlertTriangle className="w-4 h-4 text-yellow-400" />
              </div>
              <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {stats.warned_today}건
              </div>
              <div className="text-xs text-gray-500 mt-1">
                마스킹: {stats.masked_today}건
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">최다 매칭</span>
                <TrendingUp className="w-4 h-4 text-blue-400" />
              </div>
              <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {stats.top_matched[0] || '-'}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                상위 3개 단어
              </div>
            </motion.div>
          </div>
        )}

        {/* 필터 바 */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex flex-wrap items-center gap-4">
            {/* 검색 */}
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="단어 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* 카테고리 필터 */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as BannedWordCategory | 'all')}
              className="px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">모든 카테고리</option>
              {Object.entries(categoryInfo).map(([key, info]) => (
                <option key={key} value={key}>
                  {info.icon} {info.label}
                </option>
              ))}
            </select>

            {/* 심각도 필터 */}
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value as Severity | 'all')}
              className="px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">모든 심각도</option>
              {Object.entries(severityInfo).map(([key, info]) => (
                <option key={key} value={key}>{info.label}</option>
              ))}
            </select>

            {/* 비활성 포함 */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showInactive}
                onChange={(e) => setShowInactive(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                비활성 포함
              </span>
            </label>

            {/* 새로고침 */}
            <button
              onClick={fetchWords}
              className="p-2 bg-gray-100 dark:bg-gray-800 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
        </div>
      </div>

      {/* 단어 목록 */}
      <div className="space-y-3">
        <AnimatePresence>
          {filteredWords.map((word, index) => (
            <motion.div
              key={word.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ delay: index * 0.05 }}
              className={`bg-white dark:bg-gray-900 rounded-xl p-4 border ${
                word.is_active
                  ? 'border-gray-200 dark:border-gray-700'
                  : 'border-gray-300 dark:border-gray-600 opacity-60'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {/* 카테고리 아이콘 */}
                  <div className={`w-10 h-10 rounded-xl ${categoryInfo[word.category].color} bg-opacity-20 flex items-center justify-center text-xl`}>
                    {categoryInfo[word.category].icon}
                  </div>

                  {/* 단어 정보 */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-semibold text-gray-900 dark:text-white">
                        {word.word}
                      </span>
                      {word.regex && (
                        <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 text-xs rounded-lg">
                          정규식
                        </span>
                      )}
                      {word.context_sensitive && (
                        <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs rounded-lg">
                          컨텍스트
                        </span>
                      )}
                      <span className={`px-2 py-0.5 rounded-lg text-xs font-medium ${severityInfo[word.severity].bgColor} ${severityInfo[word.severity].color}`}>
                        {severityInfo[word.severity].label}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-600 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <span className="font-medium">카테고리:</span>
                        {categoryInfo[word.category].label}
                      </span>
                      <span className="flex items-center gap-1">
                        {React.createElement(actionInfo[word.action].icon, { className: 'w-3 h-3' })}
                        <span className="font-medium">액션:</span>
                        {actionInfo[word.action].label}
                      </span>
                      <span>
                        <span className="font-medium">매칭:</span> {word.match_count}회
                      </span>
                      {word.last_matched && (
                        <span className="text-xs">
                          마지막: {new Date(word.last_matched).toLocaleDateString('ko-KR')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* 액션 버튼 */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleWordActive(word.id)}
                    className={`p-2 rounded-lg transition-colors ${
                      word.is_active
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    {word.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => {
                      setSelectedWord(word)
                      setIsEditModalOpen(true)
                    }}
                    className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteWord(word.id)}
                    className="p-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredWords.length === 0 && (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <Shield className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>필터 조건에 맞는 금지어가 없습니다</p>
          </div>
        )}
      </div>

      {/* 단어 추가 모달 */}
      <AnimatePresence>
        {isAddModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setIsAddModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                금지어 추가
              </h2>

              <div className="space-y-4">
                {/* 단어 입력 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    금지어
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={newWord.word}
                      onChange={(e) => setNewWord({ ...newWord, word: e.target.value })}
                      placeholder="금지할 단어 또는 정규식 패턴"
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    {newWord.word && (
                      <button
                        onClick={() => analyzeWithAI(newWord.word)}
                        disabled={aiAnalyzing}
                        className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all flex items-center gap-1"
                      >
                        <Brain className="w-3 h-3" />
                        {aiAnalyzing ? 'AI 분석 중...' : 'AI 분석'}
                      </button>
                    )}
                  </div>
                </div>

                {/* AI 분석 결과 */}
                {aiAnalysis && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl border border-purple-200 dark:border-purple-700"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Brain className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      <span className="text-sm font-semibold text-purple-700 dark:text-purple-300">
                        AI 분석 결과 (신뢰도: {Math.round(aiAnalysis.confidence * 100)}%)
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                      {aiAnalysis.reasoning}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => {
                          setNewWord({
                            ...newWord,
                            severity: aiAnalysis.suggested_severity,
                            action: aiAnalysis.suggested_action
                          })
                        }}
                        className="px-3 py-1 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors"
                      >
                        AI 제안 적용
                      </button>
                      {aiAnalysis.similar_words && (
                        <span className="text-xs text-gray-600 dark:text-gray-400">
                          유사어: {aiAnalysis.similar_words.join(', ')}
                        </span>
                      )}
                    </div>
                  </motion.div>
                )}

                {/* 카테고리 선택 */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      카테고리
                    </label>
                    <select
                      value={newWord.category}
                      onChange={(e) => setNewWord({ ...newWord, category: e.target.value as BannedWordCategory })}
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      {Object.entries(categoryInfo).map(([key, info]) => (
                        <option key={key} value={key}>
                          {info.icon} {info.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 심각도 선택 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      심각도
                    </label>
                    <select
                      value={newWord.severity}
                      onChange={(e) => setNewWord({ ...newWord, severity: e.target.value as Severity })}
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      {Object.entries(severityInfo).map(([key, info]) => (
                        <option key={key} value={key}>{info.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 액션 선택 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    처리 방법
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {Object.entries(actionInfo).map(([key, info]) => (
                      <button
                        key={key}
                        onClick={() => setNewWord({ ...newWord, action: key as ActionType })}
                        className={`p-3 rounded-xl border-2 transition-all ${
                          newWord.action === key
                            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                      >
                        <info.icon className={`w-5 h-5 mx-auto mb-1 ${info.color}`} />
                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                          {info.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 고급 옵션 */}
                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newWord.regex}
                      onChange={(e) => setNewWord({ ...newWord, regex: e.target.checked })}
                      className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      정규식 패턴으로 사용
                    </span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newWord.context_sensitive}
                      onChange={(e) => setNewWord({ ...newWord, context_sensitive: e.target.checked })}
                      className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      컨텍스트 민감 (문맥에 따라 허용)
                    </span>
                  </label>
                </div>

                {/* 버튼 */}
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    onClick={() => {
                      setIsAddModalOpen(false)
                      setAiAnalysis(null)
                    }}
                    className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleAddWord}
                    disabled={!newWord.word}
                    className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    추가하기
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 테스트 모달 */}
      <AnimatePresence>
        {isTestModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setIsTestModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-2xl w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <Zap className="w-6 h-6 text-blue-500" />
                필터 테스트
              </h2>

              <div className="space-y-4">
                {/* 테스트 입력 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    테스트할 텍스트
                  </label>
                  <textarea
                    value={testText}
                    onChange={(e) => setTestText(e.target.value)}
                    placeholder="필터링을 테스트할 텍스트를 입력하세요..."
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                    rows={4}
                  />
                </div>

                {/* 테스트 결과 */}
                {testResults && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 rounded-xl border ${
                      testResults.is_clean
                        ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700'
                        : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      {testResults.is_clean ? (
                        <>
                          <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                          <span className="font-semibold text-green-700 dark:text-green-300">
                            안전한 텍스트
                          </span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                          <span className="font-semibold text-red-700 dark:text-red-300">
                            금지어 감지됨
                          </span>
                        </>
                      )}
                    </div>

                    {!testResults.is_clean && (
                      <>
                        <div className="space-y-2 mb-3">
                          {testResults.matches.map((match: any, index: number) => (
                            <div key={index} className="text-sm">
                              <span className="font-medium text-gray-700 dark:text-gray-300">
                                매칭: "{match.word}"
                              </span>
                              <span className="ml-2 text-xs text-gray-500">
                                ({categoryInfo[match.category as BannedWordCategory].label}, {severityInfo[match.severity as Severity].label}, {actionInfo[match.action as ActionType].label})
                              </span>
                            </div>
                          ))}
                        </div>

                        {testResults.masked_text && (
                          <div className="p-3 bg-white dark:bg-gray-800 rounded-lg">
                            <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
                              마스킹된 텍스트:
                            </span>
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              {testResults.masked_text}
                            </span>
                          </div>
                        )}
                      </>
                    )}
                  </motion.div>
                )}

                {/* 버튼 */}
                <div className="flex justify-between">
                  <button
                    onClick={() => {
                      setTestText('')
                      setTestResults(null)
                    }}
                    className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  >
                    초기화
                  </button>
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setIsTestModalOpen(false)
                        setTestText('')
                        setTestResults(null)
                      }}
                      className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    >
                      닫기
                    </button>
                    <button
                      onClick={testFilter}
                      disabled={!testText.trim()}
                      className="px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      테스트 실행
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}