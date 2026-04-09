import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { scenarioId, stepsCompleted, totalScore, completed } = await request.json()

    const { data: existing } = await supabase
      .from('user_progress')
      .select('id')
      .eq('user_id', user.id)
      .eq('scenario_id', scenarioId)
      .single()

    const payload = {
      user_id: user.id,
      scenario_id: scenarioId,
      steps_completed: stepsCompleted,
      total_score: totalScore,
      ...(completed ? { completed_at: new Date().toISOString() } : {}),
    }

    if (existing) {
      await supabase.from('user_progress').update(payload).eq('id', existing.id)
    } else {
      await supabase.from('user_progress').insert(payload)
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Progress API error:', err)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
