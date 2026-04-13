'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

function derivePassword(email: string): string {
  return btoa(`ts_${email}_travelspeak2026`).slice(0, 72)
}

function CitySilhouette() {
  return (
    <div className="absolute bottom-0 left-0 right-0 pointer-events-none select-none" style={{ opacity: 0.14 }}>
      <svg viewBox="0 0 420 88" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMax meet" style={{ display: 'block', width: '100%' }}>
        <path
          fill="rgba(245,158,11,0.75)"
          d="M0,88 L0,62 L12,62 L12,48 L16,48 L16,42 L22,42 L22,48 L26,48 L26,36 L30,36 L30,30 L34,30 L34,36 L38,36 L38,55 L44,55 L44,38 L48,38 L48,32 L53,32 L53,26 L57,26 L57,20 L61,20 L61,26 L65,26 L65,32 L69,32 L69,44 L76,44 L76,36 L81,36 L81,55 L89,55 L89,38 L93,38 L93,28 L97,28 L97,22 L101,22 L101,17 L105,17 L105,12 L109,12 L109,17 L113,17 L113,22 L117,22 L117,34 L124,34 L124,50 L132,50 L132,40 L137,40 L137,35 L142,35 L142,40 L147,40 L147,33 L152,33 L152,28 L156,28 L156,22 L160,22 L160,28 L164,28 L164,36 L170,36 L170,50 L178,50 L178,40 L183,40 L183,32 L188,32 L188,26 L192,26 L192,19 L196,19 L196,13 L200,13 L200,8 L204,8 L204,13 L208,13 L208,19 L212,19 L212,28 L217,28 L217,40 L224,40 L224,50 L232,50 L232,36 L237,36 L237,30 L242,30 L242,36 L247,36 L247,44 L254,44 L254,55 L262,55 L262,38 L267,38 L267,28 L272,28 L272,22 L276,22 L276,28 L280,28 L280,38 L286,38 L286,55 L294,55 L294,43 L299,43 L299,36 L304,36 L304,43 L309,43 L309,36 L314,36 L314,28 L318,28 L318,22 L322,22 L322,28 L327,28 L327,40 L334,40 L334,54 L342,54 L342,40 L347,40 L347,46 L352,46 L352,54 L360,54 L360,38 L365,38 L365,30 L370,30 L370,38 L375,38 L375,47 L382,47 L382,56 L392,56 L392,66 L402,66 L402,73 L420,73 L420,88 Z"
        />
      </svg>
    </div>
  )
}

export default function GameLoginPage() {
  const router = useRouter()
  const supabase = createClient()

  type SplashState = 'idle' | 'out' | 'done'
  const [splashState, setSplashState] = useState<SplashState>('idle')
  const tapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [tab, setTab] = useState<'email' | 'signup'>('email')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState('')
  const [stars, setStars] = useState<{ x: number; y: number; size: number; delay: number; drift: boolean; dx: number }[]>([])

  useEffect(() => {
    // Math.random()은 클라이언트에서만 실행해야 hydration mismatch를 방지
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStars(
      Array.from({ length: 70 }, (_, i) => ({
        x: Math.random() * 100,
        y: i < 14 ? 70 + Math.random() * 28 : Math.random() * 85,
        size: Math.random() * 2 + 0.5,
        delay: Math.random() * 5,
        drift: i < 14,
        dx: i < 14 ? (Math.random() - 0.5) * 50 : 0,
      }))
    )
    return () => { if (tapTimerRef.current) clearTimeout(tapTimerRef.current) }
  }, [])

  function handleTap() {
    setSplashState('out')
    tapTimerRef.current = setTimeout(() => setSplashState('done'), 280)
  }

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
        className="game-card flex flex-col items-center justify-center"
        style={{ background: 'radial-gradient(ellipse at 50% 0%, #1a0a00 0%, #0a0a0f 60%, #000 100%)' }}
      >
        {/* Stars + Drifting particles */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {stars.map((s, i) =>
            s.drift ? (
              <div
                key={i}
                className="absolute rounded-full animate-particle-drift"
                style={{
                  left: `${s.x}%`,
                  bottom: `${s.y - 70}%`,
                  width: `${s.size + 1.5}px`,
                  height: `${s.size + 1.5}px`,
                  background: 'radial-gradient(circle, rgba(245,158,11,0.9), rgba(245,158,11,0.15) 60%, transparent)',
                  '--dur': `${4 + s.delay * 0.7}s`,
                  '--delay': `${s.delay}s`,
                  '--dx': `${s.dx}px`,
                } as React.CSSProperties}
              />
            ) : (
              <div
                key={i}
                className="absolute rounded-full bg-white"
                style={{
                  left: `${s.x}%`, top: `${s.y}%`,
                  width: `${s.size}px`, height: `${s.size}px`,
                  opacity: 0.28,
                  animation: `pulse ${2 + s.delay}s ease-in-out infinite`,
                  animationDelay: `${s.delay}s`,
                }}
              />
            )
          )}
        </div>

        {/* Glow orb */}
        <div
          className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(251,146,60,0.07) 0%, transparent 70%)' }}
        />

        {/* City silhouette */}
        <CitySilhouette />

        {/* TAP TO BEGIN splash */}
        {splashState !== 'done' && (
          <div
            className={`absolute inset-0 z-20 flex flex-col items-center justify-center cursor-pointer px-6 ${splashState === 'out' ? 'animate-splash-out pointer-events-none' : ''}`}
            onClick={handleTap}
          >
            {/* Logo emblem */}
            <div className="relative text-center mb-10">
              <div className="relative inline-flex items-center justify-center mb-5">
                {/* Concentric rings */}
                <div
                  className="absolute rounded-full pointer-events-none"
                  style={{ width: '118px', height: '118px', border: '1px solid rgba(245,158,11,0.1)' }}
                />
                <div
                  className="absolute rounded-full pointer-events-none"
                  style={{ width: '94px', height: '94px', border: '1px solid rgba(245,158,11,0.18)' }}
                />
                {/* Core badge */}
                <div
                  style={{
                    width: '72px', height: '72px',
                    borderRadius: '50%',
                    background: 'radial-gradient(circle at 40% 35%, rgba(245,158,11,0.18), rgba(245,158,11,0.03) 70%)',
                    border: '1.5px solid rgba(245,158,11,0.35)',
                    boxShadow: '0 0 30px rgba(245,158,11,0.12), inset 0 1px 0 rgba(245,158,11,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <span style={{ fontSize: '30px' }}>✈️</span>
                </div>
              </div>

              {/* Title with scanline */}
              <div className="relative inline-block">
                <h1
                  className="text-4xl font-black tracking-widest uppercase"
                  style={{
                    color: '#f59e0b',
                    textShadow: '0 0 24px rgba(245,158,11,0.55), 0 0 60px rgba(245,158,11,0.15)',
                    letterSpacing: '0.16em',
                  }}
                >
                  Scene Quest
                </h1>
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                  <div
                    className="absolute left-0 right-0 animate-scanline-sweep"
                    style={{
                      height: '2px',
                      background: 'linear-gradient(90deg, transparent 0%, rgba(245,158,11,0.7) 40%, rgba(255,255,255,0.5) 50%, rgba(245,158,11,0.7) 60%, transparent 100%)',
                    }}
                  />
                </div>
              </div>

              <p className="text-xs tracking-[0.35em] uppercase font-medium mt-2"
                style={{ color: 'rgba(180,83,9,0.5)' }}>
                AI English Adventure
              </p>

              <div className="mt-4 flex items-center justify-center gap-3">
                <div className="h-px w-14" style={{ background: 'linear-gradient(to right, transparent, rgba(180,83,9,0.4))' }} />
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'rgba(180,83,9,0.4)' }} />
                <div className="h-px w-14" style={{ background: 'linear-gradient(to left, transparent, rgba(180,83,9,0.4))' }} />
              </div>
            </div>

            {/* TAP TO BEGIN */}
            <div className="text-center mt-6">
              <p className="font-black text-xs tracking-[0.5em] uppercase animate-tap-blink"
                style={{ color: 'rgba(245,158,11,0.7)' }}>
                ▶ TAP TO BEGIN
              </p>
            </div>
          </div>
        )}

        {/* Login form — slides up after tap */}
        {splashState === 'done' && (
          <div className="relative z-10 w-full max-w-xs flex flex-col items-center px-6 animate-form-slide-up">

            {/* Compact emblem + title */}
            <div className="text-center mb-8">
              <div className="relative inline-flex items-center justify-center mb-3">
                <div
                  className="absolute rounded-full pointer-events-none"
                  style={{ width: '66px', height: '66px', border: '1px solid rgba(245,158,11,0.16)' }}
                />

                <div
                  style={{
                    width: '50px', height: '50px',
                    borderRadius: '50%',
                    background: 'radial-gradient(circle at 40% 35%, rgba(245,158,11,0.14), rgba(245,158,11,0.02) 70%)',
                    border: '1px solid rgba(245,158,11,0.26)',
                    boxShadow: '0 0 18px rgba(245,158,11,0.09)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <span style={{ fontSize: '20px' }}>✈️</span>
                </div>
              </div>

              <div className="relative inline-block">
                <h1
                  className="text-3xl font-black tracking-widest uppercase"
                  style={{
                    color: '#f59e0b',
                    textShadow: '0 0 20px rgba(245,158,11,0.45)',
                    letterSpacing: '0.14em',
                  }}
                >
                  Scene Quest
                </h1>
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                  <div
                    className="absolute left-0 right-0 animate-scanline-sweep"
                    style={{
                      height: '2px',
                      background: 'linear-gradient(90deg, transparent 0%, rgba(245,158,11,0.65) 40%, rgba(255,255,255,0.4) 50%, rgba(245,158,11,0.65) 60%, transparent 100%)',
                    }}
                  />
                </div>
              </div>

              <p className="text-[10px] tracking-[0.28em] uppercase font-medium mt-1"
                style={{ color: 'rgba(180,83,9,0.4)' }}>
                AI English Adventure
              </p>
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
                <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: '12px', letterSpacing: '0.15em' }}>CONNECTING...</span>
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
              <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.07)' }} />
              <span className="text-xs tracking-widest" style={{ color: 'rgba(255,255,255,0.18)' }}>OR</span>
              <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.07)' }} />
            </div>

            {/* 탭 */}
            <div className="w-full flex mb-4 rounded-xl p-1" style={{ background: 'rgba(255,255,255,0.04)' }}>
              {(['email', 'signup'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => { setTab(t); setError('') }}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold tracking-wider uppercase transition-all ${
                    tab === t ? 'bg-amber-500 text-black' : 'text-white/35 hover:text-white/60'
                  }`}
                >
                  {t === 'email' ? '로그인' : '회원가입'}
                </button>
              ))}
            </div>

            {/* 이메일 폼 */}
            <form onSubmit={handleEnter} className="w-full space-y-3">
              {error && (
                <div className="rounded-xl p-3 text-xs leading-relaxed text-center"
                  style={{ background: 'rgba(127,29,29,0.3)', border: '1px solid rgba(185,28,28,0.4)', color: '#f87171' }}>
                  {error}
                </div>
              )}
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoFocus
                className="w-full rounded-xl px-4 py-3.5 text-white text-sm text-center placeholder-gray-700 focus:outline-none"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(245,158,11,0.15)',
                }}
                placeholder="your@email.com"
              />

              {/* LOGIN button with shimmer sweep */}
              <div className="relative overflow-hidden rounded-xl">
                <button
                  type="submit"
                  disabled={loading || googleLoading || !email.trim()}
                  className="relative w-full rounded-xl py-3.5 font-black text-sm tracking-widest uppercase transition-all disabled:opacity-30 hover:scale-[1.02] active:scale-[0.98]"
                  style={{
                    background: loading ? 'rgba(245,158,11,0.2)' : 'linear-gradient(135deg, #f59e0b, #d97706)',
                    color: '#000',
                    boxShadow: loading ? 'none' : '0 0 24px rgba(245,158,11,0.3)',
                  }}
                >
                  {loading ? 'LOADING...' : tab === 'email' ? '▶  LOGIN' : '▶  CREATE ACCOUNT'}
                </button>
                {!loading && (
                  <div
                    className="absolute top-0 bottom-0 w-1/3 pointer-events-none animate-shimmer-sweep"
                    style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)' }}
                  />
                )}
              </div>
            </form>

            <p className="mt-8 text-xs tracking-widest text-center uppercase"
              style={{ color: 'rgba(55,65,81,0.75)' }}>
              Restaurant · Airport · Hotel
            </p>
          </div>
        )}

      </div>
    </div>
  )
}
