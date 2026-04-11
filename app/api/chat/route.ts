import Anthropic from '@anthropic-ai/sdk'
import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export interface ChatMessage {
  role: 'npc' | 'user'
  content: string
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const {
      userInput,
      conversationHistory,
      stepId,
      scenarioId,
      expectedKeywords,
      hintTemplate,
      npcName = 'NPC',
      scenarioLocation = '',
      attempt,
      maxAttempts = 3,
    } = await request.json() as {
      userInput: string
      conversationHistory: ChatMessage[]
      stepId: string
      scenarioId: string
      expectedKeywords: string[]
      hintTemplate: string | null
      npcName: string
      scenarioLocation: string
      attempt: number
      maxAttempts: number
    }

    if (!userInput) {
      return NextResponse.json({ error: 'Missing userInput' }, { status: 400 })
    }

    // Build conversation context for the prompt
    const historyText = conversationHistory
      .map(m => `${m.role === 'npc' ? npcName : 'Learner'}: ${m.content}`)
      .join('\n')

    const isLastAttempt = attempt >= maxAttempts

    const prompt = `You are ${npcName}, working at ${scenarioLocation || 'a travel location'}. You are also an English teacher helping a Korean beginner traveler practice English.

LEARNING GOAL: Guide the learner to naturally use these expressions: ${JSON.stringify(expectedKeywords)}
Hint given to learner: "${hintTemplate ?? 'none'}"
This is attempt ${attempt} of ${maxAttempts}.

CONVERSATION SO FAR:
${historyText || '(conversation just started)'}

Learner's latest reply: "${userInput}"

YOUR TASK:
1. Evaluate if the learner achieved the goal (used the target expressions naturally, even if grammar isn't perfect)
2. Stay in character as ${npcName} — respond naturally as that character would in ${scenarioLocation}
3. If goal NOT achieved and attempts remain: gently redirect toward the target expression within your character response (embed the correct expression naturally in your reply so they can hear it)
4. If goal achieved OR this is the last attempt: respond positively and wrap up this interaction
${isLastAttempt ? '5. This is the LAST attempt — be encouraging regardless of performance' : ''}

Respond ONLY with this JSON (no markdown):
{
  "goalAchieved": <true if learner used target expressions naturally, false otherwise>,
  "score": <0-100, where 100=perfect natural English, 70=goal achieved with minor issues, 40=partial attempt, 10=off-topic>,
  "npcResponse": "<1-2 sentences in English as ${npcName}, in-character — if not achieved, subtly model the correct expression>,
  "feedback": "<1-2 sentences Korean feedback — always start with praise, then gentle tip>",
  "correction": <null or "더 자연스러운 표현: [expression]" in Korean>,
  "naturalExpression": "<the most natural English expression for this goal>"
}`

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text.trim() : '{}'
    const result = JSON.parse(text)

    const advanceToNext = result.goalAchieved || isLastAttempt

    // Save mistake if goal not achieved on any attempt
    if (!result.goalAchieved && stepId && scenarioId) {
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
          correct_expression: result.naturalExpression ?? '',
          context: conversationHistory[0]?.content ?? '',
          mistake_count: 1,
        })
      }
    }

    // Master the mistake if goal achieved
    if (result.goalAchieved && stepId) {
      await supabase
        .from('user_mistakes')
        .update({ mastered_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .eq('step_id', stepId)
        .is('mastered_at', null)
    }

    return NextResponse.json({
      goalAchieved: result.goalAchieved ?? false,
      score: result.score ?? 50,
      npcResponse: result.npcResponse ?? '',
      feedback: result.feedback ?? '',
      correction: result.correction ?? null,
      naturalExpression: result.naturalExpression ?? '',
      advanceToNext,
    })
  } catch (err) {
    console.error('Chat API error:', err)
    return NextResponse.json({ error: 'Chat failed' }, { status: 500 })
  }
}
