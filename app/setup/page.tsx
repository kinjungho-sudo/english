import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import SetupClient from './SetupClient'

export default async function SetupPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const { data: profile } = await supabase
    .from('profiles')
    .select('character_name, avatar_emoji')
    .eq('id', user.id)
    .single()

  // 이미 캐릭터 이름이 있으면 대시보드로
  if (profile?.character_name) redirect('/dashboard')

  return <SetupClient userId={user.id} />
}
