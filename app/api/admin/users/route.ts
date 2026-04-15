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
  const limit = 20
  const offset = (page - 1) * limit

  const admin = createAdminClient()

  // auth.users 목록 (서비스 역할 필요)
  const { data: authUsers } = await admin.auth.admin.listUsers({
    page,
    perPage: limit,
  })

  const userIds = (authUsers?.users ?? []).map((u: { id: string }) => u.id)

  const [profilesRes, progressRes, logsRes] = await Promise.all([
    admin.from('profiles').select('*').in('id', userIds),
    admin.from('user_progress')
      .select('user_id, scenario_id, completed_at, total_score')
      .in('user_id', userIds),
    admin.from('chat_logs')
      .select('user_id, score, created_at')
      .in('user_id', userIds)
      .order('created_at', { ascending: false }),
  ])

  const profileMap: Record<string, { character_name: string; avatar_emoji: string; difficulty: string }> = {}
  for (const p of (profilesRes.data ?? [])) {
    profileMap[p.id] = p
  }

  const progressByUser: Record<string, { total: number; completed: number; totalScore: number }> = {}
  for (const p of (progressRes.data ?? [])) {
    if (!progressByUser[p.user_id]) {
      progressByUser[p.user_id] = { total: 0, completed: 0, totalScore: 0 }
    }
    progressByUser[p.user_id].total++
    if (p.completed_at) {
      progressByUser[p.user_id].completed++
      progressByUser[p.user_id].totalScore += p.total_score ?? 0
    }
  }

  const logsByUser: Record<string, { count: number; lastAt: string | null; avgScore: number }> = {}
  for (const l of (logsRes.data ?? [])) {
    if (!logsByUser[l.user_id]) {
      logsByUser[l.user_id] = { count: 0, lastAt: null, avgScore: 0 }
    }
    logsByUser[l.user_id].count++
    if (!logsByUser[l.user_id].lastAt) logsByUser[l.user_id].lastAt = l.created_at
    logsByUser[l.user_id].avgScore += l.score
  }
  for (const uid of Object.keys(logsByUser)) {
    if (logsByUser[uid].count > 0) {
      logsByUser[uid].avgScore = Math.round(logsByUser[uid].avgScore / logsByUser[uid].count)
    }
  }

  const users = (authUsers?.users ?? []).map((u: { id: string; email?: string; created_at: string; last_sign_in_at?: string }) => ({
    id: u.id,
    email: u.email,
    createdAt: u.created_at,
    lastSignIn: u.last_sign_in_at,
    profile: profileMap[u.id] ?? null,
    progress: progressByUser[u.id] ?? { total: 0, completed: 0, totalScore: 0 },
    logs: logsByUser[u.id] ?? { count: 0, lastAt: null, avgScore: 0 },
  }))

  const total = 'total' in (authUsers ?? {}) ? (authUsers as { total?: number }).total ?? 0 : 0
  return NextResponse.json({ users, total, page })
}
