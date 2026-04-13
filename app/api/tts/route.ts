import OpenAI from 'openai'
import { NextResponse, type NextRequest } from 'next/server'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

// NPC → OpenAI voice + speed
// Available voices: alloy | echo | fable | onyx | nova | shimmer
const NPC_TTS: Record<string, { voice: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer'; speed: number }> = {
  SARAH: { voice: 'nova',    speed: 1.08 }, // warm, friendly American female
  MIKE:  { voice: 'onyx',   speed: 0.95 }, // deep, authoritative male
  EMMA:  { voice: 'shimmer', speed: 0.92 }, // polished, refined female
  LUCY:  { voice: 'alloy',  speed: 1.12 }, // bright, energetic female
  JAMES: { voice: 'echo',   speed: 1.06 }, // casual, conversational male
  KATE:  { voice: 'nova',   speed: 1.14 }, // upbeat female — same voice as SARAH but faster
  CHEN:  { voice: 'fable',  speed: 0.90 }, // measured, careful — fable has slight British feel
}

const DEFAULT_TTS = { voice: 'alloy' as const, speed: 1.0 }

export async function POST(req: NextRequest) {
  try {
    const { text, npcName } = await req.json() as { text: string; npcName: string }
    if (!text) return NextResponse.json({ error: 'text required' }, { status: 400 })

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
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'public, max-age=86400', // 24h CDN cache
      },
    })
  } catch (err) {
    console.error('TTS error:', err)
    return NextResponse.json({ error: 'TTS failed' }, { status: 500 })
  }
}
