import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic()

export async function POST(req: NextRequest) {
  const { text } = await req.json()
  if (!text || typeof text !== 'string') {
    return NextResponse.json({ error: 'text is required' }, { status: 400 })
  }

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 256,
    messages: [
      {
        role: 'user',
        content: `여행 영어 학습 앱에서 NPC의 대사를 한국어로 보여주려 합니다.
아래 영어 문장을 자연스러운 한국어로 번역해 주세요.

번역 원칙:
- 직역 금지 — 한국인이 실제로 쓰는 자연스러운 말투로
- 상황: 레스토랑/공항/호텔 직원이 손님에게 하는 말
- 존댓말 유지, 짧고 자연스럽게
- 번역문만 출력 (설명 없이)

"${text}"`,
      },
    ],
  })

  const translation =
    message.content[0].type === 'text' ? message.content[0].text.trim() : ''

  return NextResponse.json({ translation })
}
