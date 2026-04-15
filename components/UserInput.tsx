'use client'

import { useState, useRef, useEffect } from 'react'

type Props = {
  hintTemplate: string | null
  onSubmit: (value: string) => void
  loading: boolean
  disabled: boolean
  characterName?: string
  avatarEmoji?: string
  easyKeywords?: string[]
  difficulty?: string
}

// Web Speech API 타입 선언
interface ISpeechResult {
  transcript: string
  isFinal: boolean
}
interface ISpeechResultList {
  length: number
  [index: number]: { 0: ISpeechResult; isFinal: boolean }
}
interface ISpeechErrorEvent {
  error: string
}
interface ISpeechEvent {
  results: ISpeechResultList
  resultIndex: number
}
interface ISpeechRecognition extends EventTarget {
  lang: string
  continuous: boolean
  interimResults: boolean
  start(): void
  stop(): void
  abort(): void
  onstart: (() => void) | null
  onend: (() => void) | null
  onerror: ((e: ISpeechErrorEvent) => void) | null
  onresult: ((e: ISpeechEvent) => void) | null
}
declare global {
  interface Window {
    SpeechRecognition: new () => ISpeechRecognition
    webkitSpeechRecognition: new () => ISpeechRecognition
  }
}

type SttStatus = 'idle' | 'listening' | 'error-permission' | 'unsupported'

const IS_MOBILE = typeof navigator !== 'undefined' && /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)

// 60초 무음 자동 종료
const SILENCE_TIMEOUT_MS = 60_000

export default function UserInput({ hintTemplate, onSubmit, loading, disabled, characterName, avatarEmoji, easyKeywords, difficulty }: Props) {
  const [value, setValue] = useState('')
  const [showHint, setShowHint] = useState(false)
  const [focused, setFocused] = useState(false)
  const [sttStatus, setSttStatus] = useState<SttStatus>(() => {
    if (typeof window === 'undefined') return 'idle'
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition) ? 'idle' : 'unsupported'
  })
  // 남은 무음 시간 (초)
  const [silenceLeft, setSilenceLeft] = useState(0)

  const inputRef = useRef<HTMLInputElement>(null)
  const recognitionRef = useRef<ISpeechRecognition | null>(null)
  // interim 텍스트 별도 관리 (확정 텍스트와 분리)
  const confirmedRef = useRef('')
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const silenceTickRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const listening = sttStatus === 'listening'

  // 언마운트 시 정리
  useEffect(() => {
    return () => {
      clearSilenceTimers()
      if (recognitionRef.current) {
        try { recognitionRef.current.abort() } catch { /* ignore */ }
      }
    }
  }, [])

  function clearSilenceTimers() {
    if (silenceTimerRef.current) { clearTimeout(silenceTimerRef.current); silenceTimerRef.current = null }
    if (silenceTickRef.current) { clearInterval(silenceTickRef.current); silenceTickRef.current = null }
    setSilenceLeft(0)
  }

  function resetSilenceTimer() {
    clearSilenceTimers()
    setSilenceLeft(Math.floor(SILENCE_TIMEOUT_MS / 1000))
    // 1초마다 카운트다운
    silenceTickRef.current = setInterval(() => {
      setSilenceLeft(prev => Math.max(0, prev - 1))
    }, 1000)
    // 60초 후 자동 종료
    silenceTimerRef.current = setTimeout(() => {
      stopListening()
    }, SILENCE_TIMEOUT_MS)
  }

  function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault()
    if (!value.trim() || loading || disabled) return
    onSubmit(value.trim())
    setValue('')
    confirmedRef.current = ''
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
    if (!SR) { setSttStatus('unsupported'); return }

    // 이미 실행 중이면 재시작
    if (recognitionRef.current) {
      try { recognitionRef.current.abort() } catch { /* ignore */ }
      recognitionRef.current = null
    }

    const recognition = new SR()
    recognition.lang = 'en-US'
    // continuous: true — 수동으로 멈출 때까지 계속 인식
    recognition.continuous = true
    recognition.interimResults = true

    recognition.onstart = () => {
      setSttStatus('listening')
      confirmedRef.current = value  // 기존 입력 보존
      resetSilenceTimer()
    }

    recognition.onresult = (event: ISpeechEvent) => {
      // 결과가 들어오면 무음 타이머 리셋
      resetSilenceTimer()

      let interimText = ''
      let newConfirmed = confirmedRef.current

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          newConfirmed += (newConfirmed && !newConfirmed.endsWith(' ') ? ' ' : '') + t.trim()
        } else {
          interimText += t
        }
      }

      confirmedRef.current = newConfirmed

      // 화면 표시: 확정 텍스트 + interim 미리보기
      if (interimText) {
        setValue(newConfirmed + (newConfirmed ? ' ' : '') + interimText)
      } else {
        setValue(newConfirmed)
      }
    }

    recognition.onend = () => {
      // continuous 모드에서 예기치 않게 끊기면 자동 재시작 (사용자가 직접 종료한 게 아닐 때)
      if (recognitionRef.current && sttStatus === 'listening') {
        // interim 정리 후 재시작
        setValue(confirmedRef.current)
        try {
          recognitionRef.current.start()
        } catch {
          setSttStatus('idle')
          recognitionRef.current = null
          clearSilenceTimers()
          inputRef.current?.focus()
        }
        return
      }
      // 정상 종료
      setValue(confirmedRef.current)
      setSttStatus('idle')
      recognitionRef.current = null
      clearSilenceTimers()
      inputRef.current?.focus()
    }

    recognition.onerror = (e: ISpeechErrorEvent) => {
      if (e.error === 'not-allowed' || e.error === 'permission-denied') {
        recognitionRef.current = null
        setSttStatus('error-permission')
        clearSilenceTimers()
      } else if (e.error === 'no-speech') {
        // no-speech는 무시 — 타이머가 처리
      } else {
        recognitionRef.current = null
        setSttStatus('idle')
        clearSilenceTimers()
      }
    }

    recognitionRef.current = recognition
    try {
      recognition.start()
    } catch {
      setSttStatus('idle')
    }
  }

  function stopListening() {
    clearSilenceTimers()
    if (recognitionRef.current) {
      const r = recognitionRef.current
      recognitionRef.current = null  // onend에서 재시작 방지
      try { r.stop() } catch { /* ignore */ }
    }
    setValue(confirmedRef.current)
    setSttStatus(prev => prev === 'listening' ? 'idle' : prev)
    inputRef.current?.focus()
  }

  function toggleMic() {
    if (sttStatus === 'error-permission') { setSttStatus('idle'); return }
    if (listening) stopListening()
    else startListening()
  }

  // 무음 타이머 경고색 (10초 이하)
  const silenceWarning = listening && silenceLeft <= 10 && silenceLeft > 0

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

        {hintTemplate && !showHint && difficulty !== 'hard' && (
          <button
            onClick={() => setShowHint(true)}
            className="flex items-center gap-1 text-[11px] text-amber-400/45 hover:text-amber-400/80 transition-colors"
          >
            <span>💡</span>
            <span>힌트</span>
            {difficulty !== 'easy' && <span className="text-white/18 ml-0.5">−5점</span>}
          </button>
        )}
      </div>

      {/* 힌트 */}
      {showHint && hintTemplate && (
        <div className="px-4 py-2 bg-amber-950/20 border-b border-amber-800/15">
          <p className="text-amber-300/60 text-[12px] leading-relaxed">💡 {hintTemplate}</p>
        </div>
      )}

      {/* 듣는 중 — 타이머 포함 */}
      {listening && (
        <div className={`px-4 py-2 border-b flex items-center justify-between gap-2 transition-colors ${
          silenceWarning ? 'bg-orange-950/25 border-orange-800/20' : 'bg-red-950/20 border-red-800/15'
        }`}>
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${silenceWarning ? 'bg-orange-400' : 'bg-red-400'}`} />
              <span className={`relative inline-flex rounded-full h-2 w-2 ${silenceWarning ? 'bg-orange-500' : 'bg-red-500'}`} />
            </span>
            <span className={`text-[12px] ${silenceWarning ? 'text-orange-300/80' : 'text-red-300/70'}`}>
              마이크 켜짐 — 버튼을 다시 눌러 종료
            </span>
          </div>
          {/* 무음 카운트다운 */}
          {silenceLeft > 0 && (
            <span className={`text-[11px] font-mono tabular-nums shrink-0 ${silenceWarning ? 'text-orange-400/90 font-bold' : 'text-white/25'}`}>
              {silenceLeft}s
            </span>
          )}
        </div>
      )}

      {/* 마이크 권한 거부 안내 */}
      {sttStatus === 'error-permission' && (
        <div className="px-4 py-2 bg-orange-950/20 border-b border-orange-800/15 flex items-center gap-2">
          <span className="text-orange-400/70 text-[12px]">🎤 마이크 권한이 필요해요. 브라우저 설정에서 허용해 주세요.</span>
        </div>
      )}

      {/* STT 미지원 안내 */}
      {sttStatus === 'unsupported' && (
        <div className="px-4 py-2 bg-white/4 border-b border-white/8 flex items-center gap-2">
          <span className="text-white/35 text-[11px]">🎤 이 환경에서는 음성 입력이 지원되지 않아요</span>
        </div>
      )}

      {/* 입력 폼 */}
      <form onSubmit={handleSubmit} className="flex items-center">
        <span className="pl-4 text-white/18 text-sm select-none shrink-0">▶</span>
        <div className="relative flex-1">
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={e => {
              setValue(e.target.value)
              confirmedRef.current = e.target.value
            }}
            onKeyDown={handleKeyDown}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            disabled={loading || disabled}
            placeholder={listening ? '말하는 중... (버튼으로 종료)' : '영어로 답해보세요...'}
            className="game-input w-full px-3 py-3.5 disabled:opacity-25 bg-transparent"
            autoFocus={!IS_MOBILE}
          />
          {/* 초급 정답 힌트 — 입력 없을 때만 표시 */}
          {easyKeywords && easyKeywords.length > 0 && !value && !listening && (
            <span
              className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-[13px] font-mono select-none"
              style={{ color: 'rgba(251,191,36,0.22)' }}
            >
              {easyKeywords.join(' ')}
            </span>
          )}
        </div>

        {/* 마이크 버튼 */}
        <button
          type="button"
          onClick={sttStatus !== 'unsupported' ? toggleMic : undefined}
          disabled={(loading || disabled) && sttStatus !== 'unsupported'}
          title={
            sttStatus === 'unsupported'      ? '음성 입력 미지원' :
            sttStatus === 'error-permission' ? '마이크 권한 필요' :
            listening                        ? '마이크 끄기' : '음성으로 말하기'
          }
          className={`shrink-0 m-1.5 w-9 h-9 rounded-xl flex items-center justify-center transition-all
            ${sttStatus === 'unsupported'
              ? 'bg-white/4 text-white/15 cursor-default'
              : sttStatus === 'error-permission'
                ? 'bg-orange-900/30 text-orange-400/60 hover:bg-orange-900/50'
                : listening
                  ? `text-white animate-pulse ${silenceWarning ? 'bg-orange-500 hover:bg-orange-400' : 'bg-red-500 hover:bg-red-400'}`
                  : 'bg-white/8 hover:bg-white/15 text-white/45 hover:text-white/80 disabled:opacity-20 disabled:cursor-not-allowed'
            }`}
        >
          {listening ? (
            // 중지 아이콘
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="6" width="12" height="12" rx="2"/>
            </svg>
          ) : sttStatus === 'unsupported' ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" opacity="0.3"/>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2H3v2a9 9 0 0 0 8 8.94V23h2v-2.06A9 9 0 0 0 21 12v-2h-2z" opacity="0.3"/>
              <line x1="4" y1="4" x2="20" y2="20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2H3v2a9 9 0 0 0 8 8.94V23h2v-2.06A9 9 0 0 0 21 12v-2h-2z"/>
            </svg>
          )}
        </button>

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
