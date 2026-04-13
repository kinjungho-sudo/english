import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Upsert a mistake record — increment count if exists, insert if not.
 * Called from both /api/chat and /api/evaluate on wrong answers.
 */
export async function saveMistake(
  supabase: SupabaseClient,
  userId: string,
  stepId: string,
  scenarioId: string,
  wrongInput: string,
  correctExpression: string,
  context: string,
) {
  const { data: existing } = await supabase
    .from('user_mistakes')
    .select('id, mistake_count')
    .eq('user_id', userId)
    .eq('step_id', stepId)
    .single()

  if (existing) {
    await supabase
      .from('user_mistakes')
      .update({
        mistake_count: existing.mistake_count + 1,
        wrong_input: wrongInput,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
  } else {
    await supabase.from('user_mistakes').insert({
      user_id: userId,
      scenario_id: scenarioId,
      step_id: stepId,
      wrong_input: wrongInput,
      correct_expression: correctExpression,
      context,
      mistake_count: 1,
    })
  }
}

/**
 * Mark all unmastered mistakes for a step as mastered.
 * Called from both /api/chat and /api/evaluate on correct answers.
 */
export async function markMastered(
  supabase: SupabaseClient,
  userId: string,
  stepId: string,
) {
  await supabase
    .from('user_mistakes')
    .update({ mastered_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('step_id', stepId)
    .is('mastered_at', null)
}
