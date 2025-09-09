'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  MessageCircle, 
  Clock,
  Plus,
  Trash2,
  Save,
  Loader2,
  ExternalLink
} from 'lucide-react';

interface SocialLink {
  id?: number;
  platform: string;
  name: string;
  url: string;
  description: string;
  icon: string;
  bgColor: string;
  hoverColor: string;
  textColor: string;
  sortOrder: number;
  isActive: boolean;
}

interface OperatingHours {
  id?: number;
  dayOfWeek: number;
  openTime: string;
  closeTime: string;
  isClosed: boolean;
  specialNote: string;
}

interface BusinessInfo {
  id: number;
  name: string;
  description: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  kakaoChat: string;
  maps: {
    naver: string;
    kakao: string;
    google: string;
  };
  transportation: {
    subway?: string;
    bus?: string;
  };
  parking: string;
  socialLinks: SocialLink[];
  operatingHours: OperatingHours[];
  createdAt: string;
  updatedAt: string;
}

const DAYS_OF_WEEK = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];

const DEFAULT_SOCIAL_PLATFORMS = [
  { value: 'twitter', label: 'X (Twitter)', icon: 'x', bgColor: 'bg-black', hoverColor: 'hover:bg-gray-700', textColor: 'text-white' },
  { value: 'youtube', label: '유튜브', icon: 'youtube', bgColor: 'bg-red-600', hoverColor: 'hover:bg-red-700', textColor: 'text-white' },
  { value: 'kakao', label: '카카오톡', icon: 'kakao', bgColor: 'bg-yellow-400', hoverColor: 'hover:bg-yellow-500', textColor: 'text-black' },
  { value: 'discord', label: '디스코드', icon: 'discord', bgColor: 'bg-indigo-600', hoverColor: 'hover:bg-indigo-700', textColor: 'text-white' },
  { value: 'instagram', label: '인스타그램', icon: 'instagram', bgColor: 'bg-gradient-to-r from-purple-500 to-pink-500', hoverColor: 'hover:from-purple-600 hover:to-pink-600', textColor: 'text-white' },
  { value: 'facebook', label: '페이스북', icon: 'facebook', bgColor: 'bg-blue-600', hoverColor: 'hover:bg-blue-700', textColor: 'text-white' }
];

export default function BusinessInfoPage() {
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // 데이터 로딩
  useEffect(() => {
    fetchBusinessInfo();
  }, []);

  const fetchBusinessInfo = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/cms/business-info');
      
      if (!response.ok) {
        throw new Error('비즈니스 정보를 불러올 수 없습니다.');
      }

      const data = await response.json();
      setBusinessInfo(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!businessInfo) return;

    try {
      setSaving(true);
      const response = await fetch('/api/admin/cms/business-info', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(businessInfo),
      });

      if (!response.ok) {
        throw new Error('비즈니스 정보 저장에 실패했습니다.');
      }

      const result = await response.json();
      setSuccessMessage('비즈니스 정보가 성공적으로 저장되었습니다.');
      setError(null);

      // 성공 메시지 3초 후 자동 숨김
      setTimeout(() => setSuccessMessage(null), 3000);

      // 데이터 다시 불러오기
      await fetchBusinessInfo();
    } catch (err) {
      setError(err instanceof Error ? err.message : '저장 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const updateBusinessInfo = (field: keyof BusinessInfo, value: any) => {
    if (!businessInfo) return;
    
    setBusinessInfo({
      ...businessInfo,
      [field]: value
    });
  };

  const updateMaps = (mapType: keyof BusinessInfo['maps'], url: string) => {
    if (!businessInfo) return;

    setBusinessInfo({
      ...businessInfo,
      maps: {
        ...businessInfo.maps,
        [mapType]: url
      }
    });
  };

  const updateTransportation = (transportType: keyof BusinessInfo['transportation'], value: string) => {
    if (!businessInfo) return;

    setBusinessInfo({
      ...businessInfo,
      transportation: {
        ...businessInfo.transportation,
        [transportType]: value
      }
    });
  };

  const addSocialLink = () => {
    if (!businessInfo) return;

    const newLink: SocialLink = {
      platform: 'twitter',
      name: 'X',
      url: '',
      description: '',
      icon: 'x',
      bgColor: 'bg-black',
      hoverColor: 'hover:bg-gray-700',
      textColor: 'text-white',
      sortOrder: businessInfo.socialLinks.length,
      isActive: true
    };

    setBusinessInfo({
      ...businessInfo,
      socialLinks: [...businessInfo.socialLinks, newLink]
    });
  };

  const updateSocialLink = (index: number, field: keyof SocialLink, value: any) => {
    if (!businessInfo) return;

    const updatedLinks = [...businessInfo.socialLinks];
    updatedLinks[index] = {
      ...updatedLinks[index],
      [field]: value
    };

    // 플랫폼 변경 시 기본값 설정
    if (field === 'platform') {
      const platform = DEFAULT_SOCIAL_PLATFORMS.find(p => p.value === value);
      if (platform) {
        updatedLinks[index] = {
          ...updatedLinks[index],
          name: platform.label,
          icon: platform.icon,
          bgColor: platform.bgColor,
          hoverColor: platform.hoverColor,
          textColor: platform.textColor
        };
      }
    }

    setBusinessInfo({
      ...businessInfo,
      socialLinks: updatedLinks
    });
  };

  const removeSocialLink = (index: number) => {
    if (!businessInfo) return;

    const updatedLinks = businessInfo.socialLinks.filter((_, i) => i !== index);
    
    setBusinessInfo({
      ...businessInfo,
      socialLinks: updatedLinks
    });
  };

  const updateOperatingHours = (index: number, field: keyof OperatingHours, value: any) => {
    if (!businessInfo) return;

    const updatedHours = [...businessInfo.operatingHours];
    updatedHours[index] = {
      ...updatedHours[index],
      [field]: value
    };

    setBusinessInfo({
      ...businessInfo,
      operatingHours: updatedHours
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Loader2 className="w-8 h-8 animate-spin" />
        <span className="ml-2">비즈니스 정보를 불러오는 중...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <p className="text-red-800">{error}</p>
        <Button 
          onClick={fetchBusinessInfo} 
          className="mt-4"
          variant="outline"
        >
          다시 시도
        </Button>
      </div>
    );
  }

  if (!businessInfo) {
    return (
      <div className="text-center py-12">
        <p>비즈니스 정보를 찾을 수 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">비즈니스 정보 관리</h1>
          <p className="text-gray-600 mt-2">오시는 길, 연락처, 소셜미디어 등 기본 정보를 관리합니다.</p>
        </div>
        <Button 
          onClick={handleSave} 
          disabled={saving}
          className="flex items-center gap-2"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              저장 중...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              저장하기
            </>
          )}
        </Button>
      </div>

      {/* 성공/오류 메시지 */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-800">{successMessage}</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* 기본 정보 */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
          <MapPin className="w-5 h-5" />
          기본 정보
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="name">업체명</Label>
            <Input
              id="name"
              value={businessInfo.name}
              onChange={(e) => updateBusinessInfo('name', e.target.value)}
              placeholder="광주 게임플라자"
            />
          </div>

          <div>
            <Label htmlFor="description">업체 설명</Label>
            <Input
              id="description"
              value={businessInfo.description || ''}
              onChange={(e) => updateBusinessInfo('description', e.target.value)}
              placeholder="리듬게임 전문 아케이드 게임센터"
            />
          </div>

          <div className="md:col-span-2">
            <Label htmlFor="address">주소</Label>
            <Input
              id="address"
              value={businessInfo.address}
              onChange={(e) => updateBusinessInfo('address', e.target.value)}
              placeholder="광주광역시 동구 충장로안길 6"
            />
          </div>

          <div>
            <Label htmlFor="phone">전화번호</Label>
            <Input
              id="phone"
              value={businessInfo.phone || ''}
              onChange={(e) => updateBusinessInfo('phone', e.target.value)}
              placeholder="062-123-4567"
            />
          </div>

          <div>
            <Label htmlFor="email">이메일</Label>
            <Input
              id="email"
              type="email"
              value={businessInfo.email || ''}
              onChange={(e) => updateBusinessInfo('email', e.target.value)}
              placeholder="contact@gameplaza.kr"
            />
          </div>

          <div>
            <Label htmlFor="website">웹사이트</Label>
            <Input
              id="website"
              value={businessInfo.website || ''}
              onChange={(e) => updateBusinessInfo('website', e.target.value)}
              placeholder="https://gameplaza.kr"
            />
          </div>

          <div>
            <Label htmlFor="kakaoChat">카카오톡 오픈채팅</Label>
            <Input
              id="kakaoChat"
              value={businessInfo.kakaoChat || ''}
              onChange={(e) => updateBusinessInfo('kakaoChat', e.target.value)}
              placeholder="https://open.kakao.com/..."
            />
          </div>
        </div>
      </Card>

      {/* 지도 링크 */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
          <Globe className="w-5 h-5" />
          지도 링크
        </h2>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="naverMap">네이버 지도</Label>
            <div className="flex gap-2">
              <Input
                id="naverMap"
                value={businessInfo.maps.naver}
                onChange={(e) => updateMaps('naver', e.target.value)}
                placeholder="https://map.naver.com/v5/search/..."
                className="flex-1"
              />
              {businessInfo.maps.naver && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(businessInfo.maps.naver, '_blank')}
                >
                  <ExternalLink className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="kakaoMap">카카오 지도</Label>
            <div className="flex gap-2">
              <Input
                id="kakaoMap"
                value={businessInfo.maps.kakao}
                onChange={(e) => updateMaps('kakao', e.target.value)}
                placeholder="https://place.map.kakao.com/..."
                className="flex-1"
              />
              {businessInfo.maps.kakao && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(businessInfo.maps.kakao, '_blank')}
                >
                  <ExternalLink className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="googleMap">구글 지도</Label>
            <div className="flex gap-2">
              <Input
                id="googleMap"
                value={businessInfo.maps.google}
                onChange={(e) => updateMaps('google', e.target.value)}
                placeholder="https://www.google.com/maps/search/..."
                className="flex-1"
              />
              {businessInfo.maps.google && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(businessInfo.maps.google, '_blank')}
                >
                  <ExternalLink className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* 교통 및 주차 정보 */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-6">교통 및 주차 정보</h2>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="subway">지하철 안내</Label>
            <Textarea
              id="subway"
              value={businessInfo.transportation.subway || ''}
              onChange={(e) => updateTransportation('subway', e.target.value)}
              placeholder="금남로4가역 3번 출구 도보 3분 (광주 도시철도 1호선)"
              rows={2}
            />
          </div>

          <div>
            <Label htmlFor="bus">버스 안내</Label>
            <Textarea
              id="bus"
              value={businessInfo.transportation.bus || ''}
              onChange={(e) => updateTransportation('bus', e.target.value)}
              placeholder="금남로4가 정류장 하차 (금남58, 금남59, 수완12, 첨단95, 좌석02 등)"
              rows={2}
            />
          </div>

          <div>
            <Label htmlFor="parking">주차 안내</Label>
            <Textarea
              id="parking"
              value={businessInfo.parking || ''}
              onChange={(e) => updateBusinessInfo('parking', e.target.value)}
              placeholder="인근 유료주차장 이용"
              rows={2}
            />
          </div>
        </div>
      </Card>

      {/* 소셜 미디어 링크 */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            소셜 미디어 링크
          </h2>
          <Button onClick={addSocialLink} size="sm" variant="outline">
            <Plus className="w-4 h-4 mr-1" />
            추가
          </Button>
        </div>
        
        <div className="space-y-4">
          {businessInfo.socialLinks.map((link, index) => (
            <div key={index} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium">소셜 링크 {index + 1}</h3>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={link.isActive}
                    onCheckedChange={(checked) => updateSocialLink(index, 'isActive', checked)}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeSocialLink(index)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>플랫폼</Label>
                  <select
                    value={link.platform}
                    onChange={(e) => updateSocialLink(index, 'platform', e.target.value)}
                    className="w-full p-2 border rounded-md"
                  >
                    {DEFAULT_SOCIAL_PLATFORMS.map(platform => (
                      <option key={platform.value} value={platform.value}>
                        {platform.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label>표시 이름</Label>
                  <Input
                    value={link.name}
                    onChange={(e) => updateSocialLink(index, 'name', e.target.value)}
                    placeholder="X"
                  />
                </div>

                <div className="md:col-span-2">
                  <Label>URL</Label>
                  <Input
                    value={link.url}
                    onChange={(e) => updateSocialLink(index, 'url', e.target.value)}
                    placeholder="https://twitter.com/..."
                  />
                </div>

                <div className="md:col-span-2">
                  <Label>설명</Label>
                  <Input
                    value={link.description}
                    onChange={(e) => updateSocialLink(index, 'description', e.target.value)}
                    placeholder="최신 소식과 이벤트"
                  />
                </div>
              </div>
            </div>
          ))}

          {businessInfo.socialLinks.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p>등록된 소셜 미디어 링크가 없습니다.</p>
              <Button onClick={addSocialLink} className="mt-4" variant="outline">
                <Plus className="w-4 h-4 mr-1" />
                첫 번째 링크 추가
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* 영업시간 */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
          <Clock className="w-5 h-5" />
          영업시간
        </h2>
        
        <div className="space-y-4">
          {businessInfo.operatingHours.map((hours, index) => (
            <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end p-4 border rounded-lg">
              <div>
                <Label>{DAYS_OF_WEEK[hours.dayOfWeek]}</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Switch
                    checked={!hours.isClosed}
                    onCheckedChange={(checked) => updateOperatingHours(index, 'isClosed', !checked)}
                  />
                  <span className="text-sm text-gray-600">
                    {hours.isClosed ? '휴무' : '영업'}
                  </span>
                </div>
              </div>

              {!hours.isClosed && (
                <>
                  <div>
                    <Label>시작 시간</Label>
                    <Input
                      type="time"
                      value={hours.openTime || ''}
                      onChange={(e) => updateOperatingHours(index, 'openTime', e.target.value)}
                    />
                  </div>

                  <div>
                    <Label>종료 시간</Label>
                    <Input
                      type="time"
                      value={hours.closeTime || ''}
                      onChange={(e) => updateOperatingHours(index, 'closeTime', e.target.value)}
                    />
                  </div>
                </>
              )}

              <div>
                <Label>특별 안내</Label>
                <Input
                  value={hours.specialNote || ''}
                  onChange={(e) => updateOperatingHours(index, 'specialNote', e.target.value)}
                  placeholder="특별한 안내사항"
                />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* 저장 버튼 (하단) */}
      <div className="flex justify-end">
        <Button 
          onClick={handleSave} 
          disabled={saving}
          size="lg"
          className="flex items-center gap-2"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              저장 중...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              저장하기
            </>
          )}
        </Button>
      </div>
    </div>
  );
}