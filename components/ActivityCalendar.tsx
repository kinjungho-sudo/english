'use client'

import { useState } from 'react'

type Props = {
  activeDates: string[]  // YYYY-MM-DD[]
  streak: number
}

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토']

export default function ActivityCalendar({ activeDates, streak }: Props) {
  const activeSet = new Set(activeDates)
  const today = new Date()
  const todayStr = today.toISOString().slice(0, 10)

  // 표시할 달: 기본 이번 달, 이전 달로 이동 가능
  const [offset, setOffset] = useState(0) // 0 = 이번 달, -1 = 저번 달

  const displayDate = new Date(today.getFullYear(), today.getMonth() + offset, 1)
  const year = displayDate.getFullYear()
  const month = displayDate.getMonth() // 0-based

  const monthLabel = `${year}년 ${month + 1}월`

  // 해당 달의 1일 요일 (0=일 ~ 6=토)
  const firstDow = new Date(year, month, 1).getDay()
  // 해당 달의 마지막 날
  const lastDay = new Date(year, month + 1, 0).getDate()

  // 이번 달 접속 일수
  const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}-`
  const activeThisMonth = activeDates.filter(d => d.startsWith(monthPrefix)).length

  // 그리드 셀 목록 (빈칸 + 날짜)
  const cells: Array<number | null> = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: lastDay }, (_, i) => i + 1),
  ]
  // 7의 배수로 맞춤
  while (cells.length % 7 !== 0) cells.push(null)

  function dateStr(day: number) {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  }

  const canGoNext = offset < 0 // 이번 달이면 앞으로 못 감
  const canGoPrev = offset > -11 // 최대 11개월 전까지

  return (
    <div
      className="rounded-2xl p-4 mb-5"
      style={{ background: 'rgba(17,24,39,0.6)', border: '1px solid rgba(255,255,255,0.06)' }}
    >
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'rgba(75,85,99,0.9)' }}>
            📅 출석 달력
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-white font-black text-sm">{monthLabel}</span>
            <span
              className="text-[11px] font-bold px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(245,158,11,0.12)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.2)' }}
            >
              {activeThisMonth}일 출석
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* 스트릭 배지 */}
          {streak >= 2 && (
            <div
              className="flex items-center gap-1 rounded-full px-2.5 py-1 mr-2"
              style={{ background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.2)' }}
            >
              <span className="text-xs">🔥</span>
              <span className="text-[11px] font-black" style={{ color: '#fb923c' }}>{streak}일 연속</span>
            </div>
          )}
          <button
            onClick={() => canGoPrev && setOffset(o => o - 1)}
            disabled={!canGoPrev}
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors disabled:opacity-25"
            style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.5)' }}
          >
            ‹
          </button>
          <button
            onClick={() => canGoNext && setOffset(o => o + 1)}
            disabled={!canGoNext}
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors disabled:opacity-25"
            style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.5)' }}
          >
            ›
          </button>
        </div>
      </div>

      {/* 요일 헤더 */}
      <div className="grid grid-cols-7 mb-1">
        {DAY_LABELS.map((d, i) => (
          <div
            key={d}
            className="text-center text-[10px] font-bold py-1"
            style={{ color: i === 0 ? 'rgba(248,113,113,0.5)' : i === 6 ? 'rgba(96,165,250,0.5)' : 'rgba(75,85,99,0.7)' }}
          >
            {d}
          </div>
        ))}
      </div>

      {/* 날짜 그리드 */}
      <div className="grid grid-cols-7 gap-y-1">
        {cells.map((day, idx) => {
          if (day === null) return <div key={`empty-${idx}`} />

          const ds = dateStr(day)
          const isActive = activeSet.has(ds)
          const isToday = ds === todayStr
          const isFuture = ds > todayStr
          const dow = (firstDow + day - 1) % 7

          return (
            <div key={ds} className="flex items-center justify-center py-0.5">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center relative transition-all"
                style={{
                  background: isActive
                    ? isToday
                      ? 'linear-gradient(135deg, #f59e0b, #d97706)'
                      : 'rgba(245,158,11,0.18)'
                    : isToday
                      ? 'rgba(255,255,255,0.06)'
                      : 'transparent',
                  border: isToday
                    ? `1.5px solid ${isActive ? 'rgba(245,158,11,0.8)' : 'rgba(255,255,255,0.2)'}`
                    : isActive
                      ? '1px solid rgba(245,158,11,0.3)'
                      : 'none',
                  boxShadow: isActive && isToday ? '0 0 10px rgba(245,158,11,0.35)' : undefined,
                }}
              >
                <span
                  className="text-[11px] font-bold leading-none"
                  style={{
                    color: isActive
                      ? isToday ? '#000' : '#f59e0b'
                      : isFuture
                        ? 'rgba(255,255,255,0.1)'
                        : dow === 0
                          ? 'rgba(248,113,113,0.45)'
                          : dow === 6
                            ? 'rgba(96,165,250,0.45)'
                            : 'rgba(255,255,255,0.35)',
                  }}
                >
                  {day}
                </span>
                {/* 오늘 점 표시 */}
                {isToday && !isActive && (
                  <div
                    className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                    style={{ background: '#f59e0b' }}
                  />
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* 범례 */}
      <div className="flex items-center gap-4 mt-3 pl-0.5">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm" style={{ background: 'rgba(245,158,11,0.18)', border: '1px solid rgba(245,158,11,0.3)' }} />
          <span className="text-[10px]" style={{ color: 'rgba(75,85,99,0.8)' }}>출석</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm" style={{ background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(255,255,255,0.2)' }} />
          <span className="text-[10px]" style={{ color: 'rgba(75,85,99,0.8)' }}>오늘</span>
        </div>
      </div>
    </div>
  )
}
