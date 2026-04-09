'use client'

import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { Scenario, UserProgress, UserMistake } from '@/lib/scenarios/data'
import type { User } from '@supabase/supabase-js'

type Props = {
  user: User
  scenarios: Scenario[]
  progress: UserProgress[]
  unmastered: UserMistake[]
}

export default function DashboardClient({ user, scenarios, progress, unmastered }: Props) {
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

  const hasReviewItems = unmastered.length > 0

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <header className="border-b border-gray-800/50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">✈️</span>
          <span className="font-bold text-white tracking-tight">TravelSpeak</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-gray-500 text-sm">{user.email}</span>
          <button onClick={signOut} className="text-gray-500 hover:text-white text-sm transition-colors">
            Sign out
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10">
        {/* Review Alert */}
        {hasReviewItems && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-5 mb-8 animate-fade-in-up">
            <div className="flex items-start gap-4">
              <span className="text-2xl mt-0.5">🔄</span>
              <div>
                <h3 className="text-amber-300 font-bold mb-1">복습할 표현이 있어요!</h3>
                <p className="text-amber-400/70 text-sm">
                  지난번에 틀렸던 표현 <strong className="text-amber-300">{unmastered.length}개</strong>를 오늘 다시 만나게 됩니다.
                </p>
              </div>
            </div>
          </div>
        )}

        <h1 className="text-2xl font-black text-white mb-2" style={{ letterSpacing: '-0.03em' }}>
          어떤 상황을 연습할까요?
        </h1>
        <p className="text-gray-500 text-sm mb-8">시나리오를 선택해 AI NPC와 대화를 시작하세요</p>

        <div className="space-y-4">
          {scenarios.map(scenario => {
            const prog = progressMap[scenario.id]
            const reviewCount = mistakeCountByScenario[scenario.id] ?? 0
            const isCompleted = !!prog?.completed_at
            const stepsCompleted = prog?.steps_completed ?? 0

            return (
              <Link
                key={scenario.id}
                href={`/scenario/${scenario.id}`}
                className="block bg-gray-900 border border-gray-800 hover:border-amber-500/40 rounded-2xl p-6 transition-all group"
              >
                <div className="flex items-center gap-5">
                  <div className="text-4xl">{scenario.thumbnail}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h2 className="text-white font-bold text-lg group-hover:text-amber-300 transition-colors">
                        {scenario.name}
                      </h2>
                      {isCompleted && (
                        <span className="bg-green-900/40 text-green-400 text-xs px-2 py-0.5 rounded-full border border-green-800">
                          완료
                        </span>
                      )}
                      {reviewCount > 0 && (
                        <span className="bg-amber-900/40 text-amber-400 text-xs px-2 py-0.5 rounded-full border border-amber-800">
                          복습 {reviewCount}개
                        </span>
                      )}
                    </div>
                    <p className="text-gray-500 text-sm">{scenario.location}</p>
                    <p className="text-gray-600 text-xs mt-1">with {scenario.npc_name} · {scenario.npc_personality}</p>
                  </div>
                  <div className="text-right shrink-0">
                    {stepsCompleted > 0 && (
                      <div className="text-amber-400 text-sm font-bold mb-1">{stepsCompleted}/5</div>
                    )}
                    <div className="text-gray-600 group-hover:text-amber-400 transition-colors text-xl">→</div>
                  </div>
                </div>

                {stepsCompleted > 0 && !isCompleted && (
                  <div className="mt-4">
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                      <span>진행 중</span>
                      <span>{Math.round((stepsCompleted / 5) * 100)}%</span>
                    </div>
                    <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-500 rounded-full transition-all"
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
