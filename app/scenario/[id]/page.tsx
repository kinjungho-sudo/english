import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import GameScene from './GameScene'

export default async function ScenarioPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const [{ data: scenario }, { data: steps }, { data: mistakes }] = await Promise.all([
    supabase.from('scenarios').select('*').eq('id', id).single(),
    supabase.from('dialogue_steps').select('*').eq('scenario_id', id).order('step_order'),
    supabase
      .from('user_mistakes')
      .select('step_id')
      .eq('user_id', user.id)
      .eq('scenario_id', id)
      .is('mastered_at', null),
  ])

  if (!scenario || !steps?.length) redirect('/dashboard')

  const mistakeStepIds = new Set((mistakes ?? []).map(m => m.step_id))

  return (
    <GameScene
      scenario={scenario}
      steps={steps}
      userId={user.id}
      mistakeStepIds={mistakeStepIds}
    />
  )
}
