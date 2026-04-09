'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getLevelInfo, calculateXP, LEVELS } from '@/lib/levels'
import type { UserProgress, UserMistake, Scenario } from '@/lib/scenarios/data'
import type { User } from '@supabase/supabase-js'

type Props = {
  user: User
  progress: UserProgress[]
  mastered: UserMistake[]
  unmastered: UserMistake[]
  scenarios: Scenario[]
}

export default function ProfileClient({ user, progress, mastered, unmastered, scenarios }: Props) {
  const router = useRouter()
  const supabase = createClient()

  const totalScore = progress.reduce((sum, p) => sum + (p.total_score ?? 0), 0)
  const masteredCount = mastered.length
  const completedCount = progress.filter(p => !!p.completed_at).length
  const xp = calculateXP(totalScore, masteredCount, completedCount)
  const levelInfo = getLevelInfo(xp)

  const scenarioMap = Object.fromEntries(scenarios.map(s => [s.id, s]))

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <header className="border-b border-gray-800/50 px-5 py-4 flex items-center justify-between">
        <Link href="/dashboard" className="text-gray-600 hover:text-gray-400 text-sm transition-colors">
          ← Dashboard
        </Link>
        <span className="text-xs text-gray-600 tracking-widest uppercase">My Page</span>
        <button onClick={signOut} className="text-gray-600 hover:text-red-400 text-xs transition-colors">
          Sign out
        </button>
      </header>

      <div className="max-w-lg mx-auto px-5 py-8 space-y-5">

        {/* Level Card — hero */}
        <div
          className="rounded-2xl p-6 relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(245,158,11,0.12) 0%, rgba(10,10,15,0.9) 60%)',
            border: '1px solid rgba(245,158,11,0.2)',
            boxShadow: '0 0 40px rgba(245,158,11,0.06)',
          }}
        >
          {/* Glow */}
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(245,158,11,0.08) 0%, transparent 70%)' }} />

          <div className="flex items-start justify-between mb-5">
            <div>
              <p className="text-xs text-amber-600/60 tracking-widest uppercase font-medium mb-1">
                LEVEL {levelInfo.level}
              </p>
              <h2 className="text-2xl font-black text-white" style={{ letterSpacing: '-0.02em' }}>
                {levelInfo.emoji} {levelInfo.title}
              </h2>
              <p className="text-gray-500 text-sm mt-1 truncate max-w-[200px]">
                {user.email}
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-black text-amber-400">{levelInfo.level}</div>
              <div className="text-xs text-gray-600 uppercase tracking-wider">LV</div>
            </div>
          </div>

          {/* XP Bar */}
          <div className="mb-2">
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-gray-500">{xp.toLocaleString()} XP</span>
              {levelInfo.nextLevel ? (
                <span className="text-gray-600">{levelInfo.nextLevel.minXP.toLocaleString()} XP</span>
              ) : (
                <span className="text-amber-500 font-bold">MAX LEVEL</span>
              )}
            </div>
            <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${levelInfo.progress}%`,
                  background: 'linear-gradient(90deg, #d97706, #f59e0b)',
                  boxShadow: '0 0 8px rgba(245,158,11,0.4)',
                }}
              />
            </div>
          </div>
          {levelInfo.nextLevel && (
            <p className="text-xs text-gray-700">
              다음 레벨까지 {(levelInfo.nextLevel.minXP - xp).toLocaleString()} XP
            </p>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'TOTAL SCORE', value: totalScore.toLocaleString(), icon: '⭐' },
            { label: 'MASTERED', value: masteredCount, icon: '✓' },
            { label: 'COMPLETED', value: `${completedCount}/${scenarios.length}`, icon: '🏁' },
          ].map(stat => (
            <div key={stat.label} className="bg-gray-900 border border-gray-800 rounded-2xl p-4 text-center">
              <div className="text-xl mb-1">{stat.icon}</div>
              <div className="text-white font-black text-lg">{stat.value}</div>
              <div className="text-gray-600 text-xs tracking-wider mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Level Road Map */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <h3 className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-4">LEVEL ROAD MAP</h3>
          <div className="space-y-2.5">
            {LEVELS.map(l => {
              const isUnlocked = xp >= l.minXP
              const isCurrent = l.level === levelInfo.level
              return (
                <div key={l.level} className={`flex items-center gap-3 rounded-xl px-4 py-3 transition-all ${
                  isCurrent ? 'bg-amber-900/20 border border-amber-700/30' : 'border border-transparent'
                }`}>
                  <div className={`text-xl ${isUnlocked ? '' : 'grayscale opacity-30'}`}>{l.emoji}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold ${isCurrent ? 'text-amber-400' : isUnlocked ? 'text-white' : 'text-gray-700'}`}>
                        Lv.{l.level} {l.title}
                      </span>
                      {isCurrent && <span className="text-xs bg-amber-900/50 text-amber-400 border border-amber-700/40 rounded px-1.5 py-0.5">NOW</span>}
                    </div>
                    <div className="text-xs text-gray-600">{l.minXP.toLocaleString()} XP~</div>
                  </div>
                  {isUnlocked && !isCurrent && (
                    <span className="text-green-500 text-sm">✓</span>
                  )}
                  {!isUnlocked && (
                    <span className="text-gray-700 text-sm">🔒</span>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Mastered Expressions */}
        {mastered.length > 0 && (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
            <h3 className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-4">
              MASTERED EXPRESSIONS ({mastered.length})
            </h3>
            <div className="space-y-2">
              {mastered.slice(0, 10).map(m => (
                <div key={m.id} className="flex items-start gap-3 py-2 border-b border-gray-800/50 last:border-0">
                  <span className="text-green-500 text-xs mt-0.5">✓</span>
                  <div>
                    <p className="text-green-300 text-sm font-medium">"{m.correct_expression}"</p>
                    {m.context && <p className="text-gray-600 text-xs mt-0.5">{m.context.slice(0, 60)}...</p>}
                  </div>
                </div>
              ))}
              {mastered.length > 10 && (
                <p className="text-gray-600 text-xs text-center pt-2">+{mastered.length - 10}개 더</p>
              )}
            </div>
          </div>
        )}

        {/* Unmastered */}
        {unmastered.length > 0 && (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
            <h3 className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-4">
              REVIEW NEEDED ({unmastered.length})
            </h3>
            <div className="space-y-2">
              {unmastered.slice(0, 5).map(m => {
                const scenario = scenarioMap[m.scenario_id]
                return (
                  <div key={m.id} className="flex items-start gap-3 py-2 border-b border-gray-800/50 last:border-0">
                    <span className="text-amber-500 text-xs mt-0.5">△</span>
                    <div>
                      <p className="text-amber-200 text-sm">"{m.correct_expression}"</p>
                      <p className="text-gray-600 text-xs">{scenario?.name} · {m.mistake_count}회 틀림</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <div className="pb-8" />
      </div>
    </div>
  )
}
