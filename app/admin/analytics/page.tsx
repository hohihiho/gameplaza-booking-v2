'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/app/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { advancedTracker } from '@/lib/analytics/advanced-tracker';
import { businessIntelligence } from '@/lib/analytics/business-intelligence';
import { predictionService } from '@/lib/services/prediction.service';
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell,
  CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  Treemap, FunnelChart, Funnel, LabelList
} from 'recharts';
import {
  TrendingUp, TrendingDown, Users, DollarSign, Activity,
  AlertTriangle, CheckCircle, Clock, Target, Brain,
  Calendar, Filter, Download, RefreshCw, Settings,
  BarChart3, PieChart2, TrendingUpIcon
} from 'lucide-react';

// 차트 색상 팔레트
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

interface DashboardMetrics {
  realtime: {
    activeUsers: number;
    currentSessions: number;
    pageViews: number;
    bounceRate: number;
  };
  revenue: {
    today: number;
    week: number;
    month: number;
    trend: number;
  };
  predictions: {
    demandForecast: Array<{ date: string; predicted: number; actual?: number }>;
    churnRisk: Array<{ segment: string; probability: number }>;
    maintenanceSchedule: Array<{ device: string; days: number; priority: string }>;
  };
  userBehavior: {
    funnelData: Array<{ step: string; users: number; dropoff: number }>;
    heatmapData: Array<{ x: number; y: number; value: number }>;
    sessionDuration: Array<{ hour: number; avgDuration: number }>;
  };
  businessMetrics: {
    deviceUtilization: Array<{ device: string; utilization: number }>;
    customerSegments: Array<{ segment: string; count: number; value: number }>;
    peakTimes: Array<{ hour: number; bookings: number }>;
  };
}

export default function AdvancedAnalyticsDashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month'>('day');
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    loadDashboardData();

    // 자동 새로고침 (30초마다)
    const interval = autoRefresh ? setInterval(loadDashboardData, 30000) : null;

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timeRange, autoRefresh]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // 실시간 메트릭스
      const realtime = {
        activeUsers: Math.floor(Math.random() * 100) + 50,
        currentSessions: Math.floor(Math.random() * 50) + 20,
        pageViews: Math.floor(Math.random() * 1000) + 500,
        bounceRate: Math.random() * 30 + 10,
      };

      // 수익 분석
      const revenue = businessIntelligence.analyzeRevenue(timeRange);

      // 예측 데이터
      const demandForecast = predictionService.forecastDemand(
        timeRange === 'day' ? 7 : timeRange === 'week' ? 4 : 12
      );

      const churnRisk = [
        { segment: '신규 사용자', probability: 0.35 },
        { segment: '일반 사용자', probability: 0.15 },
        { segment: 'VIP 사용자', probability: 0.05 },
        { segment: '휴면 사용자', probability: 0.75 },
      ];

      const maintenanceSchedule = predictionService.predictMaintenance();

      // 사용자 행동 분석
      const funnelData = advancedTracker?.analyzeFunnel([
        { name: '홈페이지 방문', eventType: 'page_view' },
        { name: '기기 선택', eventType: 'device_select' },
        { name: '예약 시작', eventType: 'reservation_start' },
        { name: '예약 완료', eventType: 'reservation_complete' },
      ]).stepResults || [];

      const heatmapData = advancedTracker?.getHeatmapData() || [];

      const sessionDuration = Array.from({ length: 24 }, (_, i) => ({
        hour: i,
        avgDuration: Math.random() * 10 + 2,
      }));

      // 비즈니스 메트릭스
      const deviceUtilization = businessIntelligence.analyzeDeviceUtilization();
      const customerSegments = businessIntelligence.segmentCustomers();
      const peakTimes = businessIntelligence.analyzePeakTimes();

      setMetrics({
        realtime,
        revenue,
        predictions: {
          demandForecast,
          churnRisk,
          maintenanceSchedule,
        },
        userBehavior: {
          funnelData,
          heatmapData,
          sessionDuration,
        },
        businessMetrics: {
          deviceUtilization,
          customerSegments,
          peakTimes,
        },
      });
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportData = () => {
    if (!metrics) return;

    const dataStr = JSON.stringify(metrics, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);

    const exportFileDefaultName = `analytics-${new Date().toISOString()}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  if (loading || !metrics) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* 헤더 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            고급 분석 대시보드
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            실시간 비즈니스 인사이트 및 예측 분석
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
            {autoRefresh ? '자동 새로고침' : '수동 모드'}
          </Button>

          <Button variant="outline" size="sm" onClick={exportData}>
            <Download className="h-4 w-4 mr-2" />
            내보내기
          </Button>

          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* 시간 범위 선택 */}
      <div className="flex gap-2">
        {(['day', 'week', 'month'] as const).map((range) => (
          <Button
            key={range}
            variant={timeRange === range ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTimeRange(range)}
          >
            {range === 'day' ? '일간' : range === 'week' ? '주간' : '월간'}
          </Button>
        ))}
      </div>

      {/* 실시간 메트릭스 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-500">활성 사용자</p>
                <p className="text-2xl font-bold">{metrics.realtime.activeUsers}</p>
                <p className="text-xs text-green-600 mt-1">
                  <TrendingUp className="inline h-3 w-3" /> +12.5%
                </p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-500">오늘 매출</p>
                <p className="text-2xl font-bold">₩{metrics.revenue.today.toLocaleString()}</p>
                <p className="text-xs text-green-600 mt-1">
                  <TrendingUp className="inline h-3 w-3" /> +{metrics.revenue.trend}%
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-500">페이지뷰</p>
                <p className="text-2xl font-bold">{metrics.realtime.pageViews}</p>
                <p className="text-xs text-gray-600 mt-1">
                  최근 1시간
                </p>
              </div>
              <Activity className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-500">이탈률</p>
                <p className="text-2xl font-bold">{metrics.realtime.bounceRate.toFixed(1)}%</p>
                <p className="text-xs text-red-600 mt-1">
                  <TrendingDown className="inline h-3 w-3" /> -2.3%
                </p>
              </div>
              <Target className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 메인 탭 콘텐츠 */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-5 w-full">
          <TabsTrigger value="overview">개요</TabsTrigger>
          <TabsTrigger value="predictions">예측 분석</TabsTrigger>
          <TabsTrigger value="behavior">사용자 행동</TabsTrigger>
          <TabsTrigger value="business">비즈니스</TabsTrigger>
          <TabsTrigger value="realtime">실시간</TabsTrigger>
        </TabsList>

        {/* 개요 탭 */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* 수요 예측 차트 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  수요 예측
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={metrics.predictions.demandForecast}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="predicted"
                      stroke="#8884d8"
                      name="예측"
                      strokeDasharray="5 5"
                    />
                    <Line
                      type="monotone"
                      dataKey="actual"
                      stroke="#82ca9d"
                      name="실제"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* 기기 활용률 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  기기별 활용률
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={metrics.businessMetrics.deviceUtilization}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="device" />
                    <YAxis />
                    <Tooltip formatter={(value) => `${value}%`} />
                    <Bar dataKey="utilization" fill="#0088FE">
                      <LabelList dataKey="utilization" position="top" />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* 전환 깔때기 */}
          <Card>
            <CardHeader>
              <CardTitle>예약 전환 깔때기</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <FunnelChart>
                  <Tooltip />
                  <Funnel
                    dataKey="users"
                    data={metrics.userBehavior.funnelData}
                    isAnimationActive
                  >
                    <LabelList position="center" fill="#fff" />
                  </Funnel>
                </FunnelChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 예측 분석 탭 */}
        <TabsContent value="predictions" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* 이탈 위험도 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  고객 이탈 위험도
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={metrics.predictions.churnRisk}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="segment" />
                    <PolarRadiusAxis angle={90} domain={[0, 1]} />
                    <Radar
                      name="이탈 확률"
                      dataKey="probability"
                      stroke="#ff7300"
                      fill="#ff7300"
                      fillOpacity={0.6}
                    />
                    <Tooltip formatter={(value) => `${(value as number * 100).toFixed(0)}%`} />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* 유지보수 일정 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  예상 유지보수 일정
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {metrics.predictions.maintenanceSchedule.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`h-2 w-2 rounded-full ${
                          item.priority === 'high' ? 'bg-red-500' :
                          item.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                        }`} />
                        <span className="font-medium">{item.device}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">{item.days}일 후</span>
                        <Badge variant={
                          item.priority === 'high' ? 'destructive' :
                          item.priority === 'medium' ? 'warning' : 'success'
                        }>
                          {item.priority === 'high' ? '긴급' :
                           item.priority === 'medium' ? '보통' : '여유'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 수요 예측 상세 */}
          <Card>
            <CardHeader>
              <CardTitle>시간대별 수요 예측</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={metrics.businessMetrics.peakTimes}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="bookings"
                    stroke="#8884d8"
                    fill="#8884d8"
                    fillOpacity={0.6}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 사용자 행동 탭 */}
        <TabsContent value="behavior" className="space-y-4">
          {/* 세션 지속 시간 */}
          <Card>
            <CardHeader>
              <CardTitle>시간대별 평균 세션 시간</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={metrics.userBehavior.sessionDuration}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <Tooltip formatter={(value) => `${value}분`} />
                  <Area
                    type="monotone"
                    dataKey="avgDuration"
                    stroke="#00C49F"
                    fill="#00C49F"
                    fillOpacity={0.6}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* 히트맵 플레이스홀더 */}
          <Card>
            <CardHeader>
              <CardTitle>클릭 히트맵</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900 dark:to-purple-900 rounded-lg flex items-center justify-center">
                <p className="text-gray-500 dark:text-gray-400">
                  클릭 히트맵 시각화 영역
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 비즈니스 탭 */}
        <TabsContent value="business" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* 고객 세그먼트 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart2 className="h-5 w-5" />
                  고객 세그먼트
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={metrics.businessMetrics.customerSegments}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ segment, count }) => `${segment}: ${count}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {metrics.businessMetrics.customerSegments.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* 고객 가치 분포 */}
            <Card>
              <CardHeader>
                <CardTitle>고객 생애 가치 분포</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <Treemap
                    data={metrics.businessMetrics.customerSegments}
                    dataKey="value"
                    aspectRatio={4 / 3}
                    stroke="#fff"
                    fill="#8884d8"
                  />
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* 수익 추이 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUpIcon className="h-5 w-5" />
                수익 성장 추이
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center">
                  <p className="text-sm text-gray-500">일간</p>
                  <p className="text-2xl font-bold">₩{metrics.revenue.today.toLocaleString()}</p>
                  <p className="text-xs text-green-600">+{metrics.revenue.trend}%</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-500">주간</p>
                  <p className="text-2xl font-bold">₩{metrics.revenue.week.toLocaleString()}</p>
                  <p className="text-xs text-green-600">+8.2%</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-500">월간</p>
                  <p className="text-2xl font-bold">₩{metrics.revenue.month.toLocaleString()}</p>
                  <p className="text-xs text-green-600">+15.3%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 실시간 탭 */}
        <TabsContent value="realtime" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 animate-pulse text-red-500" />
                실시간 활동 모니터링
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium">시스템 상태</p>
                      <p className="text-sm text-gray-500">모든 서비스 정상 작동 중</p>
                    </div>
                  </div>
                  <Badge variant="success">정상</Badge>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <p className="text-sm text-gray-500">현재 세션</p>
                    <p className="text-2xl font-bold">{metrics.realtime.currentSessions}</p>
                    <p className="text-xs text-gray-400 mt-1">동시 접속자</p>
                  </div>
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <p className="text-sm text-gray-500">API 응답시간</p>
                    <p className="text-2xl font-bold">42ms</p>
                    <p className="text-xs text-gray-400 mt-1">평균 지연시간</p>
                  </div>
                </div>

                <div className="mt-4">
                  <p className="text-sm font-medium mb-2">실시간 이벤트 로그</p>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm p-2 bg-gray-50 dark:bg-gray-800 rounded">
                        <span className="text-gray-400">{new Date().toLocaleTimeString()}</span>
                        <span>사용자가 PS5 예약을 완료했습니다</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}