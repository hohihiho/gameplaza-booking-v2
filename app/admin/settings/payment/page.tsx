// 계좌 관리 페이지
// 비전공자 설명: 관리자가 결제용 계좌 정보를 관리하는 페이지입니다
'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft,
  Plus,
  Edit2,
  Trash2,
  Save,
  Copy,
  Eye,
  EyeOff,
  Star,
  Banknote,
  AlertTriangle,
  Check
} from 'lucide-react';
import Link from 'next/link';

type PaymentAccount = {
  id: string;
  bank_name: string;
  account_number: string;
  account_holder: string;
  is_primary: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type FormData = {
  bank_name: string;
  account_number: string;
  account_holder: string;
  is_primary: boolean;
};

export default function PaymentSettingsPage() {
  const [accounts, setAccounts] = useState<PaymentAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    bank_name: '',
    account_number: '',
    account_holder: '',
    is_primary: false
  });

  // 계좌 목록 가져오기
  const fetchAccounts = async () => {
    try {
      const response = await fetch('/api/admin/settings/payment');
      if (response.ok) {
        const data = await response.json();
        setAccounts(data);
      }
    } catch (error) {
      console.error('계좌 목록 조회 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  // 계좌번호 마스킹 처리
  const maskAccountNumber = (accountNumber: string) => {
    if (!accountNumber || accountNumber.length < 8) return accountNumber;
    const visiblePart = 4; // 앞뒤 4자리씩 표시
    const masked = accountNumber.slice(0, visiblePart) + 
                   '*'.repeat(accountNumber.length - visiblePart * 2) + 
                   accountNumber.slice(-visiblePart);
    return masked;
  };

  // 계좌 정보 복사
  const copyToClipboard = async (text: string, accountId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(accountId);
      setTimeout(() => setCopied(null), 2000);
    } catch (error) {
      console.error('복사 실패:', error);
    }
  };

  // 폼 제출 처리
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const url = editingId 
        ? `/api/admin/settings/payment/${editingId}`
        : '/api/admin/settings/payment';
      
      const method = editingId ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        await fetchAccounts();
        setShowForm(false);
        setEditingId(null);
        setFormData({
          bank_name: '',
          account_number: '',
          account_holder: '',
          is_primary: false
        });
      } else {
        const error = await response.json();
        alert(error.message || '저장에 실패했습니다.');
      }
    } catch (error) {
      console.error('계좌 저장 실패:', error);
      alert('계좌 정보 저장에 실패했습니다.');
    }
  };

  // 계좌 삭제
  const handleDelete = async (id: string) => {
    if (!confirm('정말로 이 계좌를 삭제하시겠습니까?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/settings/payment/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await fetchAccounts();
      } else {
        const error = await response.json();
        alert(error.message || '삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('계좌 삭제 실패:', error);
      alert('계좌 삭제에 실패했습니다.');
    }
  };

  // 기본 계좌 설정
  const handleSetPrimary = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/settings/payment/${id}/primary`, {
        method: 'PUT'
      });

      if (response.ok) {
        await fetchAccounts();
      }
    } catch (error) {
      console.error('기본 계좌 설정 실패:', error);
    }
  };

  // 계좌 활성화/비활성화
  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/admin/settings/payment/${id}/toggle`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !isActive })
      });

      if (response.ok) {
        await fetchAccounts();
      }
    } catch (error) {
      console.error('계좌 상태 변경 실패:', error);
    }
  };

  // 수정 모드 설정
  const handleEdit = (account: PaymentAccount) => {
    setEditingId(account.id);
    setFormData({
      bank_name: account.bank_name,
      account_number: account.account_number,
      account_holder: account.account_holder,
      is_primary: account.is_primary
    });
    setShowForm(true);
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* 헤더 */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-6">
          <Link
            href="/admin/settings"
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-bold dark:text-white">계좌 관리</h1>
        </div>
        
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
          <div className="flex gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                보안 주의사항
              </p>
              <p className="text-sm text-amber-700 dark:text-amber-300">
                계좌번호는 암호화되어 저장되며, 관리자만 전체 번호를 확인할 수 있습니다.
                고객에게는 일부만 마스킹되어 표시됩니다.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 계좌 목록 */}
      <div className="space-y-4 mb-6">
        {isLoading ? (
          <div className="text-center py-8 text-gray-500">
            계좌 정보를 불러오는 중...
          </div>
        ) : accounts.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
            <Banknote className="w-12 h-12 mx-auto text-gray-400 mb-3" />
            <p className="text-gray-600 dark:text-gray-400">
              등록된 계좌가 없습니다.
            </p>
          </div>
        ) : (
          <AnimatePresence>
            {accounts.map((account) => (
              <motion.div
                key={account.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`bg-white dark:bg-gray-800 rounded-lg border ${
                  account.is_active 
                    ? 'border-gray-200 dark:border-gray-700' 
                    : 'border-gray-300 dark:border-gray-600 opacity-60'
                } p-6`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-lg font-semibold dark:text-white">
                        {account.bank_name}
                      </h3>
                      {account.is_primary && (
                        <span className="flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-medium rounded">
                          <Star className="w-3 h-3" />
                          기본계좌
                        </span>
                      )}
                      {!account.is_active && (
                        <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs font-medium rounded">
                          비활성
                        </span>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500 dark:text-gray-400 w-20">
                          계좌번호:
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-gray-900 dark:text-gray-100">
                            {showPassword === account.id 
                              ? account.account_number 
                              : maskAccountNumber(account.account_number)}
                          </span>
                          <button
                            onClick={() => setShowPassword(
                              showPassword === account.id ? null : account.id
                            )}
                            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                          >
                            {showPassword === account.id ? (
                              <EyeOff className="w-4 h-4 text-gray-500" />
                            ) : (
                              <Eye className="w-4 h-4 text-gray-500" />
                            )}
                          </button>
                          <button
                            onClick={() => copyToClipboard(
                              `${account.bank_name} ${account.account_number} ${account.account_holder}`,
                              account.id
                            )}
                            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                          >
                            {copied === account.id ? (
                              <Check className="w-4 h-4 text-green-600" />
                            ) : (
                              <Copy className="w-4 h-4 text-gray-500" />
                            )}
                          </button>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500 dark:text-gray-400 w-20">
                          예금주:
                        </span>
                        <span className="text-gray-900 dark:text-gray-100">
                          {account.account_holder}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    {!account.is_primary && account.is_active && (
                      <button
                        onClick={() => handleSetPrimary(account.id)}
                        className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                        title="기본 계좌로 설정"
                      >
                        <Star className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleToggleActive(account.id, account.is_active)}
                      className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                        account.is_active
                          ? 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600'
                          : 'bg-green-100 hover:bg-green-200 dark:bg-green-900/30 dark:hover:bg-green-900/50 text-green-700 dark:text-green-300'
                      }`}
                    >
                      {account.is_active ? '비활성화' : '활성화'}
                    </button>
                    <button
                      onClick={() => handleEdit(account)}
                      className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    {!account.is_primary && (
                      <button
                        onClick={() => handleDelete(account.id)}
                        className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* 계좌 추가 버튼 */}
      {!showForm && (
        <button
          onClick={() => {
            setShowForm(true);
            setEditingId(null);
            setFormData({
              bank_name: '',
              account_number: '',
              account_holder: '',
              is_primary: accounts.length === 0
            });
          }}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" />
          계좌 추가
        </button>
      )}

      {/* 계좌 추가/수정 폼 */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mt-4"
          >
            <h3 className="text-lg font-semibold mb-4 dark:text-white">
              {editingId ? '계좌 정보 수정' : '새 계좌 추가'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  은행명
                </label>
                <input
                  type="text"
                  value={formData.bank_name}
                  onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="예: 국민은행"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  계좌번호
                </label>
                <input
                  type="text"
                  value={formData.account_number}
                  onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                  placeholder="숫자만 입력 (예: 12345678901234)"
                  pattern="[0-9-]+"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  예금주
                </label>
                <input
                  type="text"
                  value={formData.account_holder}
                  onChange={(e) => setFormData({ ...formData, account_holder: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="예: 홍길동"
                  required
                />
              </div>

              {accounts.length > 0 && (
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_primary"
                    checked={formData.is_primary}
                    onChange={(e) => setFormData({ ...formData, is_primary: e.target.checked })}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="is_primary" className="text-sm text-gray-700 dark:text-gray-300">
                    기본 계좌로 설정
                  </label>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {editingId ? '수정' : '저장'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingId(null);
                    setFormData({
                      bank_name: '',
                      account_number: '',
                      account_holder: '',
                      is_primary: false
                    });
                  }}
                  className="px-6 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg transition-colors"
                >
                  취소
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}