import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getLevelInfo, calculateXP } from '@/lib/levels'
import ResultClient from '@/components/ResultClient'

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
  const maxScore = stepsCount * 100
  const percentage = Math.round((score / maxScore) * 100)

  const [{ data: scenario }, { data: mistakes }, { data: allProgress }, { data: allMastered }] = await Promise.all([
    supabase.from('scenarios').select('*').eq('id', id).single(),
    supabase
      .from('user_mistakes')
      .select('*')
      .eq('user_id', user.id)
      .eq('scenario_id', id)
      .is('mastered_at', null)
      .order('mistake_count', { ascending: false })
      .limit(5),
    supabase
      .from('user_progress')
      .select('total_score, completed_at')
      .eq('user_id', user.id),
    supabase
      .from('user_mistakes')
      .select('id')
      .eq('user_id', user.id)
      .not('mastered_at', 'is', null),
  ])

  if (!scenario) redirect('/dashboard')

  // XP after (current state — includes this run)
  const totalScore = (allProgress ?? []).reduce((s, p) => s + (p.total_score ?? 0), 0)
  const completedCount = (allProgress ?? []).filter(p => !!p.completed_at).length
  const masteredCount = (allMastered ?? []).length
  const xpAfter = calculateXP(totalScore, masteredCount, completedCount)

  // XP before (subtract this run's contribution)
  const xpGained = score + 200 // score + completion bonus
  const xpBefore = Math.max(0, xpAfter - xpGained)

  const levelBefore = getLevelInfo(xpBefore)
  const levelAfter  = getLevelInfo(xpAfter)

  const grade =
    percentage >= 90 ? { label: 'Excellent!',      emoji: '🏆', color: 'text-yellow-400', bg: 'rgba(234,179,8,0.08)' } :
    percentage >= 70 ? { label: 'Great job!',       emoji: '🎉', color: 'text-green-400',  bg: 'rgba(74,222,128,0.08)' } :
    percentage >= 50 ? { label: 'Good effort!',     emoji: '👍', color: 'text-blue-400',   bg: 'rgba(96,165,250,0.08)' } :
                       { label: 'Keep at it!',      emoji: '💪', color: 'text-amber-400',  bg: 'rgba(245,158,11,0.08)' }

  return (
    <ResultClient
      scenarioId={id}
      scenarioName={scenario.name}
      score={score}
      maxScore={maxScore}
      percentage={percentage}
      grade={grade}
      levelBefore={levelBefore}
      levelAfter={levelAfter}
      xpGained={xpGained}
      mistakes={mistakes ?? []}
    />
  )
}
