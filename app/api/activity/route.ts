import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/activity — 이번 달 + 저번 달 접속 날짜 목록 반환
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ dates: [] }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles')
      .select('activity_dates')
      .eq('id', user.id)
      .single()

    const dates: string[] = profile?.activity_dates ?? []
    return NextResponse.json({ dates })
  } catch {
    return NextResponse.json({ dates: [] })
  }
}
