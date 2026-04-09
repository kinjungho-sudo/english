'use client'

import { useState, useRef } from 'react'

type Props = {
  hintTemplate: string | null
  onSubmit: (value: string) => void
  loading: boolean
  disabled: boolean
}

export default function UserInput({ hintTemplate, onSubmit, loading, disabled }: Props) {
  const [value, setValue] = useState('')
  const [showHint, setShowHint] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!value.trim() || loading || disabled) return
    onSubmit(value.trim())
    setValue('')
    setShowHint(false)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e as unknown as React.FormEvent)
    }
  }

  return (
    <div className="bg-gray-900/95 border border-gray-700/50 rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">YOUR ANSWER</span>
      </div>

      {hintTemplate && (
        <div className="mb-3">
          {showHint ? (
            <div className="bg-amber-900/20 border border-amber-800/40 rounded-xl px-4 py-2.5 text-amber-300/80 text-sm">
              💡 {hintTemplate}
            </div>
          ) : (
            <button
              onClick={() => setShowHint(true)}
              className="text-xs text-gray-600 hover:text-amber-400 transition-colors border border-gray-800 hover:border-amber-800 px-3 py-1.5 rounded-lg"
            >
              💡 Show hint (-5 pts)
            </button>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex gap-3">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading || disabled}
          placeholder="Type your response in English..."
          className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-amber-500 transition-colors disabled:opacity-40"
          autoFocus
        />
        <button
          type="submit"
          disabled={!value.trim() || loading || disabled}
          className="bg-amber-500 hover:bg-amber-400 disabled:opacity-30 text-gray-950 font-bold px-5 py-3 rounded-xl transition-colors whitespace-nowrap"
        >
          {loading ? '...' : 'Send →'}
        </button>
      </form>
    </div>
  )
}
