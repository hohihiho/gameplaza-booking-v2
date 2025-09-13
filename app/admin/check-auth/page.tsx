'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/db';

export default function CheckAuthPage() {
  const [supabaseUser, setSupabaseUser] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [adminData, setAdminData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [supabase] = useState(() => createClient());

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    setLoading(true);
    
    try {
      // 1. Supabase Auth 상태 확인
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      console.log('Supabase Auth User:', user);
      console.log('Supabase Auth Error:', authError);
      setSupabaseUser(user);
      
      if (user) {
        // 2. users 테이블에서 사용자 정보 조회
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();
        
        console.log('User Data:', userData);
        console.log('User Error:', userError);
        setUserData(userData);
        
        if (userData) {
          // 3. admins 테이블에서 관리자 정보 조회
          const { data: adminData, error: adminError } = await supabase
            .from('admins')
            .select('*')
            .eq('user_id', userData.id)
            .single();
          
          console.log('Admin Data:', adminData);
          console.log('Admin Error:', adminError);
          setAdminData(adminData);
        }
      }
      
      // 4. NextAuth 세션도 확인
      try {
        const response = await fetch('/api/auth/session');
        const session = await response.json();
        console.log('NextAuth Session:', session);
      } catch (error) {
        console.error('NextAuth session error:', error);
      }
      
    } catch (error) {
      console.error('Auth check error:', error);
    } finally {
      setLoading(false);
    }
  };

  const testAPI = async () => {
    try {
      const response = await fetch('/api/v2/admin/reservations?limit=5');
      const text = await response.text();
      console.log('API Response Status:', response.status);
      console.log('API Response:', text);
      
      if (response.ok) {
        const data = JSON.parse(text);
        alert(`API 성공! 예약 수: ${data.data?.reservations?.length || 0}`);
      } else {
        alert(`API 실패: ${response.status} - ${text}`);
      }
    } catch (error) {
      console.error('API test error:', error);
      alert(`API 에러: ${error}`);
    }
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-bold mb-4">인증 상태 확인</h1>
      
      <div className="space-y-4">
        <div className="p-4 bg-gray-100 rounded">
          <h2 className="font-bold mb-2">Supabase Auth User</h2>
          <pre className="text-sm overflow-auto">
            {supabaseUser ? JSON.stringify(supabaseUser, null, 2) : 'Not logged in (Supabase)'}
          </pre>
        </div>
        
        <div className="p-4 bg-blue-100 rounded">
          <h2 className="font-bold mb-2">Users Table Data</h2>
          <pre className="text-sm overflow-auto">
            {userData ? JSON.stringify(userData, null, 2) : 'No user data'}
          </pre>
        </div>
        
        <div className="p-4 bg-green-100 rounded">
          <h2 className="font-bold mb-2">Admins Table Data</h2>
          <pre className="text-sm overflow-auto">
            {adminData ? JSON.stringify(adminData, null, 2) : 'Not an admin'}
          </pre>
        </div>
        
        <div className="p-4 bg-yellow-100 rounded">
          <h2 className="font-bold mb-2">권한 요약</h2>
          <p>로그인 상태: {supabaseUser ? '✅ 로그인됨' : '❌ 로그인 안됨'}</p>
          <p>사용자 역할: {userData?.role || 'N/A'}</p>
          <p>관리자 권한: {adminData ? '✅ 관리자' : '❌ 일반 사용자'}</p>
          <p>슈퍼 관리자: {adminData?.is_super_admin ? '✅ 슈퍼 관리자' : '❌ 일반 관리자'}</p>
        </div>
        
        <button
          onClick={testAPI}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          관리자 API 테스트
        </button>
      </div>
    </div>
  );
}