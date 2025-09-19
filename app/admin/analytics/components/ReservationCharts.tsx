'use client';

import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip
} from 'recharts';
import { 
  ChartWrapper, 
  CustomTooltip, 
  chartColors, 
  commonChartProps,
  getAxisStyle,
  getGridStyle,
  formatters,
  chartAnimation
} from '@/app/components/charts/AnalyticsChart';

interface ChartsProps {
  dailyReservations: any[];
  hourlyDistribution: any[];
  deviceDistribution: any[];
  weekdayPattern: any[];
  theme: 'light' | 'dark';
}

export function ReservationCharts({
  dailyReservations,
  hourlyDistribution,
  deviceDistribution,
  weekdayPattern,
  theme
}: ChartsProps) {
  return (
    <>
      {/* 일별 예약 추이 */}
      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.01]">
        <h3 className="text-lg font-semibold mb-4 dark:text-white">일별 예약 추이</h3>
        <ChartWrapper>
          <BarChart data={dailyReservations} {...commonChartProps}>
            <CartesianGrid {...getGridStyle(theme)} />
            <XAxis 
              dataKey="date" 
              {...getAxisStyle(theme)}
              tickFormatter={formatters.date}
            />
            <YAxis {...getAxisStyle(theme)} />
            <Tooltip 
              content={<CustomTooltip formatter={formatters.number} />}
              cursor={{ fill: theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)' }}
            />
            <Bar 
              dataKey="count" 
              fill={chartColors.primary} 
              radius={[8, 8, 0, 0]}
              {...chartAnimation}
            />
          </BarChart>
        </ChartWrapper>
      </div>

      {/* 시간대별 분포 & 기종별 분포 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 시간대별 분포 */}
        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.01]">
          <h3 className="text-lg font-semibold mb-4 dark:text-white">시간대별 분포</h3>
          <ChartWrapper>
            <LineChart data={hourlyDistribution} {...commonChartProps}>
              <CartesianGrid {...getGridStyle(theme)} />
              <XAxis 
                dataKey="hour" 
                {...getAxisStyle(theme)}
              />
              <YAxis {...getAxisStyle(theme)} />
              <Tooltip 
                content={<CustomTooltip formatter={formatters.number} />}
                cursor={{ stroke: chartColors.primary, strokeDasharray: '5 5' }}
              />
              <Line 
                type="monotone" 
                dataKey="count" 
                stroke={chartColors.primary} 
                strokeWidth={3}
                dot={{ fill: chartColors.primary, r: 4 }}
                activeDot={{ r: 6 }}
                {...chartAnimation}
              />
            </LineChart>
          </ChartWrapper>
        </div>

        {/* 기종별 분포 */}
        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.01]">
          <h3 className="text-lg font-semibold mb-4 dark:text-white">기종별 분포</h3>
          <ChartWrapper>
            <PieChart {...commonChartProps}>
              <Pie
                data={deviceDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ percentage }) => `${percentage}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                {...chartAnimation}
              >
                {deviceDistribution.map((_entry, index) => (
                  <Cell key={`cell-${index}`} fill={Object.values(chartColors)[index % Object.values(chartColors).length] as string} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip formatter={formatters.percent} />} />
            </PieChart>
          </ChartWrapper>
          
          {/* 범례 */}
          <div className="mt-4 grid grid-cols-2 gap-2">
            {deviceDistribution.map((device, index) => (
              <div key={device.name} className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: Object.values(chartColors)[index % Object.values(chartColors).length] as string }}
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {device.name} ({device.percentage}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 요일별 패턴 */}
      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.01]">
        <h3 className="text-lg font-semibold mb-4 dark:text-white">요일별 패턴</h3>
        <ChartWrapper>
          <BarChart data={weekdayPattern} {...commonChartProps}>
            <CartesianGrid {...getGridStyle(theme)} />
            <XAxis 
              dataKey="day" 
              {...getAxisStyle(theme)}
            />
            <YAxis {...getAxisStyle(theme)} />
            <Tooltip 
              content={<CustomTooltip formatter={formatters.number} />}
              cursor={{ fill: theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)' }}
            />
            <Bar 
              dataKey="count" 
              fill={chartColors.secondary} 
              radius={[8, 8, 0, 0]}
              {...chartAnimation}
            />
          </BarChart>
        </ChartWrapper>
      </div>
    </>
  );
}