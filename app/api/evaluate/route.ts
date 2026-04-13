import Anthropic from '@anthropic-ai/sdk'
import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { saveMistake, markMastered } from '@/lib/db/mistakes'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { userInput, npcLine, hintTemplate, expectedKeywords, stepId, scenarioId, npcName = 'NPC' } =
      await request.json()

    if (!userInput || !npcLine) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const prompt = `당신은 영어 왕초보 여행자를 돕는 친절한 영어 선생님입니다. 학습자의 영어 답변을 평가해주세요.

상황:
- NPC 이름: ${npcName}
- NPC가 한 말: "${npcLine}"
- 기대하는 키워드/표현: ${JSON.stringify(expectedKeywords)}
- 학습자에게 주어진 힌트: "${hintTemplate ?? '없음'}"
- 학습자의 답변: "${userInput}"

평가 원칙 (초급자 기준):
1. 의미가 통하면 정답 처리 — 문법이 약간 틀려도 괜찮음
2. 반드시 칭찬 먼저 — 아무리 짧은 답변도 잘한 점을 찾아서 칭찬
3. 교정은 부드럽게 — "틀렸어요" 절대 금지, "이렇게 말하면 더 자연스러워요" 형식
4. 완전히 엉뚱한 답변만 needs_retry: true (단순 문법 오류는 retry 불필요)
5. 점수: 100 = 완벽한 자연스러운 영어, 70 = 의미 전달 OK, 40 = 겨우 이해 가능, 0 = 이해 불가

npc_response 작성 규칙 (가장 중요):
- NPC가 학습자의 대답을 들은 직후 하는 영어 대사 (1~2문장)
- 항상 캐릭터 성격에 맞는 자연스러운 영어로 작성
- 정답/고득점(score >= 60): 학습자 답변을 자연스럽게 받아서 다음 단계로 이어가는 대사
  예시) "Perfect! Right this way, please!" / "Of course! Window seat, coming right up!"
- 오답/저득점(score < 60): 학습자가 말하려 했던 내용을 부드럽게 올바른 표현으로 되물으며 확인하는 대사
  예시) 학습자가 "table two" 라고 했다면 → "Oh, a table for two? Sure, follow me!"
  예시) 학습자가 "window" 라고만 했다면 → "A window seat? I'll check if one's available!"
  — 핵심: 오답 시 올바른 표현을 대사 안에 자연스럽게 포함시켜 학습자가 들으며 배울 수 있게 할 것

모든 피드백(praise, correction)은 반드시 한국어로 작성하세요.
JSON만 응답하세요 (마크다운, 추가 텍스트 금지):
{
  "score": <0-100>,
  "is_correct": <true|false>,
  "praise": "<1-2문장 한국어 칭찬>",
  "correction": "<null 또는 한국어로 '더 자연스러운 표현: ...' 형식>",
  "correct_expression": "<가장 자연스러운 영어 표현>",
  "needs_retry": <true|false>,
  "npc_response": "<NPC의 자연스러운 영어 반응 1~2문장>"
}`

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 600,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    const evaluation = JSON.parse(text)

    if (!evaluation.is_correct && stepId && scenarioId) {
      await saveMistake(supabase, user.id, stepId, scenarioId, userInput,
        evaluation.correct_expression, npcLine)
    }
    if (evaluation.is_correct && stepId) {
      await markMastered(supabase, user.id, stepId)
    }

    return NextResponse.json(evaluation)
  } catch (err) {
    console.error('Evaluate API error:', err)
    return NextResponse.json({ error: 'Evaluation failed' }, { status: 500 })
  }
}
