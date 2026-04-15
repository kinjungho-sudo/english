import OpenAI from 'openai'
import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { SpeechCreateParams } from 'openai/resources/audio/speech'

type Voice = SpeechCreateParams['voice']

const NPC_TTS: Record<string, { voice: Voice; speed: number }> = {
  SARAH: { voice: 'nova',    speed: 1.08 },
  MIKE:  { voice: 'onyx',   speed: 0.95 },
  EMMA:  { voice: 'shimmer', speed: 0.92 },
  LUCY:  { voice: 'alloy',  speed: 1.12 },
  JAMES: { voice: 'echo',   speed: 1.06 },
  KATE:  { voice: 'nova',   speed: 1.14 },
  CHEN:  { voice: 'fable',  speed: 0.90 },
}

const DEFAULT_TTS: { voice: Voice; speed: number } = { voice: 'alloy', speed: 1.0 }

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { text, npcName } = await req.json() as { text: string; npcName: string }
    if (!text) return NextResponse.json({ error: 'text required' }, { status: 400 })

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    const { voice, speed } = NPC_TTS[npcName?.toUpperCase()] ?? DEFAULT_TTS

    const mp3 = await openai.audio.speech.create({
      model: 'tts-1',
      voice,
      input: text,
      speed,
    })

    const buffer = Buffer.from(await mp3.arrayBuffer())

    return new NextResponse(buffer, {
      status: 200,
      headers: { 'Content-Type': 'audio/mpeg' },
    })
  } catch (err) {
    console.error('TTS error:', err)
    return NextResponse.json({ error: 'TTS failed' }, { status: 500 })
  }
}
