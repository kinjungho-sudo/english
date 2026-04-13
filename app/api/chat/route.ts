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

LEARNING GOAL: The learner should naturally use these expressions: ${JSON.stringify(expectedKeywords)}
Hint given to learner: "${hintTemplate ?? 'none'}"
This is attempt ${attempt} of ${maxAttempts}.

CONVERSATION SO FAR:
${historyText || '(conversation just started)'}

Learner's latest reply: "${userInput}"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SCORE TIERS — choose ONE, be strict:

● 90–100 (Perfect): Complete, natural English sentence. Native speaker quality.
   feedback: "✅ 완벽해요! " + 1 sentence praise (Korean)
   correction: null
   goalAchieved: true

● 70–89 (Great): Goal achieved. Communication works, minor imperfections OK.
   feedback: "✅ 잘했어요! " + brief positive (Korean)
   correction: null
   goalAchieved: true

● 30–60 (Tried): Understood the intent but expression is awkward, incomplete, or unnatural.
   feedback: "💬 이해는 했어요! " + explain in one sentence what would sound more natural (Korean)
   correction: "이렇게 말하는 게 더 자연스러워요: [better English expression]"
   goalAchieved: false

● 0 (Wrong): Completely off-topic, wrong context, or the response makes no sense here.
   feedback: "❌ " + briefly explain in one sentence why this doesn't work (Korean)
   correction: "정답 표현: [target English expression]"
   goalAchieved: false
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

npcResponse rules:
- Always respond in character as ${npcName} at ${scenarioLocation} (1–2 English sentences)
- Score 70+: natural continuation of the scene
- Score 0–60: subtly weave the correct target expression into your reply so the learner hears it
${isLastAttempt ? '- This is the LAST attempt — be warm and encouraging regardless of score' : ''}

Respond ONLY with JSON (no markdown):
{
  "goalAchieved": <true|false>,
  "score": <0 | 30-60 | 70-89 | 90-100>,
  "npcResponse": "<1-2 sentences in English as ${npcName}>",
  "feedback": "<Korean feedback with prefix as described above>",
  "correction": <null or Korean string>,
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
