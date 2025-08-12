// 관리자 관리 페이지
// 비전공자 설명: 슈퍼관리자가 다른 관리자를 추가/삭제하는 페이지입니다
'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  UserCog,
  Plus,
  Trash2,
  Crown,
  Shield,
  AlertCircle,
  Check,
  X,
  Mail,
  Calendar
} from 'lucide-react';
import { useRouter } from 'next/navigation';

type Admin = {
  id: string;
  userId: string;
  user: {
    id: string;
    email: string;
    fullName: string;
    profileImageUrl?: string;
  };
  permissions: any;
  isSuperAdmin: boolean;
  createdAt: string;
  updatedAt: string;
};

export default function AdminManagementPage() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [adding, setAdding] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const router = useRouter();

  // 현재 사용자 권한 확인
  useEffect(() => {
    checkCurrentUserRole();
  }, []);

  // 관리자 목록 로드
  useEffect(() => {
    if (currentUserRole === 'super_admin') {
      loadAdmins();
    }
  }, [currentUserRole]);

  const checkCurrentUserRole = async () => {
    try {
      const response = await fetch('/api/admin/auth/check');
      const data = await response.json();

      if (!response.ok || !data.isAdmin) {
        setError('관리자 권한이 없습니다');
        setLoading(false);
        router.push('/');
        return;
      }

      // 임시로 ndz5496@gmail.com은 슈퍼관리자로 인정
      if (data.email === 'ndz5496@gmail.com') {
        console.log('ndz5496 슈퍼관리자 권한 허용');
        setCurrentUserRole('super_admin');
      } else if (data.role !== 'super_admin') {
        setError('슈퍼관리자만 접근할 수 있습니다');
        setLoading(false);
        router.push('/admin');
        return;
      }

      setCurrentUserRole(data.role);
    } catch (err) {
      console.error('권한 확인 오류:', err);
      setError('권한 확인 중 오류가 발생했습니다');
      setLoading(false);
    }
  };

  const loadAdmins = async () => {
    try {
      const response = await fetch('/api/admin/admins');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '관리자 목록 로드 실패');
      }

      console.log('API 응답:', data);
      setAdmins(data.admins || []);
    } catch (err: any) {
      console.error('관리자 목록 로드 오류:', err);
      setError(err.message || '관리자 목록을 불러오는데 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  const addAdmin = async () => {
    if (!newAdminEmail.trim()) {
      setError('이메일을 입력해주세요');
      return;
    }

    setAdding(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/admin/admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newAdminEmail })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '관리자 추가 실패');
      }

      setSuccess('관리자가 추가되었습니다');
      setNewAdminEmail('');
      await loadAdmins();
    } catch (err: any) {
      console.error('관리자 추가 오류:', err);
      setError(err.message || '관리자 추가에 실패했습니다');
    } finally {
      setAdding(false);
    }
  };

  const removeAdmin = async (adminId: string) => {
    if (!confirm('정말로 이 관리자를 삭제하시겠습니까?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/admins/${adminId}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '관리자 삭제 실패');
      }

      setSuccess('관리자가 삭제되었습니다');
      await loadAdmins();
    } catch (err: any) {
      console.error('관리자 삭제 오류:', err);
      setError(err.message || '관리자 삭제에 실패했습니다');
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (currentUserRole !== 'super_admin') {
    return (
      <div className="p-6">
        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg flex items-center space-x-3">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
          <p className="text-red-700 dark:text-red-300">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <UserCog className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">관리자 관리</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              시스템 관리자를 추가하고 관리합니다
            </p>
          </div>
        </div>
      </div>

      {/* 알림 메시지 */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg flex items-center space-x-3"
        >
          <X className="w-5 h-5 text-red-600 dark:text-red-400" />
          <p className="text-red-700 dark:text-red-300">{error}</p>
        </motion.div>
      )}

      {success && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg flex items-center space-x-3"
        >
          <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
          <p className="text-green-700 dark:text-green-300">{success}</p>
        </motion.div>
      )}

      {/* 관리자 추가 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4">새 관리자 추가</h2>
        <div className="flex gap-4">
          <input
            type="email"
            value={newAdminEmail}
            onChange={(e) => setNewAdminEmail(e.target.value)}
            placeholder="관리자 이메일 입력"
            className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary
                     dark:bg-gray-700 dark:border-gray-600"
            onKeyPress={(e) => e.key === 'Enter' && addAdmin()}
          />
          <button
            onClick={addAdmin}
            disabled={adding}
            className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 
                     disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>{adding ? '추가 중...' : '추가'}</span>
          </button>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
          * 해당 이메일로 가입한 사용자만 관리자로 추가할 수 있습니다
        </p>
      </div>

      {/* 관리자 목록 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b dark:border-gray-700">
          <h2 className="text-lg font-semibold">관리자 목록</h2>
        </div>
        
        <div className="divide-y dark:divide-gray-700">
          {admins.map(admin => (
            <div key={admin.id} className="p-6 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50">
              <div className="flex items-center space-x-4">
                <div className={`p-2 rounded-lg ${
                  admin.isSuperAdmin 
                    ? 'bg-yellow-100 dark:bg-yellow-900/20' 
                    : 'bg-primary/10'
                }`}>
                  {admin.isSuperAdmin ? (
                    <Crown className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                  ) : (
                    <Shield className="w-5 h-5 text-primary" />
                  )}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span className="font-medium">{admin.user.email}</span>
                    {admin.isSuperAdmin && (
                      <span className="text-xs px-2 py-1 bg-yellow-100 dark:bg-yellow-900/20 
                                     text-yellow-700 dark:text-yellow-300 rounded-full">
                        슈퍼관리자
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2 mt-1">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {admin.createdAt ? new Date(admin.createdAt).toLocaleDateString('ko-KR') : '날짜 없음'}부터
                    </span>
                  </div>
                </div>
              </div>

              {!admin.isSuperAdmin && (
                <button
                  onClick={() => removeAdmin(admin.id)}
                  className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 
                           dark:hover:bg-red-900/20 rounded-lg transition"
                  title="관리자 삭제"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              )}
            </div>
          ))}

          {admins.length === 0 && (
            <div className="p-12 text-center text-gray-500 dark:text-gray-400">
              등록된 관리자가 없습니다
            </div>
          )}
        </div>
      </div>
    </div>
  );
}