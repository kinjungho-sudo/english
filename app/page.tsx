'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

// 이메일로 결정론적 패스워드 생성 (게임용, 비밀번호 없는 로그인 구현)
function derivePassword(email: string): string {
  return btoa(`ts_${email}_travelspeak2026`).slice(0, 72)
}

export default function GameLoginPage() {
  const router = useRouter()
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [stars, setStars] = useState<{ x: number; y: number; size: number; delay: number }[]>([])

  useEffect(() => {
    setStars(
      Array.from({ length: 60 }, () => ({
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 2 + 1,
        delay: Math.random() * 4,
      }))
    )
  }, [])

  async function handleEnter(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    setError('')

    const password = derivePassword(email.trim())

    // 1. 로그인 시도
    const { error: loginErr } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

    if (!loginErr) {
      router.push('/dashboard')
      router.refresh()
      return
    }

    // 2. 로그인 실패 → 신규 가입 후 재로그인
    const { data: signupData, error: signupErr } = await supabase.auth.signUp({
      email: email.trim(),
      password,
    })

    if (signupErr) {
      setError('오류가 발생했습니다: ' + signupErr.message)
      setLoading(false)
      return
    }

    // 이메일 확인 비활성화된 경우 — 세션 즉시 반환
    if (signupData.session) {
      router.push('/dashboard')
      router.refresh()
      return
    }

    // 이메일 확인이 아직 활성화된 경우 — 재로그인 시도
    const { error: retryErr } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

    if (!retryErr) {
      router.push('/dashboard')
      router.refresh()
    } else {
      setError('Supabase Dashboard → Authentication → Email → Confirm email 을 OFF 해주세요.')
      setLoading(false)
    }
  }

  return (
    <div
      className="relative min-h-screen overflow-hidden flex flex-col items-center justify-center px-6"
      style={{ background: 'radial-gradient(ellipse at 50% 0%, #1a0a00 0%, #0a0a0f 60%, #000 100%)' }}
    >
      {/* Stars */}
      <div className="absolute inset-0 pointer-events-none">
        {stars.map((s, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              left: `${s.x}%`, top: `${s.y}%`,
              width: `${s.size}px`, height: `${s.size}px`,
              opacity: 0.35,
              animation: `pulse ${2 + s.delay}s ease-in-out infinite`,
              animationDelay: `${s.delay}s`,
            }}
          />
        ))}
      </div>

      {/* Glow */}
      <div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(251,146,60,0.07) 0%, transparent 70%)' }}
      />

      <div className="relative z-10 w-full max-w-xs flex flex-col items-center">

        {/* Logo */}
        <div className="text-center mb-12">
          <div className="text-5xl mb-4">✈️</div>
          <h1
            className="text-4xl font-black tracking-widest uppercase mb-2"
            style={{
              color: '#f59e0b',
              textShadow: '0 0 20px rgba(245,158,11,0.5), 0 0 60px rgba(245,158,11,0.15)',
              letterSpacing: '0.15em',
            }}
          >
            TravelSpeak
          </h1>
          <p className="text-xs tracking-[0.3em] uppercase text-amber-700/50 font-medium">
            AI English Adventure
          </p>
          <div className="mt-4 flex items-center justify-center gap-2">
            <div className="h-px w-16 bg-gradient-to-r from-transparent to-amber-800/40" />
            <div className="w-1 h-1 rounded-full bg-amber-700/40" />
            <div className="h-px w-16 bg-gradient-to-l from-transparent to-amber-800/40" />
          </div>
        </div>

        {/* Email Form */}
        <form onSubmit={handleEnter} className="w-full space-y-4">
          {error && (
            <div className="bg-red-950/50 border border-red-800/50 rounded-xl p-3 text-red-400 text-xs leading-relaxed text-center">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs text-gray-600 mb-2 tracking-[0.2em] uppercase text-center">
              이메일 주소를 입력하세요
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoFocus
              className="w-full rounded-xl px-4 py-4 text-white text-sm text-center placeholder-gray-700 focus:outline-none transition-all"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(245,158,11,0.15)',
              }}
              placeholder="your@email.com"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !email.trim()}
            className="w-full rounded-xl py-4 font-black text-sm tracking-widest uppercase transition-all disabled:opacity-30"
            style={{
              background: loading
                ? 'rgba(245,158,11,0.2)'
                : 'linear-gradient(135deg, #f59e0b, #d97706)',
              color: '#000',
              boxShadow: loading ? 'none' : '0 0 24px rgba(245,158,11,0.25)',
            }}
          >
            {loading ? 'LOADING...' : '▶  ENTER GAME'}
          </button>
        </form>

        <p className="mt-8 text-xs text-gray-800 tracking-widest text-center uppercase">
          Restaurant · Airport · Hotel
        </p>
      </div>
    </div>
  )
}
