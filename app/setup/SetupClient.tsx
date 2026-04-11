'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const AVATARS = ['🧑‍💼', '👩‍✈️', '🧑‍🍳', '🧝', '🦸', '🧙', '👨‍🎓', '🧑‍🚀']

export default function SetupClient({ userId }: { userId: string }) {
  const router = useRouter()
  const supabase = createClient()

  const [name, setName] = useState('')
  const [avatar, setAvatar] = useState('🧑‍💼')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    if (trimmed.length < 2) { setError('2자 이상 입력해주세요'); return }
    if (trimmed.length > 16) { setError('16자 이하로 입력해주세요'); return }

    setLoading(true)
    setError('')

    const { error: err } = await supabase
      .from('profiles')
      .upsert({ id: userId, character_name: trimmed, avatar_emoji: avatar })

    if (err) {
      setError('저장에 실패했습니다: ' + err.message)
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="game-wrap" style={{ background: '#050508' }}>
      <div
        className="game-card flex flex-col items-center justify-center px-6"
        style={{ background: 'radial-gradient(ellipse at 50% 30%, #0a001a 0%, #0a0a0f 60%, #000 100%)' }}
      >
        {/* 배경 글로우 */}
        <div
          className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(168,85,247,0.07) 0%, transparent 70%)' }}
        />

        <div className="relative z-10 w-full max-w-xs">

          {/* 타이틀 */}
          <div className="text-center mb-10">
            <p className="text-[11px] tracking-[0.35em] uppercase text-purple-500/50 font-bold mb-3">
              TRAVELER REGISTRATION
            </p>
            <h1
              className="text-3xl font-black tracking-tight mb-2"
              style={{
                color: '#fff',
                textShadow: '0 0 30px rgba(168,85,247,0.4)',
              }}
            >
              나만의 여행자를
              <br />만들어보세요
            </h1>
            <p className="text-white/30 text-sm mt-3">
              게임에서 사용할 이름을 설정합니다
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* 아바타 선택 */}
            <div>
              <p className="text-[11px] tracking-[0.2em] uppercase text-white/30 font-bold mb-3 text-center">
                아바타 선택
              </p>
              <div className="grid grid-cols-4 gap-2">
                {AVATARS.map(emoji => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setAvatar(emoji)}
                    className={`aspect-square rounded-2xl text-3xl flex items-center justify-center transition-all ${
                      avatar === emoji
                        ? 'bg-purple-600/30 border-2 border-purple-500/60 scale-110'
                        : 'bg-white/5 border border-white/8 hover:bg-white/10 hover:scale-105'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* 선택된 아바타 미리보기 */}
            <div className="flex justify-center">
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center text-5xl"
                style={{
                  background: 'radial-gradient(circle, rgba(168,85,247,0.15), rgba(0,0,0,0.5))',
                  border: '2px solid rgba(168,85,247,0.25)',
                  boxShadow: '0 0 30px rgba(168,85,247,0.15)',
                }}
              >
                {avatar}
              </div>
            </div>

            {/* 이름 입력 */}
            <div>
              <p className="text-[11px] tracking-[0.2em] uppercase text-white/30 font-bold mb-2 text-center">
                캐릭터 이름
              </p>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                maxLength={16}
                autoFocus
                placeholder="여행자 이름 입력..."
                className="w-full rounded-xl px-4 py-3.5 text-white text-base text-center font-bold placeholder-white/20 focus:outline-none transition-all"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: name.trim() ? '1px solid rgba(168,85,247,0.4)' : '1px solid rgba(255,255,255,0.08)',
                  boxShadow: name.trim() ? '0 0 20px rgba(168,85,247,0.1)' : 'none',
                }}
              />
              <div className="flex justify-between mt-1.5 px-1">
                {error ? (
                  <p className="text-red-400/70 text-xs">{error}</p>
                ) : (
                  <span />
                )}
                <p className="text-white/20 text-xs ml-auto">{name.length}/16</p>
              </div>
            </div>

            {/* 시작 버튼 */}
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="w-full rounded-xl py-4 font-black text-sm tracking-widest uppercase transition-all disabled:opacity-30 hover:scale-[1.02] active:scale-[0.98]"
              style={{
                background: loading || !name.trim()
                  ? 'rgba(168,85,247,0.15)'
                  : 'linear-gradient(135deg, #a855f7, #7c3aed)',
                color: loading || !name.trim() ? 'rgba(255,255,255,0.3)' : '#fff',
                boxShadow: !loading && name.trim() ? '0 0 30px rgba(168,85,247,0.3)' : 'none',
              }}
            >
              {loading ? 'SAVING...' : '▶  ADVENTURE START'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
