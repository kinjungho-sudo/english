import Anthropic from '@anthropic-ai/sdk'
import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { userInput, npcLine, hintTemplate, expectedKeywords, stepId, scenarioId } =
      await request.json()

    if (!userInput || !npcLine) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const prompt = `You are an English conversation coach evaluating a travel English learner's response.

CONTEXT:
- NPC said: "${npcLine}"
- Expected keywords/phrases: ${JSON.stringify(expectedKeywords)}
- Hint template given to learner: "${hintTemplate ?? 'none'}"
- Learner's response: "${userInput}"

EVALUATION RULES:
1. If the meaning is communicated (even with minor errors) → mark as correct
2. Always start with praise — find something positive
3. Corrections must be gentle: "More natural: ..." not "Wrong!"
4. If completely off-topic or incomprehensible → needs_retry: true
5. Score: 100 = perfect natural English, 70 = acceptable, 40 = understandable but awkward, 0 = incomprehensible

Respond ONLY with valid JSON (no markdown, no extra text):
{
  "score": <0-100>,
  "is_correct": <true|false>,
  "praise": "<1-2 sentence positive feedback in English>",
  "correction": "<null or 'More natural: ...' style suggestion>",
  "correct_expression": "<the most natural way to say this>",
  "needs_retry": <true|false>
}`

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 400,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    const evaluation = JSON.parse(text)

    // 오답인 경우 user_mistakes에 저장
    if (!evaluation.is_correct && stepId && scenarioId) {
      const { data: existing } = await supabase
        .from('user_mistakes')
        .select('id, mistake_count')
        .eq('user_id', user.id)
        .eq('step_id', stepId)
        .single()

      if (existing) {
        await supabase
          .from('user_mistakes')
          .update({
            mistake_count: existing.mistake_count + 1,
            wrong_input: userInput,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id)
      } else {
        await supabase.from('user_mistakes').insert({
          user_id: user.id,
          scenario_id: scenarioId,
          step_id: stepId,
          wrong_input: userInput,
          correct_expression: evaluation.correct_expression,
          context: npcLine,
          mistake_count: 1,
        })
      }
    }

    // 정답인 경우 — 해당 스텝 실수 마스터 처리 (3번 연속 정답 로직은 클라이언트에서 관리)
    if (evaluation.is_correct && stepId) {
      await supabase
        .from('user_mistakes')
        .update({ mastered_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .eq('step_id', stepId)
        .is('mastered_at', null)
    }

    return NextResponse.json(evaluation)
  } catch (err) {
    console.error('Evaluate API error:', err)
    return NextResponse.json({ error: 'Evaluation failed' }, { status: 500 })
  }
}
