'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function TestApiPage() {
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [supabase] = useState(() => createClient());

  useEffect(() => {
    checkCurrentUser();
  }, []);

  const checkCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      // users 테이블에서 추가 정보 조회
      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();
      
      setCurrentUser({
        ...user,
        ...userData
      });
    }
  };

  const testApi = async () => {
    setLoading(true);
    setError(null);
    setApiResponse(null);

    try {
      const response = await fetch('/api/v2/admin/reservations?limit=10');
      const responseText = await response.text();
      
      console.log('API Response Status:', response.status);
      console.log('API Response Headers:', response.headers);
      console.log('API Response Text:', responseText);
      
      if (!response.ok) {
        setError(`API Error: ${response.status} - ${responseText}`);
        return;
      }
      
      try {
        const data = JSON.parse(responseText);
        setApiResponse(data);
        console.log('Parsed API Response:', data);
      } catch (parseError) {
        setError(`JSON Parse Error: ${parseError}`);
        console.error('Parse error:', parseError);
      }
    } catch (err) {
      setError(`Fetch Error: ${err}`);
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">API Test Page</h1>
      
      {/* 현재 사용자 정보 */}
      <div className="mb-6 p-4 bg-gray-100 rounded">
        <h2 className="font-bold mb-2">Current User Info:</h2>
        {currentUser ? (
          <pre className="text-sm">
            {JSON.stringify({
              id: currentUser.id,
              email: currentUser.email,
              role: currentUser.role,
              isAdmin: currentUser.role === 'admin' || currentUser.role === 'super_admin',
              isSuperAdmin: currentUser.role === 'super_admin'
            }, null, 2)}
          </pre>
        ) : (
          <p>Not logged in</p>
        )}
      </div>
      
      <button
        onClick={testApi}
        disabled={loading}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {loading ? 'Testing...' : 'Test Admin Reservations API'}
      </button>

      {error && (
        <div className="mt-4 p-4 bg-red-100 text-red-700 rounded">
          <h3 className="font-bold">Error:</h3>
          <pre className="mt-2 text-sm whitespace-pre-wrap">{error}</pre>
        </div>
      )}

      {apiResponse && (
        <div className="mt-4 p-4 bg-green-100 text-green-800 rounded">
          <h3 className="font-bold">Success:</h3>
          <pre className="mt-2 text-sm whitespace-pre-wrap overflow-auto">
            {JSON.stringify(apiResponse, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}