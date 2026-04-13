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

    // Korean input detection — encourage English without consuming an attempt
    const hasKorean = /[\uac00-\ud7a3\u3131-\u318e]/.test(userInput)
    if (hasKorean) {
      const koreanNudges = [
        "Oh, I think you meant to say that in English! Give it a try — I believe in you!",
        "Hmm, let's try that in English! You can do it!",
        "I heard you, but let's practice in English — that's what we're here for!",
      ]
      const npcResponse = koreanNudges[Math.floor(Math.random() * koreanNudges.length)]
      return NextResponse.json({
        goalAchieved: false,
        score: 0,
        npcResponse,
        feedback: '영어로 말해봐요! 완벽하지 않아도 괜찮으니 영어로 도전해보세요 😊',
        correction: hintTemplate ? `힌트: "${hintTemplate}"` : null,
        naturalExpression: expectedKeywords?.[0] ?? '',
        advanceToNext: false,
        isKoreanInput: true,
      })
    }

    // Build conversation context for the prompt
    const historyText = conversationHistory
      .map(m => `${m.role === 'npc' ? npcName : 'Learner'}: ${m.content}`)
      .join('\n')

    const isLastAttempt = attempt >= maxAttempts

    const prompt = `You are ${npcName}, working at ${scenarioLocation || 'a travel location'}. You are also a warm English teacher helping a Korean beginner traveler.

LEARNING GOAL: Guide the learner to naturally use: ${JSON.stringify(expectedKeywords)}
Hint available: "${hintTemplate ?? 'none'}"
Attempt: ${attempt} / ${maxAttempts}

CONVERSATION SO FAR:
${historyText || '(just started)'}

Learner said: "${userInput}"

━━━ SCORING (strict) ━━━
90–100: Perfect natural English, native-speaker quality → goalAchieved: true
70–89:  Goal achieved, minor imperfections OK → goalAchieved: true
30–60:  Understood intent but awkward/incomplete → goalAchieved: false
0:      Off-topic, wrong context, incomprehensible → goalAchieved: false
━━━━━━━━━━━━━━━━━━━━━━━━

FEEDBACK (Korean, 1–2 sentences, write naturally — no rigid templates):
- Score 70+: genuine praise, vary your words each time
- Score 30–60: acknowledge the attempt warmly, then suggest the better expression in a natural way
- Score 0: explain briefly and kindly why it doesn't fit this situation
Never use emoji prefixes. Sound like a friendly teacher, not a grading rubric.

CORRECTION:
- Score 70+: null
- Score 30–60: natural Korean suggestion, e.g. "~라고 하면 더 자연스러워요"
- Score 0: show the target expression, e.g. "여기선 '...'라고 해야 해요"

NPC RESPONSE (English, 1–2 sentences, in character as ${npcName}):
- Score 70+: continue the scene naturally
- Score 0–60: weave the correct expression into your reply so the learner hears it
${isLastAttempt ? '- Last attempt: be warm and move the scene forward regardless' : ''}

Respond ONLY with JSON (no markdown):
{
  "goalAchieved": <true|false>,
  "score": <0|30–60|70–89|90–100>,
  "npcResponse": "<English>",
  "feedback": "<Korean>",
  "correction": <null or Korean string>,
  "naturalExpression": "<most natural English for this goal>"
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
