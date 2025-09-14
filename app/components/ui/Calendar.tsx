 'use client'

import { useMemo, useRef, useState } from 'react'

type DateMarks = Record<string, { color: string; tooltip?: string }>

export type CalendarProps = {
  selectedDate?: string
  onDateSelect: (date: string) => void
  isDateDisabled?: (date: Date) => boolean
  minDate?: Date
  maxDate?: Date
  monthsToShow?: number
  enableSwipe?: boolean
  renderDate?: (
    date: Date,
    isSelected: boolean,
    isDisabled: boolean
  ) => React.ReactNode
  dateMarks?: DateMarks
  className?: string
}

function toYmd(date: Date) {
  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

function startOfMonth(d: Date) {
  const nd = new Date(d)
  nd.setDate(1)
  nd.setHours(0, 0, 0, 0)
  return nd
}

function addMonths(d: Date, n: number) {
  const nd = new Date(d)
  nd.setMonth(nd.getMonth() + n)
  return nd
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function inRange(d: Date, min?: Date, max?: Date) {
  if (min && d < new Date(min.getFullYear(), min.getMonth(), min.getDate())) return false
  if (max && d > new Date(max.getFullYear(), max.getMonth(), max.getDate())) return false
  return true
}

function getMonthMatrix(monthDate: Date): Date[][] {
  const first = startOfMonth(monthDate)
  const firstDay = first.getDay() // 0=Sun..6=Sat
  const start = new Date(first)
  start.setDate(first.getDate() - firstDay)

  const weeks: Date[][] = []
  for (let w = 0; w < 6; w++) {
    const week: Date[] = []
    for (let i = 0; i < 7; i++) {
      const d = new Date(start)
      d.setDate(start.getDate() + w * 7 + i)
      week.push(d)
    }
    weeks.push(week)
  }
  return weeks
}

export function Calendar({
  selectedDate,
  onDateSelect,
  isDateDisabled,
  minDate,
  maxDate,
  monthsToShow = 1,
  enableSwipe = true,
  renderDate,
  dateMarks = {},
  className
}: CalendarProps) {
  const today = useMemo(() => {
    const t = new Date()
    t.setHours(0, 0, 0, 0)
    return t
  }, [])

  const initial = useMemo(() => {
    if (selectedDate) {
      const parts = selectedDate.split('-').map((v) => parseInt(v, 10))
      const y = Number.isFinite(parts[0]) ? (parts[0] as number) : today.getFullYear()
      const m = Number.isFinite(parts[1]) ? (parts[1] as number) : today.getMonth() + 1
      return startOfMonth(new Date(y, m - 1, 1))
    }
    return startOfMonth(today)
  }, [selectedDate, today])

  const [currentMonth, setCurrentMonth] = useState<Date>(initial)

  // Swipe support (basic)
  const startX = useRef<number | null>(null)
  const onTouchStart = (e: React.TouchEvent) => {
    if (!enableSwipe) return
    const t0 = e.touches.item(0)
    if (!t0) return
    startX.current = t0.clientX
  }
  const onTouchEnd = (e: React.TouchEvent) => {
    if (!enableSwipe || startX.current === null) return
    const c0 = e.changedTouches.item(0)
    if (!c0) return
    const dx = c0.clientX - startX.current!
    startX.current = null
    const threshold = 40
    if (dx > threshold) setCurrentMonth((m) => addMonths(m, -1))
    else if (dx < -threshold) setCurrentMonth((m) => addMonths(m, 1))
  }

  const selected = useMemo(() => {
    if (!selectedDate) return null
    const parts = selectedDate.split('-').map((v) => parseInt(v, 10))
    const y = parts[0]
    const m = parts[1]
    const d = parts[2]
    if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return null
    return new Date(y as number, (m as number) - 1, d as number)
  }, [selectedDate])

  const months = monthsToShow ?? 1
  const monthList = Array.from({ length: Math.max(1, months) }, (_, i) => addMonths(currentMonth, i))

  const weekdayLabels = ['일', '월', '화', '수', '목', '금', '토']

  const handleSelect = (date: Date) => {
    if (!inRange(date, minDate, maxDate)) return
    if (isDateDisabled?.(date)) return
    onDateSelect(toYmd(date))
  }

  return (
    <div className={className} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <div className='flex items-center justify-between mb-3'>
        <button
          type='button'
          aria-label='이전 달'
          onClick={() => setCurrentMonth((m) => addMonths(m, -1))}
          className='px-2 py-1 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 border border-transparent hover:border-gray-200 dark:hover:border-gray-700'
        >
          ‹
        </button>
        <div className='text-center text-base font-semibold text-gray-900 dark:text-white'>
          {currentMonth.getFullYear()}년 {currentMonth.getMonth() + 1}월
          {months > 1 && ` ~ ${addMonths(currentMonth, months - 1).getMonth() + 1}월`}
        </div>
        <button
          type='button'
          aria-label='다음 달'
          onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
          className='px-2 py-1 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 border border-transparent hover:border-gray-200 dark:hover:border-gray-700'
        >
          ›
        </button>
      </div>

      <div className={`grid gap-4 ${months > 1 ? 'md:grid-cols-2' : ''}`}>
        {monthList.map((month, idx) => {
          const weeks = getMonthMatrix(month)
          return (
            <div key={idx} className='space-y-2'>
              {months > 1 && (
                <div className='text-sm font-medium text-gray-700 dark:text-gray-300'>
                  {month.getFullYear()}년 {month.getMonth() + 1}월
                </div>
              )}
              <div className='grid grid-cols-7 gap-1 text-xs text-center'>
                {weekdayLabels.map((d) => (
                  <div key={d} className='py-1 text-gray-500 dark:text-gray-400'>
                    {d}
                  </div>
                ))}
                {weeks.flatMap((week, wi) =>
                  week.map((date, di) => {
                    const isCurrentMonth = date.getMonth() === month.getMonth()
                    const isSelected = selected ? isSameDay(date, selected) : false
                    const isToday = isSameDay(date, today)
                    const disabledByRange = !inRange(date, minDate, maxDate)
                    const disabledByFn = isDateDisabled?.(date) || false
                    const disabled = disabledByRange || disabledByFn || !isCurrentMonth
                    const ymd = toYmd(date)
                    const mark = dateMarks[ymd]

                    const baseClasses =
                      'relative aspect-square select-none rounded-lg border text-sm flex items-center justify-center '
                    const colorClasses = disabled
                      ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 border-gray-200 dark:border-gray-700'
                      : isSelected
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-600'

                    return (
                      <button
                        key={`${wi}-${di}`}
                        type='button'
                        aria-label={`${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`}
                        aria-disabled={disabled}
                        disabled={disabled}
                        onClick={() => handleSelect(date)}
                        title={mark?.tooltip}
                        className={baseClasses + ' ' + colorClasses}
                      >
                        {renderDate ? (
                          renderDate(date, isSelected, disabled)
                        ) : (
                          <span className='relative'>
                            {date.getDate()}
                            {isToday && !isSelected && (
                              <span className='absolute -top-1 -right-1 h-2 w-2 rounded-full border border-indigo-600 text-[0px]'
                                style={{ backgroundColor: 'transparent' }}
                                aria-hidden
                              />
                            )}
                            {mark && (
                              <span
                                aria-hidden
                                className='absolute bottom-1 left-1 right-1 mx-auto h-1.5 w-4 rounded-full'
                                style={{ backgroundColor: mark.color }}
                              />
                            )}
                          </span>
                        )}
                      </button>
                    )
                  })
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default Calendar
