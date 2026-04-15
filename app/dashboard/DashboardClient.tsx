'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { getLevelInfo, calculateXP } from '@/lib/levels'
import OnboardingModal from '@/components/OnboardingModal'
import type { Scenario, UserProgress, UserMistake } from '@/lib/scenarios/data'
import type { User } from '@supabase/supabase-js'

type Props = {
  user: User
  characterName: string
  avatarEmoji: string
  scenarios: Scenario[]
  progress: UserProgress[]
  unmastered: UserMistake[]
  mastered: UserMistake[]
}

// Accent colors match .dialogue-nameplate-* in globals.css
const NPC_CARD_THEME: Record<string, { bg: string; border: string; accent: string }> = {
  SARAH: { bg: 'rgba(234,88,12,0.08)',   border: 'rgba(234,88,12,0.22)',   accent: '#ea580c' },
  MIKE:  { bg: 'rgba(37,99,235,0.08)',   border: 'rgba(37,99,235,0.22)',   accent: '#2563eb' },
  EMMA:  { bg: 'rgba(124,58,237,0.08)',  border: 'rgba(124,58,237,0.22)',  accent: '#7c3aed' },
  LUCY:  { bg: 'rgba(180,83,9,0.08)',    border: 'rgba(180,83,9,0.22)',    accent: '#b45309' },
  JAMES: { bg: 'rgba(133,77,14,0.08)',   border: 'rgba(133,77,14,0.22)',   accent: '#854d0e' },
  KATE:  { bg: 'rgba(190,24,93,0.08)',   border: 'rgba(190,24,93,0.22)',   accent: '#be185d' },
  CHEN:  { bg: 'rgba(15,118,110,0.08)',  border: 'rgba(15,118,110,0.22)',  accent: '#0f766e' },
}

export default function DashboardClient({ user, characterName, avatarEmoji, scenarios, progress, unmastered, mastered }: Props) {
  void user
  const router = useRouter()
  const supabase = createClient()
  // lazy initializer avoids flash-of-hidden-modal on hydration
  const [showOnboarding, setShowOnboarding] = useState(
    () => typeof window !== 'undefined' && !localStorage.getItem('sq_onboarded')
  )
  const [streak, setStreak] = useState(0)

  useEffect(() => {
    fetch('/api/streak', { method: 'POST' })
      .then(r => r.json())
      .then(d => setStreak(d.streak ?? 0))
      .catch(() => {})
  }, [])

  function closeOnboarding() {
    localStorage.setItem('sq_onboarded', '1')
    setShowOnboarding(false)
  }

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const progressMap = Object.fromEntries(progress.map(p => [p.scenario_id, p]))
  const mistakeCountByScenario = unmastered.reduce<Record<string, number>>((acc, m) => {
    acc[m.scenario_id] = (acc[m.scenario_id] ?? 0) + 1
    return acc
  }, {})

  const totalScore = progress.reduce((sum, p) => sum + (p.total_score ?? 0), 0)
  const completedCount = progress.filter(p => !!p.completed_at).length
  const xp = calculateXP(totalScore, mastered.length, completedCount)
  const levelInfo = getLevelInfo(xp)

  const hasReviewItems = unmastered.length > 0

  const thisMonth = new Date().toISOString().slice(0, 7)
  const masteredThisMonth = mastered.filter(m => m.mastered_at?.startsWith(thisMonth)).length
  const top3Mistakes = [...unmastered]
    .sort((a, b) => b.mistake_count - a.mistake_count)
    .slice(0, 3)

  return (
    <div className="game-wrap bg-gray-950">
      <div className="game-card bg-gray-950 relative">
        {showOnboarding && <OnboardingModal onClose={closeOnboarding} />}

        {/* Header */}
        <header
          className="shrink-0 border-b px-5 py-3 flex items-center justify-between z-10"
          style={{
            borderColor: 'rgba(255,255,255,0.06)',
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.6), rgba(10,10,15,0.95))',
          }}
        >
          <div className="flex items-center gap-2">
            <span className="text-lg">✈️</span>
            <span className="font-black text-white tracking-widest text-sm uppercase">Travel Quest</span>
          </div>
          <div className="flex items-center gap-3">
            {streak >= 2 && (
              <div
                className="flex items-center gap-1 rounded-full px-2.5 py-1"
                style={{ background: 'rgba(249,115,22,0.12)', border: '1px solid rgba(249,115,22,0.25)' }}
              >
                <span className="text-sm leading-none">🔥</span>
                <span className="text-[11px] font-black" style={{ color: '#fb923c' }}>{streak}일</span>
              </div>
            )}

            {/* Character card with level badge */}
            <Link
              href="/profile"
              className="flex items-center gap-2 rounded-xl pl-2 pr-3 py-1.5 transition-all hover:scale-[1.02]"
              style={{
                background: 'linear-gradient(135deg, rgba(245,158,11,0.1), rgba(245,158,11,0.03))',
                border: '1px solid rgba(245,158,11,0.2)',
              }}
            >
              <div className="relative">
                <span className="text-xl leading-none">{avatarEmoji}</span>
                <span
                  className="absolute -bottom-0.5 -right-0.5 w-4 h-4 flex items-center justify-center rounded-full font-black leading-none"
                  style={{ background: '#f59e0b', color: '#000', fontSize: '9px' }}
                >
                  {levelInfo.level}
                </span>
              </div>
              <div>
                <p className="text-xs font-bold leading-none" style={{ color: 'rgba(255,255,255,0.82)' }}>{characterName}</p>
                <p className="text-[10px] leading-none mt-0.5" style={{ color: 'rgba(245,158,11,0.55)' }}>{levelInfo.title}</p>
              </div>
            </Link>

            <button
              onClick={signOut}
              className="text-xs transition-colors"
              style={{ color: 'rgba(75,85,99,0.8)' }}
            >
              Exit
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-5 py-8">
          {/* Review Alert */}
          {hasReviewItems && (
            <div
              className="rounded-2xl p-4 mb-6 animate-fade-in-up"
              style={{ background: 'rgba(120,53,15,0.2)', border: '1px solid rgba(245,158,11,0.25)' }}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">🔄</span>
                <div>
                  <p className="text-sm font-bold" style={{ color: '#fcd34d' }}>복습할 표현이 있어요!</p>
                  <p className="text-xs" style={{ color: 'rgba(245,158,11,0.55)' }}>
                    이전에 틀렸던 표현 <strong style={{ color: '#fcd34d' }}>{unmastered.length}개</strong>가 우선 출제됩니다
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* XP / Level card */}
          <Link
            href="/profile"
            className="block rounded-2xl p-4 mb-6 transition-colors"
            style={{ background: 'rgba(17,24,39,0.7)', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-sm font-bold text-white">{levelInfo.emoji} {levelInfo.title}</span>
              <span className="text-xs font-bold" style={{ color: '#f59e0b' }}>Lv.{levelInfo.level}</span>
            </div>
            <div className="h-3 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <div
                className="h-full rounded-full"
                style={{
                  width: `${levelInfo.progress}%`,
                  background: 'linear-gradient(90deg, #d97706, #f59e0b, #fbbf24)',
                  boxShadow: '0 0 8px rgba(245,158,11,0.5)',
                }}
              />
            </div>
            <div className="flex justify-between mt-1.5">
              <span className="text-xs" style={{ color: 'rgba(75,85,99,0.9)' }}>{xp.toLocaleString()} XP</span>
              <span className="text-xs font-bold" style={{ color: 'rgba(245,158,11,0.5)' }}>{levelInfo.progress}% · 마이페이지 →</span>
            </div>
          </Link>

          {/* 학습 통계 */}
          <div className="grid grid-cols-2 gap-2.5 mb-5">
            <div className="rounded-2xl px-4 py-3.5"
              style={{ background: 'rgba(17,24,39,0.6)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'rgba(75,85,99,0.9)' }}>이번 달 마스터</p>
              <p className="text-2xl font-black text-white leading-none">
                {masteredThisMonth}<span className="text-sm font-normal ml-1" style={{ color: 'rgba(75,85,99,0.9)' }}>개</span>
              </p>
              <p className="text-[10px] mt-1" style={{ color: 'rgba(55,65,81,0.9)' }}>표현 습득 완료</p>
            </div>
            <div className="rounded-2xl px-4 py-3.5"
              style={{ background: 'rgba(17,24,39,0.6)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'rgba(75,85,99,0.9)' }}>전체 마스터</p>
              <p className="text-2xl font-black text-white leading-none">
                {mastered.length}<span className="text-sm font-normal ml-1" style={{ color: 'rgba(75,85,99,0.9)' }}>개</span>
              </p>
              <p className="text-[10px] mt-1" style={{ color: 'rgba(55,65,81,0.9)' }}>누적 표현 수</p>
            </div>
          </div>

          {/* TOP 3 오답 */}
          {top3Mistakes.length > 0 && (
            <div className="rounded-2xl p-4 mb-5"
              style={{ background: 'rgba(17,24,39,0.4)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <p className="text-[10px] font-bold uppercase tracking-wider mb-3" style={{ color: 'rgba(75,85,99,0.9)' }}>
                📊 많이 틀린 표현 TOP {top3Mistakes.length}
              </p>
              <div className="space-y-2">
                {top3Mistakes.map((m, i) => (
                  <div key={m.id} className="flex items-center gap-3">
                    <span className="text-[10px] font-black w-4 shrink-0" style={{ color: 'rgba(75,85,99,0.8)' }}>{i + 1}</span>
                    <p className="text-xs flex-1 truncate" style={{ color: 'rgba(255,255,255,0.5)' }}>{m.correct_expression || m.wrong_input}</p>
                    <span className="text-[10px] font-bold shrink-0" style={{ color: 'rgba(248,113,113,0.6)' }}>{m.mistake_count}회</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <h1 className="text-xl font-black text-white mb-1" style={{ letterSpacing: '-0.03em' }}>
            STAGE SELECT
          </h1>
          <p className="text-xs mb-5 tracking-wider uppercase" style={{ color: 'rgba(75,85,99,0.8)' }}>시나리오를 선택하세요</p>

          {/* Scenario cards — NPC-themed with CLEAR glow */}
          <div className="space-y-3">
            {scenarios.map(scenario => {
              const prog = progressMap[scenario.id]
              const reviewCount = mistakeCountByScenario[scenario.id] ?? 0
              const isCompleted = !!prog?.completed_at
              const stepsCompleted = prog?.steps_completed ?? 0
              const theme = NPC_CARD_THEME[scenario.npc_name] ?? {
                bg: 'rgba(255,255,255,0.02)', border: 'rgba(255,255,255,0.08)', accent: '#6b7280',
              }

              return (
                <Link
                  key={scenario.id}
                  href={`/scenario/${scenario.id}`}
                  className={`block rounded-2xl p-5 transition-all group relative overflow-hidden ${isCompleted ? 'animate-clear-glow' : ''}`}
                  style={{
                    background: `radial-gradient(ellipse at 0% 50%, ${theme.bg} 0%, transparent 65%), rgba(17,24,39,0.9)`,
                    border: `1px solid ${isCompleted ? 'rgba(245,158,11,0.4)' : theme.border}`,
                  }}
                >
                  {/* Left NPC accent bar */}
                  <div
                    className="absolute left-0 top-3 bottom-3 w-[3px] rounded-full"
                    style={{ background: theme.accent, opacity: isCompleted ? 1 : 0.65 }}
                  />

                  <div className="flex items-center gap-4 pl-2">
                    <div className="text-3xl">{scenario.thumbnail}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <h2 className="font-bold group-hover:text-amber-300 transition-colors" style={{ color: 'rgba(255,255,255,0.9)' }}>
                          {scenario.name}
                        </h2>
                        {/* CLEAR golden badge */}
                        {isCompleted && (
                          <span
                            className="text-xs px-2 py-0.5 rounded-full font-bold tracking-wider"
                            style={{
                              background: 'rgba(245,158,11,0.15)',
                              border: '1px solid rgba(245,158,11,0.4)',
                              color: '#fbbf24',
                            }}
                          >
                            ✓ CLEAR
                          </span>
                        )}
                        {reviewCount > 0 && (
                          <span
                            className="text-xs px-2 py-0.5 rounded-full"
                            style={{ background: 'rgba(120,53,15,0.3)', color: '#fbbf24', border: '1px solid rgba(180,83,9,0.4)' }}
                          >
                            🔄 {reviewCount}
                          </span>
                        )}
                      </div>
                      <p className="text-xs" style={{ color: 'rgba(75,85,99,0.9)' }}>{scenario.location}</p>
                    </div>
                    <div className="text-lg shrink-0 group-hover:text-amber-400 transition-colors" style={{ color: 'rgba(75,85,99,0.7)' }}>
                      ▶
                    </div>
                  </div>

                  {stepsCompleted > 0 && !isCompleted && (
                    <div className="mt-3 pl-2">
                      <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${(stepsCompleted / 5) * 100}%`, background: theme.accent, opacity: 0.75 }}
                        />
                      </div>
                    </div>
                  )}
                </Link>
              )
            })}
          </div>
        </main>
      </div>
    </div>
  )
}
