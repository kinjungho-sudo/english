import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles')
      .select('streak_count, last_active_date, activity_dates')
      .eq('id', user.id)
      .single()

    if (!profile) return NextResponse.json({ streak: 0 })

    const today = new Date().toISOString().slice(0, 10) // YYYY-MM-DD
    const last = profile.last_active_date as string | null
    const existingDates: string[] = profile.activity_dates ?? []

    // activity_dates에 오늘 추가 (중복 방지)
    const activityDates = existingDates.includes(today)
      ? existingDates
      : [...existingDates, today]

    if (last === today) {
      // 이미 오늘 카운트됨 — activity_dates만 보정 후 반환
      if (!existingDates.includes(today)) {
        await supabase
          .from('profiles')
          .update({ activity_dates: activityDates })
          .eq('id', user.id)
      }
      return NextResponse.json({ streak: profile.streak_count ?? 0 })
    }

    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
    const newStreak = last === yesterday ? (profile.streak_count ?? 0) + 1 : 1

    await supabase
      .from('profiles')
      .update({
        streak_count: newStreak,
        last_active_date: today,
        activity_dates: activityDates,
      })
      .eq('id', user.id)

    return NextResponse.json({ streak: newStreak })
  } catch (err) {
    console.error('Streak API error:', err)
    return NextResponse.json({ streak: 0 })
  }
}
