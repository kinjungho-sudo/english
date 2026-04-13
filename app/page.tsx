'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

function derivePassword(email: string): string {
  return btoa(`ts_${email}_travelspeak2026`).slice(0, 72)
}

export default function GameLoginPage() {
  const router = useRouter()
  const supabase = createClient()

  const [tab, setTab] = useState<'email' | 'signup'>('email')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState('')
  const [stars, setStars] = useState<{ x: number; y: number; size: number; delay: number }[]>([])

  useEffect(() => {
    // Math.random()은 클라이언트에서만 실행해야 hydration mismatch를 방지할 수 있어서
    // useEffect 유지 (set-state-in-effect 예외 케이스)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStars(
      Array.from({ length: 60 }, () => ({
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 2 + 1,
        delay: Math.random() * 4,
      }))
    )
  }, [])

  async function handleGoogleLogin() {
    setGoogleLoading(true)
    setError('')
    const origin = window.location.origin
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${origin}/api/auth/callback` },
    })
    if (err) {
      setError('Google 로그인에 실패했습니다: ' + err.message)
      setGoogleLoading(false)
    }
  }

  async function handleEnter(e: { preventDefault(): void }) {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    setError('')

    const password = derivePassword(email.trim())

    const { error: loginErr } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    if (!loginErr) { router.push('/dashboard'); router.refresh(); return }

    const { data: signupData, error: signupErr } = await supabase.auth.signUp({ email: email.trim(), password })

    if (signupErr) {
      if (signupErr.message?.toLowerCase().includes('already registered')) {
        const res = await fetch('/api/auth/sync-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.trim(), password }),
        })
        const { ok, reason } = await res.json()
        if (!ok) { setError(`계정 복구 실패 (${reason ?? 'unknown'})`); setLoading(false); return }
        const { error: retryErr } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
        if (!retryErr) { router.push('/dashboard'); router.refresh(); return }
        setError(`로그인 실패: ${retryErr.message}`)
        setLoading(false)
        return
      }
      setError('오류: ' + signupErr.message)
      setLoading(false)
      return
    }

    if (signupData.session) { router.push('/dashboard'); router.refresh(); return }

    const { error: retryErr } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    if (!retryErr) {
      router.push('/dashboard')
      router.refresh()
    } else {
      setError('Supabase → Authentication → Email → Confirm email 을 OFF 해주세요.')
      setLoading(false)
    }
  }

  return (
    <div className="game-wrap" style={{ background: '#050508' }}>
      <div
        className="game-card flex flex-col items-center justify-center px-6"
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
          <div className="text-center mb-10">
            <div className="text-5xl mb-4">✈️</div>
            <h1
              className="text-4xl font-black tracking-widest uppercase mb-2"
              style={{
                color: '#f59e0b',
                textShadow: '0 0 20px rgba(245,158,11,0.5), 0 0 60px rgba(245,158,11,0.15)',
                letterSpacing: '0.15em',
              }}
            >
              Scene Quest
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

          {/* Google 로그인 */}
          <button
            onClick={handleGoogleLogin}
            disabled={googleLoading || loading}
            className="w-full flex items-center justify-center gap-3 rounded-xl py-3.5 mb-4 font-bold text-sm transition-all disabled:opacity-40 hover:scale-[1.02] active:scale-[0.98]"
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.12)',
              color: 'rgba(255,255,255,0.85)',
            }}
          >
            {googleLoading ? (
              <span className="text-white/50 text-xs tracking-widest">CONNECTING...</span>
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span>Google로 계속하기</span>
              </>
            )}
          </button>

          {/* 구분선 */}
          <div className="w-full flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-white/8" />
            <span className="text-white/20 text-xs tracking-widest">OR</span>
            <div className="flex-1 h-px bg-white/8" />
          </div>

          {/* 탭: 로그인 / 회원가입 */}
          <div className="w-full flex mb-4 bg-white/5 rounded-xl p-1">
            {(['email', 'signup'] as const).map(t => (
              <button
                key={t}
                onClick={() => { setTab(t); setError('') }}
                className={`flex-1 py-2 rounded-lg text-xs font-bold tracking-wider uppercase transition-all ${
                  tab === t
                    ? 'bg-amber-500 text-black'
                    : 'text-white/35 hover:text-white/60'
                }`}
              >
                {t === 'email' ? '로그인' : '회원가입'}
              </button>
            ))}
          </div>

          {/* 이메일 폼 */}
          <form onSubmit={handleEnter} className="w-full space-y-3">
            {error && (
              <div className="bg-red-950/50 border border-red-800/50 rounded-xl p-3 text-red-400 text-xs leading-relaxed text-center">
                {error}
              </div>
            )}
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoFocus
              className="w-full rounded-xl px-4 py-3.5 text-white text-sm text-center placeholder-gray-700 focus:outline-none transition-all"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(245,158,11,0.15)',
              }}
              placeholder="your@email.com"
            />
            <button
              type="submit"
              disabled={loading || googleLoading || !email.trim()}
              className="w-full rounded-xl py-3.5 font-black text-sm tracking-widest uppercase transition-all disabled:opacity-30 hover:scale-[1.02] active:scale-[0.98]"
              style={{
                background: loading ? 'rgba(245,158,11,0.2)' : 'linear-gradient(135deg, #f59e0b, #d97706)',
                color: '#000',
                boxShadow: loading ? 'none' : '0 0 24px rgba(245,158,11,0.25)',
              }}
            >
              {loading ? 'LOADING...' : tab === 'email' ? '▶  LOGIN' : '▶  CREATE ACCOUNT'}
            </button>
          </form>

          <p className="mt-8 text-xs text-gray-800 tracking-widest text-center uppercase">
            Restaurant · Airport · Hotel
          </p>
        </div>
      </div>
    </div>
  )
}
