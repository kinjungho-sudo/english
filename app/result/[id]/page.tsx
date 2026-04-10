import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function ResultPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ score?: string; steps?: string }>
}) {
  const { id } = await params
  const { score: scoreStr, steps: stepsStr } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const score = parseInt(scoreStr ?? '0', 10)
  const stepsCount = parseInt(stepsStr ?? '5', 10)

  const [{ data: scenario }, { data: mistakes }] = await Promise.all([
    supabase.from('scenarios').select('*').eq('id', id).single(),
    supabase
      .from('user_mistakes')
      .select('*')
      .eq('user_id', user.id)
      .eq('scenario_id', id)
      .is('mastered_at', null)
      .order('mistake_count', { ascending: false })
      .limit(5),
  ])

  if (!scenario) redirect('/dashboard')

  const maxScore = stepsCount * 100
  const percentage = Math.round((score / maxScore) * 100)
  const grade =
    percentage >= 90 ? { label: 'Excellent!', emoji: '🏆', color: 'text-yellow-400' } :
    percentage >= 70 ? { label: 'Great job!', emoji: '🎉', color: 'text-green-400' } :
    percentage >= 50 ? { label: 'Good effort!', emoji: '👍', color: 'text-blue-400' } :
    { label: 'Keep practicing!', emoji: '💪', color: 'text-amber-400' }

  return (
    <div className="game-wrap bg-gray-950">
      <div className="game-card bg-gray-950">
      <div className="flex-1 overflow-y-auto px-6 py-12">
        {/* Result Header */}
        <div className="text-center mb-10">
          <div className="text-6xl mb-4">{grade.emoji}</div>
          <h1 className={`text-3xl font-black mb-2 ${grade.color}`} style={{ letterSpacing: '-0.03em' }}>
            {grade.label}
          </h1>
          <p className="text-gray-500">{scenario.name} 시나리오 완료</p>
        </div>

        {/* Score Card */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-gray-500 text-sm">최종 점수</span>
            <span className="text-amber-400 font-black text-3xl">{score}</span>
          </div>
          <div className="h-2 bg-gray-800 rounded-full overflow-hidden mb-3">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all"
              style={{ width: `${percentage}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-600">
            <span>0</span>
            <span className="text-gray-400 font-medium">{percentage}%</span>
            <span>{maxScore}</span>
          </div>
        </div>

        {/* Mistakes to review */}
        {mistakes && mistakes.length > 0 && (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-6">
            <h2 className="text-white font-bold mb-1">복습할 표현 ({mistakes.length}개)</h2>
            <p className="text-gray-600 text-xs mb-4">다음번엔 더 자신 있게 말할 수 있어요</p>
            <div className="space-y-3">
              {mistakes.map(m => (
                <div key={m.id} className="bg-gray-800 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <span className="text-red-400 text-lg mt-0.5">✗</span>
                    <div>
                      <p className="text-gray-400 text-sm line-through mb-1">{m.wrong_input}</p>
                      <p className="text-green-300 text-sm font-medium">"{m.correct_expression}"</p>
                      {m.context && (
                        <p className="text-gray-600 text-xs mt-1">{m.context}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <Link
            href={`/scenario/${id}`}
            className="block text-center bg-amber-500 hover:bg-amber-400 text-gray-950 font-bold rounded-xl py-3.5 transition-colors"
          >
            다시 플레이
          </Link>
          <Link
            href="/dashboard"
            className="block text-center border border-gray-700 hover:border-gray-500 text-gray-400 hover:text-white rounded-xl py-3.5 transition-colors"
          >
            다른 시나리오 보기
          </Link>
        </div>
      </div>
      </div>
    </div>
  )
}
