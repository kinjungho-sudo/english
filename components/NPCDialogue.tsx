'use client'

import { useEffect, useState, useRef } from 'react'

type Props = {
  npcName: string
  line: string
  ttsText: string | null
  onTTSEnd?: () => void
}

export default function NPCDialogue({ npcName, line, ttsText, onTTSEnd }: Props) {
  const [displayed, setDisplayed] = useState('')
  const [done, setDone] = useState(false)
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)

  // Typing effect
  useEffect(() => {
    setDisplayed('')
    setDone(false)
    let i = 0
    const timer = setInterval(() => {
      setDisplayed(line.slice(0, i + 1))
      i++
      if (i >= line.length) {
        clearInterval(timer)
        setDone(true)
      }
    }, 28)
    return () => clearInterval(timer)
  }, [line])

  function speak() {
    if (!('speechSynthesis' in window)) return
    window.speechSynthesis.cancel()
    const utt = new SpeechSynthesisUtterance(ttsText ?? line)
    utt.lang = 'en-US'
    utt.rate = 0.9
    utt.onend = () => onTTSEnd?.()
    utteranceRef.current = utt
    window.speechSynthesis.speak(utt)
  }

  return (
    <div className="bg-gray-900/95 border border-gray-700/50 rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">{npcName}</span>
        <span className="text-gray-700">·</span>
        <span className="text-xs text-gray-600">NPC</span>
      </div>
      <p className="text-white text-base leading-relaxed min-h-[3rem]">
        {displayed}
        {!done && <span className="animate-pulse text-amber-400">▋</span>}
      </p>
      {done && (
        <button
          onClick={speak}
          className="mt-3 flex items-center gap-1.5 text-xs text-gray-500 hover:text-amber-400 transition-colors"
        >
          <span>🔊</span>
          <span>Listen</span>
        </button>
      )}
    </div>
  )
}
