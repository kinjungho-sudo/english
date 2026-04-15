import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

function isAdmin(email: string | undefined) {
  const adminEmails = (process.env.ADMIN_EMAILS ?? '').split(',').map(e => e.trim())
  return email && adminEmails.includes(email)
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !isAdmin(user.email)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const admin = createAdminClient()

  const [
    usersRes,
    logsRes,
    progressRes,
    mistakesRes,
    todayLogsRes,
    scoreRes,
  ] = await Promise.all([
    // 전체 유저 수
    admin.from('profiles').select('id', { count: 'exact', head: true }),
    // 전체 대화 수
    admin.from('chat_logs').select('id', { count: 'exact', head: true }),
    // 완료된 시나리오 수
    admin.from('user_progress').select('id', { count: 'exact', head: true })
      .not('completed_at', 'is', null),
    // 전체 실수 수
    admin.from('user_mistakes').select('id', { count: 'exact', head: true }),
    // 오늘 대화 수
    admin.from('chat_logs')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', new Date(new Date().setHours(0, 0, 0, 0)).toISOString()),
    // 평균 점수
    admin.from('chat_logs').select('score').not('is_korean_input', 'eq', true),
  ])

  const scores = (scoreRes.data ?? []).map((r: { score: number }) => r.score)
  const avgScore = scores.length > 0
    ? Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length)
    : 0

  // 시나리오별 완료율
  const scenariosRes = await admin
    .from('scenarios')
    .select('id, name, thumbnail')
    .order('order_index')

  const progressByScenario = await admin
    .from('user_progress')
    .select('scenario_id')
    .not('completed_at', 'is', null)

  const scenarioCounts: Record<string, number> = {}
  for (const p of (progressByScenario.data ?? [])) {
    scenarioCounts[p.scenario_id] = (scenarioCounts[p.scenario_id] ?? 0) + 1
  }

  const scenarioStats = (scenariosRes.data ?? []).map((s: { id: string; name: string; thumbnail: string }) => ({
    id: s.id,
    name: s.name,
    thumbnail: s.thumbnail,
    completions: scenarioCounts[s.id] ?? 0,
  }))

  // 일별 대화 수 (최근 7일)
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)
  sevenDaysAgo.setHours(0, 0, 0, 0)

  const recentLogsRes = await admin
    .from('chat_logs')
    .select('created_at')
    .gte('created_at', sevenDaysAgo.toISOString())

  const dailyCounts: Record<string, number> = {}
  for (const log of (recentLogsRes.data ?? [])) {
    const day = log.created_at.slice(0, 10)
    dailyCounts[day] = (dailyCounts[day] ?? 0) + 1
  }
  const dailyStats = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    dailyStats.push({ date: key, count: dailyCounts[key] ?? 0 })
  }

  return NextResponse.json({
    totalUsers: usersRes.count ?? 0,
    totalLogs: logsRes.count ?? 0,
    totalCompletions: progressRes.count ?? 0,
    totalMistakes: mistakesRes.count ?? 0,
    todayLogs: todayLogsRes.count ?? 0,
    avgScore,
    scenarioStats,
    dailyStats,
  })
}
