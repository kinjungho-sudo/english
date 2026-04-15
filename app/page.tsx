'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

/* ─── 떠다니는 구름 모양 SVG ─── */
function CloudLayer() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 1 }}>
      {/* 왼쪽 산 실루엣 */}
      <svg className="absolute bottom-0 left-0" width="55%" viewBox="0 0 320 220" fill="none" preserveAspectRatio="xMinYMax meet">
        <path d="M0 220 L0 140 L40 100 L70 120 L110 60 L150 90 L180 40 L210 80 L250 50 L280 70 L320 30 L320 220Z" fill="url(#mountainLeft)" />
        <defs>
          <linearGradient id="mountainLeft" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0f172a" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#020617" stopOpacity="1" />
          </linearGradient>
        </defs>
      </svg>
      {/* 오른쪽 산 실루엣 */}
      <svg className="absolute bottom-0 right-0" width="55%" viewBox="0 0 320 220" fill="none" preserveAspectRatio="xMaxYMax meet">
        <path d="M320 220 L320 100 L280 130 L240 80 L200 110 L160 50 L120 85 L80 45 L40 75 L0 20 L0 220Z" fill="url(#mountainRight)" />
        <defs>
          <linearGradient id="mountainRight" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0f172a" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#020617" stopOpacity="1" />
          </linearGradient>
        </defs>
      </svg>
      {/* 지평선 안개 */}
      <div
        className="absolute bottom-0 left-0 right-0"
        style={{
          height: '38%',
          background: 'linear-gradient(to top, rgba(2,6,23,1) 0%, rgba(15,23,42,0.6) 40%, transparent 100%)',
        }}
      />
    </div>
  )
}

/* ─── 별똥별 ─── */
function ShootingStar({ style }: { style: React.CSSProperties }) {
  return (
    <div
      className="absolute animate-shooting-star"
      style={{
        width: '120px',
        height: '1.5px',
        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.9), rgba(255,255,255,0.4), transparent)',
        borderRadius: '9999px',
        ...style,
      }}
    />
  )
}

/* ─── 북극광 (오로라) 레이어 ─── */
function Aurora() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
      <div
        className="absolute animate-aurora-1"
        style={{
          top: '8%', left: '-20%', width: '80%', height: '35%',
          background: 'radial-gradient(ellipse, rgba(99,102,241,0.12) 0%, rgba(139,92,246,0.07) 40%, transparent 70%)',
          filter: 'blur(30px)',
          borderRadius: '50%',
        }}
      />
      <div
        className="absolute animate-aurora-2"
        style={{
          top: '15%', right: '-15%', width: '65%', height: '30%',
          background: 'radial-gradient(ellipse, rgba(16,185,129,0.09) 0%, rgba(6,182,212,0.06) 40%, transparent 70%)',
          filter: 'blur(35px)',
          borderRadius: '50%',
        }}
      />
      <div
        className="absolute animate-aurora-3"
        style={{
          top: '5%', left: '20%', width: '60%', height: '25%',
          background: 'radial-gradient(ellipse, rgba(245,158,11,0.06) 0%, rgba(251,146,60,0.04) 40%, transparent 70%)',
          filter: 'blur(25px)',
          borderRadius: '50%',
        }}
      />
    </div>
  )
}

/* ─── 메인 컴포넌트 ─── */
export default function GameLoginPage() {
  const supabase = createClient()

  type Phase = 'title' | 'leaving' | 'login'
  const [phase, setPhase] = useState<Phase>('title')
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState('')

  /* 별 / 파티클 */
  type Star = { x: number; y: number; size: number; delay: number; speed: number }
  type Particle = { x: number; y: number; size: number; delay: number; dx: number }
  type Shooting = { top: number; left: number; angle: number; delay: number; dur: number }

  const [stars, setStars] = useState<Star[]>([])
  const [particles, setParticles] = useState<Particle[]>([])
  const [shootings, setShootings] = useState<Shooting[]>([])

  useEffect(() => {
    setStars(Array.from({ length: 90 }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 80,
      size: Math.random() * 2.2 + 0.4,
      delay: Math.random() * 6,
      speed: Math.random() * 3 + 2,
    })))
    setParticles(Array.from({ length: 20 }, () => ({
      x: Math.random() * 100,
      y: 55 + Math.random() * 35,
      size: Math.random() * 3 + 1.5,
      delay: Math.random() * 6,
      dx: (Math.random() - 0.5) * 70,
    })))
    setShootings(Array.from({ length: 4 }, () => ({
      top: Math.random() * 35,
      left: Math.random() * 70,
      angle: -20 + Math.random() * -20,
      delay: Math.random() * 8,
      dur: 1.2 + Math.random() * 1.2,
    })))
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [])

  function handleTap() {
    if (phase !== 'title') return
    setPhase('leaving')
    timerRef.current = setTimeout(() => setPhase('login'), 350)
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

  return (
    <div className="game-wrap" style={{ background: '#020617' }}>
      <div
        className="game-card"
        style={{
          background: 'radial-gradient(ellipse at 50% 0%, #0d1b4b 0%, #060d1f 45%, #020617 100%)',
          overflow: 'hidden',
        }}
      >

        {/* ── 0. 오로라 ── */}
        <Aurora />

        {/* ── 1. 별 레이어 ── */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 2 }}>
          {stars.map((s, i) => (
            <div
              key={i}
              className="absolute rounded-full"
              style={{
                left: `${s.x}%`, top: `${s.y}%`,
                width: `${s.size}px`, height: `${s.size}px`,
                background: s.size > 1.8
                  ? 'radial-gradient(circle, #fff 0%, rgba(200,220,255,0.6) 50%, transparent)'
                  : 'rgba(255,255,255,0.75)',
                animation: `starTwinkle ${s.speed}s ease-in-out infinite`,
                animationDelay: `${s.delay}s`,
                boxShadow: s.size > 1.6 ? `0 0 ${s.size * 3}px rgba(180,200,255,0.5)` : 'none',
              }}
            />
          ))}
        </div>

        {/* ── 2. 별똥별 ── */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 3 }}>
          {shootings.map((sh, i) => (
            <ShootingStar
              key={i}
              style={{
                top: `${sh.top}%`,
                left: `${sh.left}%`,
                transform: `rotate(${sh.angle}deg)`,
                animationDelay: `${sh.delay}s`,
                animationDuration: `${sh.dur}s`,
              }}
            />
          ))}
        </div>

        {/* ── 3. 황금 파티클 (하단 상승) ── */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 4 }}>
          {particles.map((p, i) => (
            <div
              key={i}
              className="absolute rounded-full animate-gold-rise"
              style={{
                left: `${p.x}%`,
                bottom: `${p.y - 55}%`,
                width: `${p.size}px`,
                height: `${p.size}px`,
                background: 'radial-gradient(circle, rgba(251,191,36,1), rgba(245,158,11,0.3) 60%, transparent)',
                boxShadow: '0 0 6px rgba(251,191,36,0.6)',
                '--dur': `${5 + p.delay * 0.6}s`,
                '--delay': `${p.delay}s`,
                '--dx': `${p.dx}px`,
              } as React.CSSProperties}
            />
          ))}
        </div>

        {/* ── 4. 산 실루엣 ── */}
        <CloudLayer />

        {/* ── 중앙 글로우 ── */}
        <div
          className="absolute pointer-events-none"
          style={{
            zIndex: 5,
            top: '30%', left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '340px', height: '340px',
            background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, rgba(245,158,11,0.05) 40%, transparent 70%)',
            filter: 'blur(1px)',
          }}
        />

        {/* ════════════════════════════════
            TITLE SCREEN
        ════════════════════════════════ */}
        {phase !== 'login' && (
          <div
            onClick={handleTap}
            className={`absolute inset-0 flex flex-col items-center justify-center cursor-pointer select-none ${phase === 'leaving' ? 'animate-title-leave' : ''}`}
            style={{ zIndex: 20 }}
          >
            {/* 메인 로고 */}
            <div className="relative flex flex-col items-center">

              {/* 회전 링 */}
              <div className="relative flex items-center justify-center mb-6" style={{ width: '120px', height: '120px' }}>
                {/* 바깥 회전 링 */}
                <div
                  className="absolute inset-0 rounded-full animate-ring-spin"
                  style={{
                    border: '1.5px solid transparent',
                    background: 'linear-gradient(#020617, #020617) padding-box, conic-gradient(from 0deg, rgba(245,158,11,0.8), rgba(245,158,11,0.05), rgba(245,158,11,0.8)) border-box',
                  }}
                />
                {/* 중간 링 */}
                <div
                  className="absolute rounded-full animate-ring-spin-reverse"
                  style={{
                    width: '92px', height: '92px',
                    border: '1px solid transparent',
                    background: 'linear-gradient(#020617, #020617) padding-box, conic-gradient(from 90deg, rgba(99,102,241,0.6), rgba(99,102,241,0.05), rgba(99,102,241,0.6)) border-box',
                  }}
                />
                {/* 코어 */}
                <div
                  style={{
                    width: '70px', height: '70px',
                    borderRadius: '50%',
                    background: 'radial-gradient(circle at 40% 35%, rgba(99,102,241,0.25), rgba(245,158,11,0.12) 50%, rgba(2,6,23,0.9) 75%)',
                    border: '1.5px solid rgba(245,158,11,0.5)',
                    boxShadow: '0 0 30px rgba(245,158,11,0.25), 0 0 60px rgba(99,102,241,0.15), inset 0 1px 0 rgba(255,255,255,0.15)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    position: 'relative',
                    zIndex: 2,
                  }}
                >
                  <span style={{ fontSize: '28px', filter: 'drop-shadow(0 0 8px rgba(245,158,11,0.8))' }}>✈️</span>
                </div>
                {/* 코어 글로우 펄스 */}
                <div
                  className="absolute rounded-full animate-core-pulse"
                  style={{
                    width: '70px', height: '70px',
                    background: 'radial-gradient(circle, rgba(245,158,11,0.15), transparent 70%)',
                    zIndex: 1,
                  }}
                />
              </div>

              {/* 타이틀 텍스트 */}
              <div className="relative text-center">
                {/* TRAVEL */}
                <div
                  className="block font-black leading-none tracking-[0.12em] animate-title-glow"
                  style={{
                    fontSize: 'clamp(32px, 10vw, 44px)',
                    color: '#fff',
                    textShadow: '0 0 20px rgba(255,255,255,0.3)',
                    letterSpacing: '0.18em',
                  }}
                >
                  TRAVEL
                </div>
                {/* QUEST — 그라디언트 */}
                <div
                  className="block font-black leading-none tracking-[0.18em]"
                  style={{
                    fontSize: 'clamp(38px, 12vw, 52px)',
                    background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 30%, #fde68a 55%, #f59e0b 75%, #d97706 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    filter: 'drop-shadow(0 0 16px rgba(245,158,11,0.6))',
                    letterSpacing: '0.2em',
                  }}
                >
                  QUEST
                </div>
                {/* 스캔라인 */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                  <div
                    className="absolute left-0 right-0 animate-scanline-sweep"
                    style={{
                      height: '2px',
                      background: 'linear-gradient(90deg, transparent, rgba(251,191,36,0.85) 40%, rgba(255,255,255,0.7) 50%, rgba(251,191,36,0.85) 60%, transparent)',
                    }}
                  />
                </div>
              </div>

              {/* 부제 */}
              <div className="flex items-center gap-3 mt-4">
                <div className="h-px w-10" style={{ background: 'linear-gradient(to right, transparent, rgba(245,158,11,0.5))' }} />
                <p
                  className="text-[10px] tracking-[0.45em] uppercase font-semibold"
                  style={{ color: 'rgba(251,191,36,0.6)' }}
                >
                  AI English Adventure
                </p>
                <div className="h-px w-10" style={{ background: 'linear-gradient(to left, transparent, rgba(245,158,11,0.5))' }} />
              </div>

              {/* 스탯 뱃지 3개 */}
              <div className="flex gap-3 mt-6">
                {[
                  { icon: '🍽️', label: 'Restaurant' },
                  { icon: '✈️', label: 'Airport' },
                  { icon: '🏨', label: 'Hotel' },
                ].map((b) => (
                  <div
                    key={b.label}
                    className="flex flex-col items-center gap-1 px-3 py-2 rounded-xl"
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      backdropFilter: 'blur(8px)',
                    }}
                  >
                    <span style={{ fontSize: '16px' }}>{b.icon}</span>
                    <span className="text-[9px] tracking-wider uppercase font-medium" style={{ color: 'rgba(255,255,255,0.35)' }}>
                      {b.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* TAP TO BEGIN */}
            <div className="mt-12 flex flex-col items-center gap-3">
              {/* 아래쪽 펄스 원 */}
              <div className="relative flex items-center justify-center">
                <div
                  className="absolute rounded-full animate-ping-slow"
                  style={{ width: '52px', height: '52px', background: 'rgba(245,158,11,0.12)' }}
                />
                <div
                  className="absolute rounded-full animate-ping-slow"
                  style={{ width: '36px', height: '36px', background: 'rgba(245,158,11,0.1)', animationDelay: '0.4s' }}
                />
                <div
                  className="rounded-full flex items-center justify-center"
                  style={{
                    width: '26px', height: '26px',
                    background: 'linear-gradient(135deg, rgba(245,158,11,0.3), rgba(245,158,11,0.1))',
                    border: '1px solid rgba(245,158,11,0.5)',
                  }}
                >
                  <span style={{ fontSize: '10px', color: 'rgba(245,158,11,0.9)' }}>▼</span>
                </div>
              </div>
              <p
                className="animate-tap-blink text-[11px] font-black tracking-[0.55em] uppercase"
                style={{ color: 'rgba(245,158,11,0.75)' }}
              >
                TAP TO BEGIN
              </p>
            </div>
          </div>
        )}

        {/* ════════════════════════════════
            LOGIN SCREEN
        ════════════════════════════════ */}
        {phase === 'login' && (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center animate-login-enter"
            style={{ zIndex: 20, padding: '24px' }}
          >
            {/* 미니 로고 */}
            <div className="flex flex-col items-center mb-8">
              <div className="relative flex items-center justify-center mb-4" style={{ width: '64px', height: '64px' }}>
                <div
                  className="absolute inset-0 rounded-full animate-ring-spin"
                  style={{
                    border: '1px solid transparent',
                    background: 'linear-gradient(#020617, #020617) padding-box, conic-gradient(from 0deg, rgba(245,158,11,0.7), rgba(245,158,11,0.05), rgba(245,158,11,0.7)) border-box',
                  }}
                />
                <div
                  style={{
                    width: '46px', height: '46px',
                    borderRadius: '50%',
                    background: 'radial-gradient(circle at 40% 35%, rgba(99,102,241,0.2), rgba(2,6,23,0.85))',
                    border: '1px solid rgba(245,158,11,0.4)',
                    boxShadow: '0 0 18px rgba(245,158,11,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <span style={{ fontSize: '18px' }}>✈️</span>
                </div>
              </div>

              <div
                className="font-black tracking-[0.2em] leading-none"
                style={{
                  fontSize: '22px',
                  background: 'linear-gradient(135deg, #fbbf24, #fde68a, #f59e0b)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  filter: 'drop-shadow(0 0 8px rgba(245,158,11,0.5))',
                  letterSpacing: '0.22em',
                }}
              >
                TRAVEL QUEST
              </div>
              <p className="text-[9px] tracking-[0.4em] uppercase mt-1 font-medium" style={{ color: 'rgba(251,191,36,0.45)' }}>
                AI English Adventure
              </p>
            </div>

            {/* 유리 카드 */}
            <div
              className="w-full"
              style={{
                maxWidth: '320px',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '24px',
                padding: '28px 24px',
                backdropFilter: 'blur(20px)',
                boxShadow: '0 0 60px rgba(99,102,241,0.08), 0 20px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)',
              }}
            >
              {/* 안내 문구 */}
              <div className="text-center mb-6">
                <p className="font-bold text-sm" style={{ color: 'rgba(255,255,255,0.85)' }}>
                  모험을 시작하세요
                </p>
                <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.3)' }}>
                  Google 계정으로 바로 시작할 수 있어요
                </p>
              </div>

              {/* 에러 */}
              {error && (
                <div
                  className="rounded-xl p-3 mb-4 text-xs text-center leading-relaxed"
                  style={{ background: 'rgba(127,29,29,0.35)', border: '1px solid rgba(185,28,28,0.4)', color: '#f87171' }}
                >
                  {error}
                </div>
              )}

              {/* Google 버튼 */}
              <button
                onClick={handleGoogleLogin}
                disabled={googleLoading}
                className="group relative w-full overflow-hidden rounded-2xl py-4 font-bold text-sm transition-all duration-200 disabled:opacity-40 hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(240,240,245,0.95) 100%)',
                  boxShadow: '0 4px 24px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.1), inset 0 1px 0 rgba(255,255,255,0.8)',
                  color: '#1a1a2e',
                }}
              >
                {/* 버튼 내 shimmer */}
                <div
                  className="absolute inset-0 pointer-events-none animate-btn-shimmer"
                  style={{
                    background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)',
                    transform: 'skewX(-12deg)',
                  }}
                />
                {googleLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div
                      className="w-4 h-4 rounded-full border-2 animate-spin"
                      style={{ borderColor: 'rgba(0,0,0,0.15)', borderTopColor: 'rgba(0,0,0,0.6)' }}
                    />
                    <span style={{ color: 'rgba(0,0,0,0.5)', letterSpacing: '0.1em', fontSize: '11px' }}>CONNECTING...</span>
                  </span>
                ) : (
                  <span className="relative flex items-center justify-center gap-3">
                    <svg width="20" height="20" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    <span className="font-bold" style={{ color: '#1a1a2e', fontSize: '14px' }}>Google로 계속하기</span>
                  </span>
                )}
              </button>

              {/* 하단 보증 문구 */}
              <p className="text-center text-[10px] mt-4" style={{ color: 'rgba(255,255,255,0.2)' }}>
                가입 즉시 무료 · 신용카드 불필요
              </p>
            </div>

            {/* 씬 미리보기 */}
            <div className="flex items-center gap-2 mt-6">
              {['🍽️ Restaurant', '✈️ Airport', '🏨 Hotel'].map((s) => (
                <span key={s} className="text-[10px] font-medium tracking-wide" style={{ color: 'rgba(255,255,255,0.22)' }}>
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
