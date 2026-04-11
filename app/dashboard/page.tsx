import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import DashboardClient from './DashboardClient'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const [{ data: profile }, { data: scenarios }, { data: progress }, { data: unmastered }, { data: mastered }] = await Promise.all([
    supabase.from('profiles').select('character_name, avatar_emoji').eq('id', user.id).single(),
    supabase.from('scenarios').select('*').order('order_index'),
    supabase.from('user_progress').select('*').eq('user_id', user.id),
    supabase.from('user_mistakes').select('*').eq('user_id', user.id).is('mastered_at', null),
    supabase.from('user_mistakes').select('*').eq('user_id', user.id).not('mastered_at', 'is', null),
  ])

  // 최초 로그인 시 캐릭터 설정 페이지로
  if (!profile?.character_name) redirect('/setup')

  return (
    <DashboardClient
      user={user}
      characterName={profile.character_name}
      avatarEmoji={profile.avatar_emoji ?? '🧑‍💼'}
      scenarios={scenarios ?? []}
      progress={progress ?? []}
      unmastered={unmastered ?? []}
      mastered={mastered ?? []}
    />
  )
}
