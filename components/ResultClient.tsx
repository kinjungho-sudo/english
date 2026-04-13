'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import type { LevelInfo } from '@/lib/levels'

type Mistake = {
  id: string
  wrong_input: string | null
  correct_expression: string | null
  context: string | null
}

type Props = {
  scenarioId: string
  scenarioName: string
  score: number
  maxScore: number
  percentage: number
  grade: { label: string; emoji: string; color: string; bg: string }
  levelBefore: LevelInfo
  levelAfter: LevelInfo
  xpGained: number
  mistakes: Mistake[]
}

function useCountUp(target: number, duration = 1200, delay = 400) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    const t = setTimeout(() => {
      const start = performance.now()
      const raf = (now: number) => {
        const p = Math.min((now - start) / duration, 1)
        const ease = 1 - Math.pow(1 - p, 3) // ease-out-cubic
        setValue(Math.round(ease * target))
        if (p < 1) requestAnimationFrame(raf)
      }
      requestAnimationFrame(raf)
    }, delay)
    return () => clearTimeout(t)
  }, [target, duration, delay])
  return value
}

export default function ResultClient({
  scenarioId,
  scenarioName,
  score,
  maxScore,
  percentage,
  grade,
  levelBefore,
  levelAfter,
  xpGained,
  mistakes,
}: Props) {
  const didLevelUp = levelAfter.level > levelBefore.level
  const [showLevelUp, setShowLevelUp] = useState(false)
  const [barWidth, setBarWidth] = useState(0)
  const [xpBarWidth, setXpBarWidth] = useState(0)
  const [xpBarLevelUp, setXpBarLevelUp] = useState(false)
  const [showContent, setShowContent] = useState(false)
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])

  const displayScore = useCountUp(score, 1400, 600)
  const displayXP    = useCountUp(xpGained, 1000, 800)

  function after(ms: number, fn: () => void) {
    const id = setTimeout(fn, ms)
    timersRef.current.push(id)
  }

  useEffect(() => {
    after(100,  () => setShowContent(true))
    after(700,  () => setBarWidth(percentage))

    if (didLevelUp) {
      after(900,  () => setXpBarWidth(100))
      after(1700, () => {
        setXpBarLevelUp(true)
        after(600, () => {
          setXpBarLevelUp(false)
          setXpBarWidth(levelAfter.progress)
          setShowLevelUp(true)
          after(3200, () => setShowLevelUp(false))
        })
      })
    } else {
      after(900, () => setXpBarWidth(levelAfter.progress))
    }

    return () => { timersRef.current.forEach(clearTimeout); timersRef.current = [] }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="game-wrap" style={{ background: '#050508' }}>
      <div className="game-card" style={{ background: 'radial-gradient(ellipse at 50% 0%, #1a0a00 0%, #0a0a0f 60%, #000 100%)' }}>

        {/* Level-up overlay */}
        {showLevelUp && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center pointer-events-none">
            <div className="animate-levelup-burst text-center">
              <div className="text-6xl mb-3">{levelAfter.emoji}</div>
              <div className="text-amber-400 font-black text-3xl tracking-widest uppercase mb-1"
                style={{ textShadow: '0 0 40px rgba(245,158,11,0.8)' }}>
                Level Up!
              </div>
              <div className="text-white/60 text-base font-bold">{levelAfter.title}</div>
            </div>
          </div>
        )}

        <div className={`flex-1 overflow-y-auto px-5 py-10 space-y-4 transition-opacity duration-500 ${showContent ? 'opacity-100' : 'opacity-0'}`}>

          {/* ── Grade header ── */}
          <div className="text-center animate-result-item" style={{ animationDelay: '0ms' }}>
            <div className="text-7xl mb-3 animate-grade-pop">{grade.emoji}</div>
            <h1 className={`text-3xl font-black mb-1 ${grade.color}`}
              style={{ letterSpacing: '-0.03em', textShadow: `0 0 32px currentColor` }}>
              {grade.label}
            </h1>
            <p className="text-white/25 text-sm tracking-widest uppercase">{scenarioName} Clear</p>
          </div>

          {/* ── Score card ── */}
          <div className="rounded-2xl p-5 animate-result-item" style={{
            animationDelay: '150ms',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.07)',
          }}>
            <div className="flex items-end justify-between mb-3">
              <span className="text-white/35 text-xs tracking-widest uppercase">Score</span>
              <div className="flex items-baseline gap-1">
                <span className="text-amber-400 font-black tabular-nums"
                  style={{ fontSize: '2.4rem', lineHeight: 1, textShadow: '0 0 24px rgba(245,158,11,0.5)' }}>
                  {displayScore}
                </span>
                <span className="text-white/20 text-sm">/ {maxScore}</span>
              </div>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <div
                className="h-full rounded-full transition-all duration-[1400ms] ease-out"
                style={{
                  width: `${barWidth}%`,
                  background: 'linear-gradient(90deg, #d97706, #f59e0b, #fbbf24)',
                  boxShadow: '0 0 12px rgba(245,158,11,0.5)',
                }}
              />
            </div>
            <div className="flex justify-between mt-2">
              <span className="text-white/20 text-xs">{percentage}% 달성</span>
              <span className="text-white/20 text-xs">{xpGained > 0 && `+${displayXP} XP`}</span>
            </div>
          </div>

          {/* ── XP / Level card ── */}
          <div className="rounded-2xl p-5 animate-result-item" style={{
            animationDelay: '250ms',
            background: 'rgba(255,255,255,0.03)',
            border: `1px solid ${didLevelUp ? 'rgba(245,158,11,0.25)' : 'rgba(255,255,255,0.07)'}`,
          }}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">{levelAfter.emoji}</span>
                <div>
                  <p className="text-white/80 text-sm font-bold">{levelAfter.title}</p>
                  <p className="text-white/25 text-xs">Lv.{levelAfter.level}</p>
                </div>
              </div>
              {didLevelUp && (
                <span className="bg-amber-500/15 border border-amber-500/30 text-amber-400 text-[11px] font-black tracking-widest uppercase rounded-full px-3 py-1">
                  Level Up ↑
                </span>
              )}
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <div
                className={`h-full rounded-full transition-all duration-[1200ms] ease-out ${xpBarLevelUp ? 'animate-xp-flash' : ''}`}
                style={{
                  width: `${xpBarWidth}%`,
                  background: didLevelUp
                    ? 'linear-gradient(90deg, #d97706, #f59e0b)'
                    : 'linear-gradient(90deg, #6366f1, #8b5cf6)',
                }}
              />
            </div>
            {levelAfter.nextLevel && (
              <div className="flex justify-between mt-1.5">
                <span className="text-white/20 text-[11px]">{levelAfter.xp.toLocaleString()} XP</span>
                <span className="text-white/15 text-[11px]">Lv.{levelAfter.nextLevel.level} → {levelAfter.nextLevel.minXP.toLocaleString()} XP</span>
              </div>
            )}
          </div>

          {/* ── Mistakes ── */}
          {mistakes.length > 0 && (
            <div className="rounded-2xl p-5 animate-result-item" style={{
              animationDelay: '350ms',
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}>
              <h2 className="text-white/70 font-bold text-sm mb-0.5">복습 표현 {mistakes.length}개</h2>
              <p className="text-white/20 text-xs mb-4">다음 플레이 때 우선 출제돼요</p>
              <div className="space-y-3">
                {mistakes.map(m => (
                  <div key={m.id} className="flex items-start gap-3">
                    <span className="text-red-400/50 text-xs mt-0.5 shrink-0">✗</span>
                    <div>
                      {m.wrong_input && (
                        <p className="text-white/20 text-xs line-through mb-0.5">{m.wrong_input}</p>
                      )}
                      <p className="text-green-400/80 text-sm font-medium">"{m.correct_expression}"</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Actions ── */}
          <div className="flex flex-col gap-3 animate-result-item pt-2" style={{ animationDelay: '450ms' }}>
            <Link
              href={`/scenario/${scenarioId}`}
              className="block text-center font-black text-sm tracking-widest uppercase rounded-xl py-4 transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{
                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                color: '#000',
                boxShadow: '0 0 24px rgba(245,158,11,0.3)',
              }}
            >
              ▶ 다시 플레이
            </Link>
            <Link
              href="/dashboard"
              className="block text-center text-white/30 hover:text-white/70 text-sm font-bold tracking-widest uppercase py-3 transition-colors"
            >
              스테이지 선택 →
            </Link>
          </div>

        </div>
      </div>
    </div>
  )
}
