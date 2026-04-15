import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

function isAdmin(email: string | undefined) {
  const adminEmails = (process.env.ADMIN_EMAILS ?? '').split(',').map(e => e.trim())
  return email && adminEmails.includes(email)
}

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !isAdmin(user.email)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') ?? '1')
  const limit = 50
  const offset = (page - 1) * limit
  const scenarioId = searchParams.get('scenario_id')
  const minScore = searchParams.get('min_score')
  const maxScore = searchParams.get('max_score')
  const koreanOnly = searchParams.get('korean_only') === 'true'

  const admin = createAdminClient()

  let query = admin
    .from('chat_logs')
    .select(`
      id,
      user_id,
      scenario_id,
      step_id,
      user_input,
      attempt,
      difficulty,
      keyword_used,
      goal_achieved,
      score,
      npc_response,
      feedback,
      correction,
      natural_expression,
      advance_to_next,
      is_korean_input,
      created_at,
      scenarios(name, thumbnail)
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (scenarioId) query = query.eq('scenario_id', scenarioId)
  if (minScore) query = query.gte('score', parseInt(minScore))
  if (maxScore) query = query.lte('score', parseInt(maxScore))
  if (koreanOnly) query = query.eq('is_korean_input', true)

  const { data, count, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // 유저 이메일 매핑 (중복 제거)
  const userIds = [...new Set((data ?? []).map((l: { user_id: string }) => l.user_id).filter(Boolean))]
  const emailMap: Record<string, string> = {}
  if (userIds.length > 0) {
    for (const uid of userIds) {
      const { data: u } = await admin.auth.admin.getUserById(uid as string)
      if (u?.user?.email) emailMap[uid as string] = u.user.email
    }
  }

  const logs = (data ?? []).map((l: {
    id: string
    user_id: string
    scenario_id: string
    step_id: string
    user_input: string
    attempt: number
    difficulty: string
    keyword_used: boolean
    goal_achieved: boolean
    score: number
    npc_response: string | null
    feedback: string | null
    correction: string | null
    natural_expression: string | null
    advance_to_next: boolean
    is_korean_input: boolean
    created_at: string
    scenarios: { name: string; thumbnail: string }[] | null
  }) => ({
    ...l,
    scenarios: Array.isArray(l.scenarios) ? (l.scenarios[0] ?? null) : l.scenarios,
    userEmail: emailMap[l.user_id] ?? l.user_id.slice(0, 8) + '...',
  }))

  return NextResponse.json({ logs, total: count ?? 0, page })
}
