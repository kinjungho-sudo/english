'use client'

import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { getLevelInfo, calculateXP } from '@/lib/levels'
import type { Scenario, UserProgress, UserMistake } from '@/lib/scenarios/data'
import type { User } from '@supabase/supabase-js'

type Props = {
  user: User
  scenarios: Scenario[]
  progress: UserProgress[]
  unmastered: UserMistake[]
  mastered: UserMistake[]
}

export default function DashboardClient({ user, scenarios, progress, unmastered, mastered }: Props) {
  const router = useRouter()
  const supabase = createClient()

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

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <header className="border-b border-gray-800/50 px-5 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">✈️</span>
          <span className="font-black text-white tracking-widest text-sm uppercase">TravelSpeak</span>
        </div>
        <div className="flex items-center gap-3">
          {/* Level badge */}
          <Link
            href="/profile"
            className="flex items-center gap-1.5 bg-amber-900/20 border border-amber-700/30 rounded-full px-3 py-1 hover:border-amber-500/50 transition-colors"
          >
            <span className="text-sm">{levelInfo.emoji}</span>
            <span className="text-amber-400 text-xs font-bold">Lv.{levelInfo.level}</span>
          </Link>
          <button onClick={signOut} className="text-gray-600 hover:text-gray-400 text-xs transition-colors">
            Exit
          </button>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-5 py-8">
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
  )
}
