import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ProfileClient from './ProfileClient'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const [
    { data: progress },
    { data: mastered },
    { data: allMistakes },
    { data: scenarios },
  ] = await Promise.all([
    supabase.from('user_progress').select('*').eq('user_id', user.id),
    supabase.from('user_mistakes').select('*').eq('user_id', user.id).not('mastered_at', 'is', null),
    supabase.from('user_mistakes').select('*').eq('user_id', user.id).is('mastered_at', null),
    supabase.from('scenarios').select('*').order('order_index'),
  ])

  return (
    <ProfileClient
      user={user}
      progress={progress ?? []}
      mastered={mastered ?? []}
      unmastered={allMistakes ?? []}
      scenarios={scenarios ?? []}
    />
  )
}
