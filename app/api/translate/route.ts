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
        content: `Translate the following English sentence into natural Korean. Return ONLY the Korean translation, no explanation.\n\n"${text}"`,
      },
    ],
  })

  const translation =
    message.content[0].type === 'text' ? message.content[0].text.trim() : ''

  return NextResponse.json({ translation })
}
