'use client'

import { useState, useRef, useEffect } from 'react'

type Props = {
  hintTemplate: string | null
  onSubmit: (value: string) => void
  loading: boolean
  disabled: boolean
  characterName?: string
  avatarEmoji?: string
}

// Web Speech API 타입 선언
interface ISpeechResult {
  transcript: string
}
interface ISpeechResultList {
  length: number
  [index: number]: { 0: ISpeechResult }
}
interface ISpeechEvent {
  results: ISpeechResultList
}
interface ISpeechRecognition extends EventTarget {
  lang: string
  continuous: boolean
  interimResults: boolean
  start(): void
  stop(): void
  onstart: (() => void) | null
  onend: (() => void) | null
  onerror: (() => void) | null
  onresult: ((e: ISpeechEvent) => void) | null
}
declare global {
  interface Window {
    SpeechRecognition: new () => ISpeechRecognition
    webkitSpeechRecognition: new () => ISpeechRecognition
  }
}

export default function UserInput({ hintTemplate, onSubmit, loading, disabled, characterName, avatarEmoji }: Props) {
  const [value, setValue] = useState('')
  const [showHint, setShowHint] = useState(false)
  const [focused, setFocused] = useState(false)
  const [listening, setListening] = useState(false)
  const [sttSupported, setSttSupported] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const recognitionRef = useRef<ISpeechRecognition | null>(null)

  useEffect(() => {
    setSttSupported(!!(window.SpeechRecognition || window.webkitSpeechRecognition))
  }, [])

  function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault()
    if (!value.trim() || loading || disabled) return
    onSubmit(value.trim())
    setValue('')
    setShowHint(false)
    stopListening()
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  function startListening() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) return

    stopListening()

    const recognition = new SR()
    recognition.lang = 'en-US'
    recognition.continuous = false
    recognition.interimResults = true

    recognition.onstart = () => setListening(true)

    recognition.onresult = (event: ISpeechEvent) => {
      let transcript = ''
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript
      }
      setValue(transcript)
    }

    recognition.onend = () => {
      setListening(false)
      recognitionRef.current = null
      // 텍스트가 있으면 인풋 포커스
      inputRef.current?.focus()
    }

    recognition.onerror = () => {
      setListening(false)
      recognitionRef.current = null
    }

    recognitionRef.current = recognition
    recognition.start()
  }

  function stopListening() {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      recognitionRef.current = null
    }
    setListening(false)
  }

  function toggleMic() {
    if (listening) stopListening()
    else startListening()
  }

  return (
    <div
      className="dialogue-box dialogue-box-player transition-all duration-200"
      style={focused || listening
        ? { borderColor: listening ? 'rgba(239,68,68,0.35)' : 'rgba(251,191,36,0.28)',
            boxShadow: listening ? '0 0 0 1px rgba(239,68,68,0.1), 0 8px 32px rgba(0,0,0,0.4)' : '0 0 0 1px rgba(251,191,36,0.08), 0 8px 32px rgba(0,0,0,0.4)' }
        : undefined}
    >
      {/* 플레이어 네임플레이트 */}
      <div className="px-4 py-1.5 bg-white/5 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {avatarEmoji && <span className="text-sm leading-none">{avatarEmoji}</span>}
          <span className="text-[11px] font-black tracking-[0.18em] uppercase text-white/50">
            {characterName || 'YOU'}
          </span>
        </div>

        {hintTemplate && !showHint && (
          <button
            onClick={() => setShowHint(true)}
            className="flex items-center gap-1 text-[11px] text-amber-400/45 hover:text-amber-400/80 transition-colors"
          >
            <span>💡</span>
            <span>힌트</span>
            <span className="text-white/18 ml-0.5">−5점</span>
          </button>
        )}
      </div>

      {/* 힌트 */}
      {showHint && hintTemplate && (
        <div className="px-4 py-2 bg-amber-950/20 border-b border-amber-800/15">
          <p className="text-amber-300/60 text-[12px] leading-relaxed">💡 {hintTemplate}</p>
        </div>
      )}

      {/* 듣는 중 표시 */}
      {listening && (
        <div className="px-4 py-2 bg-red-950/20 border-b border-red-800/15 flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
          </span>
          <span className="text-red-300/70 text-[12px]">듣는 중... 영어로 말해보세요</span>
        </div>
      )}

      {/* 입력 폼 */}
      <form onSubmit={handleSubmit} className="flex items-center">
        <span className="pl-4 text-white/18 text-sm select-none shrink-0">▶</span>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          disabled={loading || disabled}
          placeholder={listening ? '말하는 중...' : '영어로 답해보세요...'}
          className="game-input flex-1 px-3 py-3.5 disabled:opacity-25"
          autoFocus
        />

        {/* 마이크 버튼 */}
        {sttSupported && (
          <button
            type="button"
            onClick={toggleMic}
            disabled={loading || disabled}
            title={listening ? '녹음 중지' : '음성으로 말하기'}
            className={`shrink-0 m-1.5 w-9 h-9 rounded-xl flex items-center justify-center transition-all
              disabled:opacity-20 disabled:cursor-not-allowed
              ${listening
                ? 'bg-red-500 hover:bg-red-400 text-white animate-pulse'
                : 'bg-white/8 hover:bg-white/15 text-white/45 hover:text-white/80'
              }`}
          >
            {listening ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="6" width="12" height="12" rx="2"/>
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2H3v2a9 9 0 0 0 8 8.94V23h2v-2.06A9 9 0 0 0 21 12v-2h-2z"/>
              </svg>
            )}
          </button>
        )}

        {/* 전송 버튼 */}
        <button
          type="submit"
          disabled={!value.trim() || loading || disabled}
          className="shrink-0 m-2 px-4 py-2.5 rounded-xl text-[11px] font-black tracking-widest uppercase transition-all
            bg-amber-500 hover:bg-amber-400 text-black
            disabled:bg-white/8 disabled:text-white/20 disabled:cursor-not-allowed
            hover:scale-[1.04] active:scale-[0.96]"
        >
          {loading ? (
            <span className="inline-flex gap-0.5">
              <span className="animate-bounce" style={{ animationDelay: '0ms' }}>·</span>
              <span className="animate-bounce" style={{ animationDelay: '150ms' }}>·</span>
              <span className="animate-bounce" style={{ animationDelay: '300ms' }}>·</span>
            </span>
          ) : 'SEND'}
        </button>
      </form>
    </div>
  )
}
