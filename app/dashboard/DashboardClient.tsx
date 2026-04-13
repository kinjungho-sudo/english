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

export default function DashboardClient({ user, characterName, avatarEmoji, scenarios, progress, unmastered, mastered }: Props) {
  void user
  const router = useRouter()
  const supabase = createClient()
  // localStorage는 클라이언트 전용 — lazy initializer로 SSR 안전하게 처리
  const [showOnboarding, setShowOnboarding] = useState(
    () => typeof window !== 'undefined' && !localStorage.getItem('sq_onboarded')
  )
  const [streak, setStreak] = useState(0)

  useEffect(() => {
    // 스트릭 업데이트 (setState는 .then 콜백 안에서 호출)
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

  // ── 학습 통계 ──
  const thisMonth = new Date().toISOString().slice(0, 7) // "YYYY-MM"
  const masteredThisMonth = mastered.filter(m => m.mastered_at?.startsWith(thisMonth)).length
  const top3Mistakes = [...unmastered]
    .sort((a, b) => b.mistake_count - a.mistake_count)
    .slice(0, 3)

  return (
    <div className="game-wrap bg-gray-950">
      <div className="game-card bg-gray-950 relative">
        {showOnboarding && <OnboardingModal onClose={closeOnboarding} />}
      {/* Header */}
      <header className="shrink-0 border-b border-gray-800/50 px-5 py-3.5 flex items-center justify-between bg-gray-950 z-10">
        <div className="flex items-center gap-2">
          <span className="text-lg">✈️</span>
          <span className="font-black text-white tracking-widest text-sm uppercase">Scene Quest</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            {streak >= 2 && (
              <div className="flex items-center gap-1 bg-orange-500/15 border border-orange-500/25 rounded-full px-2.5 py-1">
                <span className="text-sm leading-none">🔥</span>
                <span className="text-orange-300 text-[11px] font-black">{streak}일</span>
              </div>
            )}
            <Link
              href="/profile"
              className="flex items-center gap-2 bg-white/5 border border-white/10 hover:border-amber-500/40 rounded-full pl-1.5 pr-3 py-1 transition-colors"
            >
              <span className="text-base leading-none">{avatarEmoji}</span>
              <span className="text-white/70 text-xs font-bold">{characterName}</span>
              <span className="text-amber-400 text-xs font-bold ml-0.5">Lv.{levelInfo.level}</span>
            </Link>
          </div>
          <button onClick={signOut} className="text-gray-600 hover:text-gray-400 text-xs transition-colors">
            Exit
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-5 py-8">
        {/* Review Alert */}
        {hasReviewItems && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 mb-6 animate-fade-in-up">
            <div className="flex items-center gap-3">
              <span className="text-xl">🔄</span>
              <div>
                <p className="text-amber-300 font-bold text-sm">복습할 표현이 있어요!</p>
                <p className="text-amber-400/60 text-xs">
                  이전에 틀렸던 표현 <strong className="text-amber-300">{unmastered.length}개</strong>가 우선 출제됩니다
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Level progress mini */}
        <Link href="/profile" className="block bg-gray-900/60 border border-gray-800 hover:border-amber-700/40 rounded-2xl p-4 mb-6 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold text-white">{levelInfo.emoji} {levelInfo.title}</span>
            <span className="text-xs text-amber-400 font-bold">Lv.{levelInfo.level}</span>
          </div>
          <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{
                width: `${levelInfo.progress}%`,
                background: 'linear-gradient(90deg, #d97706, #f59e0b)',
              }}
            />
          </div>
          <div className="flex justify-between mt-1.5">
            <span className="text-gray-600 text-xs">{xp.toLocaleString()} XP</span>
            <span className="text-gray-700 text-xs">마이페이지 →</span>
          </div>
        </Link>

        {/* 학습 통계 */}
        <div className="grid grid-cols-2 gap-2.5 mb-5">
          <div className="bg-gray-900/60 border border-gray-800 rounded-2xl px-4 py-3.5">
            <p className="text-[10px] text-gray-600 font-bold uppercase tracking-wider mb-1">이번 달 마스터</p>
            <p className="text-2xl font-black text-white leading-none">
              {masteredThisMonth}
              <span className="text-sm text-gray-600 font-normal ml-1">개</span>
            </p>
            <p className="text-[10px] text-gray-700 mt-1">표현 습득 완료</p>
          </div>
          <div className="bg-gray-900/60 border border-gray-800 rounded-2xl px-4 py-3.5">
            <p className="text-[10px] text-gray-600 font-bold uppercase tracking-wider mb-1">전체 마스터</p>
            <p className="text-2xl font-black text-white leading-none">
              {mastered.length}
              <span className="text-sm text-gray-600 font-normal ml-1">개</span>
            </p>
            <p className="text-[10px] text-gray-700 mt-1">누적 표현 수</p>
          </div>
        </div>

        {/* TOP 3 오답 */}
        {top3Mistakes.length > 0 && (
          <div className="bg-gray-900/40 border border-gray-800/60 rounded-2xl p-4 mb-5">
            <p className="text-[10px] text-gray-600 font-bold uppercase tracking-wider mb-3">
              📊 많이 틀린 표현 TOP {top3Mistakes.length}
            </p>
            <div className="space-y-2">
              {top3Mistakes.map((m, i) => (
                <div key={m.id} className="flex items-center gap-3">
                  <span className="text-[10px] font-black text-gray-700 w-4 shrink-0">{i + 1}</span>
                  <p className="text-xs text-white/55 flex-1 truncate">{m.correct_expression || m.wrong_input}</p>
                  <span className="text-[10px] text-red-400/60 shrink-0 font-bold">{m.mistake_count}회</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <h1 className="text-xl font-black text-white mb-1" style={{ letterSpacing: '-0.03em' }}>
          STAGE SELECT
        </h1>
        <p className="text-gray-600 text-xs mb-5 tracking-wider uppercase">시나리오를 선택하세요</p>

        <div className="space-y-3">
          {scenarios.map(scenario => {
            const prog = progressMap[scenario.id]
            const reviewCount = mistakeCountByScenario[scenario.id] ?? 0
            const isCompleted = !!prog?.completed_at
            const stepsCompleted = prog?.steps_completed ?? 0

            return (
              <Link
                key={scenario.id}
                href={`/scenario/${scenario.id}`}
                className="block bg-gray-900 border border-gray-800 hover:border-amber-500/40 rounded-2xl p-5 transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="text-3xl">{scenario.thumbnail}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <h2 className="text-white font-bold group-hover:text-amber-300 transition-colors">
                        {scenario.name}
                      </h2>
                      {isCompleted && (
                        <span className="bg-green-900/40 text-green-400 text-xs px-2 py-0.5 rounded-full border border-green-800">
                          CLEAR
                        </span>
                      )}
                      {reviewCount > 0 && (
                        <span className="bg-amber-900/40 text-amber-400 text-xs px-2 py-0.5 rounded-full border border-amber-800">
                          🔄 {reviewCount}
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 text-xs">{scenario.location}</p>
                  </div>
                  <div className="text-gray-600 group-hover:text-amber-400 transition-colors text-lg shrink-0">▶</div>
                </div>

                {stepsCompleted > 0 && !isCompleted && (
                  <div className="mt-3">
                    <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-600 rounded-full"
                        style={{ width: `${(stepsCompleted / 5) * 100}%` }}
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
