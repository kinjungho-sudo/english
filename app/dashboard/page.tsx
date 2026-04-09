import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import DashboardClient from './DashboardClient'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const [{ data: scenarios }, { data: progress }, { data: mistakes }] = await Promise.all([
    supabase.from('scenarios').select('*').order('order_index'),
    supabase.from('user_progress').select('*').eq('user_id', user.id),
    supabase
      .from('user_mistakes')
      .select('*')
      .eq('user_id', user.id)
      .is('mastered_at', null),
  ])

  return (
    <DashboardClient
      user={user}
      scenarios={scenarios ?? []}
      progress={progress ?? []}
      unmastered={mistakes ?? []}
    />
  )
}
