'use client'

import { useEffect, useState, useRef, useCallback } from 'react'

type Props = {
  npcName: string
  line: string
  ttsText: string | null
  onTTSEnd?: () => void
}

type TranslateState = 'idle' | 'loading' | 'done' | 'error'

const NPC_NAMEPLATE: Record<string, string> = {
  SARAH: 'dialogue-nameplate-SARAH',
  MIKE:  'dialogue-nameplate-MIKE',
  EMMA:  'dialogue-nameplate-EMMA',
  LUCY:  'dialogue-nameplate-LUCY',
  JAMES: 'dialogue-nameplate-JAMES',
  KATE:  'dialogue-nameplate-KATE',
  CHEN:  'dialogue-nameplate-CHEN',
}

const NPC_BORDER: Record<string, string> = {
  SARAH: 'dialogue-box-SARAH',
  MIKE:  'dialogue-box-MIKE',
  EMMA:  'dialogue-box-EMMA',
  LUCY:  'dialogue-box-LUCY',
  JAMES: 'dialogue-box-JAMES',
  KATE:  'dialogue-box-KATE',
  CHEN:  'dialogue-box-CHEN',
}

const SPEEDS = [0.75, 1.0, 1.25, 1.5]

const MAX_AUDIO_CACHE = 60
// In-memory audio cache: cacheKey → object URL (insertion-order LRU via Map)
const audioCache = new Map<string, string>()

function cacheKey(text: string, npcName: string) {
  return `${npcName}::${text}`
}

function setCached(key: string, url: string) {
  if (audioCache.size >= MAX_AUDIO_CACHE) {
    // Map preserves insertion order — first key is oldest
    const oldest = audioCache.keys().next().value
    if (oldest) {
      URL.revokeObjectURL(audioCache.get(oldest)!)
      audioCache.delete(oldest)
    }
  }
  audioCache.set(key, url)
}

export default function NPCDialogue({ npcName, line, ttsText, onTTSEnd }: Props) {
  const [displayed, setDisplayed] = useState('')
  const [done, setDone] = useState(false)
  const [rate, setRate] = useState(1.0)
  const rateRef = useRef(1.0)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [showKorean, setShowKorean] = useState(false)
  const [korean, setKorean] = useState('')
  const [translateState, setTranslateState] = useState<TranslateState>('idle')
  const [ttsLoading, setTtsLoading] = useState(false)

  const nameplateClass = NPC_NAMEPLATE[npcName] ?? 'bg-amber-600'
  const borderClass    = NPC_BORDER[npcName] ?? ''
  const spokenText     = ttsText ?? line

  // Reset translation cache on line change
  useEffect(() => {
    setShowKorean(false)
    setKorean('')
    setTranslateState('idle')
  }, [line])

  async function handleToggleKorean() {
    if (showKorean) { setShowKorean(false); return }
    if (korean)     { setShowKorean(true);  return }
    setTranslateState('loading')
    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: line }),
      })
      const data = await res.json()
      setKorean(data.translation)
      setTranslateState('done')
      setShowKorean(true)
    } catch {
      setTranslateState('error')
    }
  }

  // Typewriter effect
  useEffect(() => {
    setDisplayed('')
    setDone(false)
    // Stop any playing audio when line changes
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
    let i = 0
    const timer = setInterval(() => {
      setDisplayed(line.slice(0, i + 1))
      i++
      if (i >= line.length) { clearInterval(timer); setDone(true) }
    }, 26)
    return () => clearInterval(timer)
  }, [line])

  // ── OpenAI TTS (server) with Web Speech fallback ──────────────────────────
  const speakOpenAI = useCallback(async (speedMult: number) => {
    const key = cacheKey(spokenText, npcName)

    let blobUrl = audioCache.get(key)

    if (!blobUrl) {
      setTtsLoading(true)
      try {
        const res = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: spokenText, npcName }),
        })
        if (!res.ok) throw new Error('TTS API failed')
        const blob = await res.blob()
        blobUrl = URL.createObjectURL(blob)
        setCached(key, blobUrl)
      } catch {
        return false // signal fallback needed
      } finally {
        setTtsLoading(false)
      }
    }

    if (!blobUrl) return false

    if (audioRef.current) {
      audioRef.current.pause()
    }
    const audio = new Audio(blobUrl)
    audio.playbackRate = speedMult
    audio.onended = () => onTTSEnd?.()
    audioRef.current = audio
    await audio.play()
    return true
  }, [spokenText, npcName, onTTSEnd])

  const speakWebSpeech = useCallback((speedMult: number) => {
    if (!('speechSynthesis' in window)) { onTTSEnd?.(); return }
    window.speechSynthesis.cancel()
    const utt = new SpeechSynthesisUtterance(spokenText)
    utt.lang = 'en-US'
    utt.rate = speedMult
    utt.onend = () => onTTSEnd?.()
    window.speechSynthesis.speak(utt)
  }, [spokenText, onTTSEnd])

  const speak = useCallback(async (speedMult?: number) => {
    const mult = speedMult ?? rateRef.current
    const ok = await speakOpenAI(mult)
    if (!ok) speakWebSpeech(mult)
  }, [speakOpenAI, speakWebSpeech])

  // Auto-play when typewriter finishes
  useEffect(() => {
    if (done) speak()
  }, [done]) // eslint-disable-line react-hooks/exhaustive-deps

  function changeSpeed(s: number) {
    setRate(s)
    rateRef.current = s
    // Re-apply speed to currently playing audio
    if (audioRef.current && !audioRef.current.paused) {
      audioRef.current.playbackRate = s
    }
  }

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) audioRef.current.pause()
    }
  }, [])

  return (
    <div className={`dialogue-box ${borderClass} animate-fade-in-up`}>

      {/* 네임플레이트 */}
      <div className={`${nameplateClass} px-4 py-1.5 flex items-center gap-2`}>
        <span className="text-white text-[11px] font-black tracking-[0.18em] uppercase">{npcName}</span>
        {ttsLoading && (
          <span className="ml-auto flex gap-0.5">
            {[0,1,2].map(i => (
              <span key={i} className="w-1 h-1 rounded-full bg-white/40 animate-bounce"
                style={{ animationDelay: `${i * 120}ms` }} />
            ))}
          </span>
        )}
      </div>

      {/* 대사 텍스트 */}
      <div className="px-4 pt-3 pb-1">
        <p className="text-white/92 text-[15px] leading-[1.7] min-h-[2.8rem]">
          {displayed}
          {!done && (
            <span className="animate-cursor inline-block w-[2px] h-4 bg-white/70 ml-0.5 align-middle" />
          )}
        </p>

        {/* 한국어 번역 */}
        {showKorean && korean && (
          <p className="mt-2 text-[13px] text-white/38 leading-relaxed pl-3 border-l border-white/12">
            {korean}
          </p>
        )}
      </div>

      {/* 컨트롤 바 */}
      {done && (
        <div className="px-4 pb-3 pt-1 flex items-center gap-1.5">

          {/* 다시 듣기 */}
          <button
            onClick={() => speak()}
            className="text-white/28 hover:text-white/65 transition-colors text-sm"
            title="다시 듣기"
          >
            🔊
          </button>

          {/* 배속 */}
          <div className="flex gap-0.5">
            {SPEEDS.map(s => (
              <button
                key={s}
                onClick={() => changeSpeed(s)}
                className={`text-[11px] px-2 py-0.5 rounded transition-colors ${
                  rate === s
                    ? 'bg-white/14 text-white/80 font-bold'
                    : 'text-white/22 hover:text-white/55'
                }`}
              >
                {s}×
              </button>
            ))}
          </div>

          <div className="flex-1" />

          {/* 한국어 토글 */}
          <button
            onClick={handleToggleKorean}
            disabled={translateState === 'loading'}
            className={`text-[11px] px-2.5 py-1 rounded-lg border transition-colors disabled:opacity-40 ${
              showKorean
                ? 'bg-white/10 border-white/18 text-white/65'
                : 'border-white/10 text-white/28 hover:text-white/58 hover:border-white/18'
            }`}
          >
            {translateState === 'loading' ? '...' : '한국어'}
          </button>

          {translateState === 'error' && (
            <span className="text-[11px] text-red-400/60">오류</span>
          )}
        </div>
      )}
    </div>
  )
}
