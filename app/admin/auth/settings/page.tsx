'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { 
  Settings, 
  Key,
  Shield,
  Clock,
  Globe,
  Save,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Eye,
  EyeOff
} from 'lucide-react';
import { useSession } from '@/lib/auth/client';

interface AuthConfig {
  // OAuth 설정
  googleEnabled: boolean;
  googleClientId: string;
  googleClientSecret: string;
  
  // 세션 설정
  sessionExpiresIn: number; // 초 단위
  sessionUpdateAge: number; // 초 단위
  cookieCacheEnabled: boolean;
  cookieCacheMaxAge: number; // 밀리초 단위
  
  // 보안 설정
  trustedOrigins: string[];
  secretKey: string;
  baseURL: string;
  
  // 기능 설정
  emailPasswordEnabled: boolean;
}

export default function AuthSettingsPage() {
  const { data: session, isPending } = useSession();
  const [config, setConfig] = useState<AuthConfig>({
    googleEnabled: true,
    googleClientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '',
    googleClientSecret: '••••••••••••••••',
    sessionExpiresIn: 7 * 24 * 60 * 60, // 7일
    sessionUpdateAge: 24 * 60 * 60, // 1일
    cookieCacheEnabled: true,
    cookieCacheMaxAge: 5 * 60 * 1000, // 5분
    trustedOrigins: [
      'http://localhost:3000',
      'https://gameplaza-v2.vercel.app',
      'https://gameplaza.kr'
    ],
    secretKey: '••••••••••••••••',
    baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:3000',
    emailPasswordEnabled: false
  });
  
  const [loading, setLoading] = useState(false);
  const [showSecrets, setShowSecrets] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');

  const handleSave = async () => {
    setSaveStatus('saving');
    setLoading(true);
    
    try {
      // TODO: Better Auth 설정 저장 API 호출
      await new Promise(resolve => setTimeout(resolve, 1000)); // 임시 지연
      
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      console.error('Failed to save settings:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const days = Math.floor(seconds / (24 * 60 * 60));
    const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));
    const mins = Math.floor((seconds % (60 * 60)) / 60);
    
    if (days > 0) return `${days}일 ${hours}시간`;
    if (hours > 0) return `${hours}시간 ${mins}분`;
    return `${mins}분`;
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">인증 시스템 설정</h2>
          <p className="text-muted-foreground">OAuth, 세션, 보안 구성 관리</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            onClick={handleSave}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            설정 저장
          </Button>
          {saveStatus === 'success' && (
            <div className="flex items-center text-green-600">
              <CheckCircle className="w-4 h-4 mr-1" />
              저장됨
            </div>
          )}
          {saveStatus === 'error' && (
            <div className="flex items-center text-red-600">
              <AlertCircle className="w-4 h-4 mr-1" />
              오류 발생
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* OAuth 설정 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Globe className="w-5 h-5 mr-2" />
              OAuth 제공업체 설정
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Google OAuth */}
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-red-500 rounded flex items-center justify-center text-white text-xs font-bold">
                    G
                  </div>
                  <span className="font-medium">Google OAuth</span>
                </div>
                <Switch
                  checked={config.googleEnabled}
                  onCheckedChange={(checked) =>
                    setConfig(prev => ({ ...prev, googleEnabled: checked }))
                  }
                />
              </div>
              
              {config.googleEnabled && (
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="googleClientId">Client ID</Label>
                    <Input
                      id="googleClientId"
                      value={config.googleClientId}
                      onChange={(e) =>
                        setConfig(prev => ({ ...prev, googleClientId: e.target.value }))
                      }
                      placeholder="Google OAuth Client ID"
                    />
                  </div>
                  <div>
                    <Label htmlFor="googleClientSecret">Client Secret</Label>
                    <div className="relative">
                      <Input
                        id="googleClientSecret"
                        type={showSecrets ? 'text' : 'password'}
                        value={config.googleClientSecret}
                        onChange={(e) =>
                          setConfig(prev => ({ ...prev, googleClientSecret: e.target.value }))
                        }
                        placeholder="Google OAuth Client Secret"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowSecrets(!showSecrets)}
                      >
                        {showSecrets ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 이메일/비밀번호 로그인 */}
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-medium">이메일/비밀번호 로그인</span>
                  <p className="text-sm text-muted-foreground">
                    현재 비활성화됨 (Google OAuth만 사용)
                  </p>
                </div>
                <Switch
                  checked={config.emailPasswordEnabled}
                  onCheckedChange={(checked) =>
                    setConfig(prev => ({ ...prev, emailPasswordEnabled: checked }))
                  }
                  disabled
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 세션 설정 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="w-5 h-5 mr-2" />
              세션 관리 설정
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="sessionExpiresIn">세션 만료 시간</Label>
              <div className="flex items-center space-x-2">
                <Input
                  id="sessionExpiresIn"
                  type="number"
                  value={config.sessionExpiresIn / (24 * 60 * 60)}
                  onChange={(e) =>
                    setConfig(prev => ({
                      ...prev,
                      sessionExpiresIn: parseInt(e.target.value) * 24 * 60 * 60
                    }))
                  }
                  className="w-20"
                />
                <span className="text-sm text-muted-foreground">일</span>
                <Badge variant="outline">
                  {formatDuration(config.sessionExpiresIn)}
                </Badge>
              </div>
            </div>

            <div>
              <Label htmlFor="sessionUpdateAge">세션 갱신 주기</Label>
              <div className="flex items-center space-x-2">
                <Input
                  id="sessionUpdateAge"
                  type="number"
                  value={config.sessionUpdateAge / (60 * 60)}
                  onChange={(e) =>
                    setConfig(prev => ({
                      ...prev,
                      sessionUpdateAge: parseInt(e.target.value) * 60 * 60
                    }))
                  }
                  className="w-20"
                />
                <span className="text-sm text-muted-foreground">시간</span>
                <Badge variant="outline">
                  {formatDuration(config.sessionUpdateAge)}
                </Badge>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>쿠키 캐시</Label>
                <p className="text-sm text-muted-foreground">
                  세션 정보를 브라우저에 캐시하여 성능 향상
                </p>
              </div>
              <Switch
                checked={config.cookieCacheEnabled}
                onCheckedChange={(checked) =>
                  setConfig(prev => ({ ...prev, cookieCacheEnabled: checked }))
                }
              />
            </div>

            {config.cookieCacheEnabled && (
              <div>
                <Label htmlFor="cookieCacheMaxAge">캐시 유지 시간</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="cookieCacheMaxAge"
                    type="number"
                    value={config.cookieCacheMaxAge / (60 * 1000)}
                    onChange={(e) =>
                      setConfig(prev => ({
                        ...prev,
                        cookieCacheMaxAge: parseInt(e.target.value) * 60 * 1000
                      }))
                    }
                    className="w-20"
                  />
                  <span className="text-sm text-muted-foreground">분</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 보안 설정 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="w-5 h-5 mr-2" />
              보안 설정
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="baseURL">Base URL</Label>
              <Input
                id="baseURL"
                value={config.baseURL}
                onChange={(e) =>
                  setConfig(prev => ({ ...prev, baseURL: e.target.value }))
                }
                placeholder="https://your-domain.com"
              />
              <p className="text-sm text-muted-foreground mt-1">
                콜백 URL의 기본 도메인
              </p>
            </div>

            <div>
              <Label htmlFor="secretKey">Secret Key</Label>
              <div className="relative">
                <Input
                  id="secretKey"
                  type={showSecrets ? 'text' : 'password'}
                  value={config.secretKey}
                  onChange={(e) =>
                    setConfig(prev => ({ ...prev, secretKey: e.target.value }))
                  }
                  placeholder="암호화에 사용되는 비밀 키"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowSecrets(!showSecrets)}
                >
                  {showSecrets ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>

            <div>
              <Label htmlFor="trustedOrigins">신뢰할 수 있는 도메인</Label>
              <Textarea
                id="trustedOrigins"
                value={config.trustedOrigins.join('\n')}
                onChange={(e) =>
                  setConfig(prev => ({
                    ...prev,
                    trustedOrigins: e.target.value.split('\n').filter(Boolean)
                  }))
                }
                placeholder="https://example.com"
                rows={4}
              />
              <p className="text-sm text-muted-foreground mt-1">
                한 줄에 하나씩 입력 (CORS 설정에 사용)
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 시스템 정보 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Settings className="w-5 h-5 mr-2" />
              시스템 정보
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Better Auth 버전</Label>
                <p className="text-sm font-mono">^1.0.0</p>
              </div>
              <div>
                <Label>데이터베이스</Label>
                <p className="text-sm">메모리 어댑터 (개발)</p>
              </div>
              <div>
                <Label>환경</Label>
                <Badge variant="outline">개발 환경</Badge>
              </div>
              <div>
                <Label>상태</Label>
                <Badge variant="default" className="bg-green-600">
                  정상 작동
                </Badge>
              </div>
            </div>

            <div className="pt-4 border-t">
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <AlertCircle className="w-4 h-4" />
                <span>
                  프로덕션 환경에서는 반드시 환경 변수로 민감한 정보를 관리하세요.
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}