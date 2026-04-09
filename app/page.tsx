'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

type AuthMode = 'menu' | 'login' | 'register'

export default function GameLoginPage() {
  const router = useRouter()
  const supabase = createClient()

  const [mode, setMode] = useState<AuthMode>('menu')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
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

  async function handleGoogleLogin() {
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/api/auth/callback` },
    })
    if (error) { setError(error.message); setLoading(false) }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError(error.message); setLoading(false) }
    else { router.push('/dashboard'); router.refresh() }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/api/auth/callback` },
    })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else if (data.session) {
      // 이메일 확인 비활성화된 경우 — 바로 입장
      router.push('/dashboard')
      router.refresh()
    } else {
      // 이메일 확인 필요한 경우
      setError('📧 확인 이메일을 발송했습니다. 이메일을 확인하거나 Supabase에서 Email Confirmation을 비활성화하세요.')
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gray-950 flex flex-col items-center justify-center px-4"
      style={{ background: 'radial-gradient(ellipse at 50% 0%, #1a0a00 0%, #0a0a0f 60%, #000 100%)' }}>

      {/* Animated stars */}
      <div className="absolute inset-0 pointer-events-none">
        {stars.map((s, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              left: `${s.x}%`, top: `${s.y}%`,
              width: `${s.size}px`, height: `${s.size}px`,
              opacity: 0.4,
              animation: `pulse ${2 + s.delay}s ease-in-out infinite`,
              animationDelay: `${s.delay}s`,
            }}
          />
        ))}
      </div>

      {/* Glow orb behind title */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(251,146,60,0.08) 0%, transparent 70%)' }} />

      {/* Main content */}
      <div className="relative z-10 w-full max-w-sm flex flex-col items-center">

        {/* Game Logo */}
        <div className="text-center mb-10">
          <div className="text-5xl mb-3">✈️</div>
          <h1
            className="text-4xl font-black tracking-widest uppercase mb-1"
            style={{
              color: '#f59e0b',
              textShadow: '0 0 20px rgba(245,158,11,0.6), 0 0 60px rgba(245,158,11,0.2)',
              letterSpacing: '0.15em',
            }}
          >
            TravelSpeak
          </h1>
          <p className="text-xs tracking-[0.3em] uppercase text-amber-600/60 font-medium">
            AI English Adventure
          </p>
          <div className="mt-3 flex items-center justify-center gap-2">
            <div className="h-px w-12 bg-gradient-to-r from-transparent to-amber-700/40" />
            <div className="w-1 h-1 rounded-full bg-amber-600/40" />
            <div className="h-px w-12 bg-gradient-to-l from-transparent to-amber-700/40" />
          </div>
        </div>

        {/* Menu mode */}
        {mode === 'menu' && (
          <div className="w-full space-y-3 animate-fade-in-up">
            {/* Google — main CTA */}
            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="group w-full relative overflow-hidden rounded-xl py-4 flex items-center justify-center gap-3 font-bold text-sm tracking-wider transition-all disabled:opacity-50"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.95), rgba(230,230,230,0.95))',
                color: '#111',
                boxShadow: '0 0 20px rgba(255,255,255,0.1)',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
                <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
              </svg>
              {loading ? 'LOADING...' : 'GOOGLE로 시작하기'}
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 py-1">
              <div className="flex-1 h-px bg-gray-800" />
              <span className="text-gray-700 text-xs tracking-widest">OR</span>
              <div className="flex-1 h-px bg-gray-800" />
            </div>

            {/* Continue / New Game */}
            <button
              onClick={() => setMode('login')}
              className="w-full rounded-xl py-4 font-bold text-sm tracking-widest uppercase transition-all border"
              style={{
                background: 'linear-gradient(135deg, rgba(245,158,11,0.12), rgba(245,158,11,0.04))',
                borderColor: 'rgba(245,158,11,0.3)',
                color: '#f59e0b',
                boxShadow: '0 0 15px rgba(245,158,11,0.05)',
              }}
            >
              ▶ CONTINUE GAME
            </button>

            <button
              onClick={() => setMode('register')}
              className="w-full rounded-xl py-3.5 font-semibold text-sm tracking-widest uppercase transition-all border border-gray-800 text-gray-500 hover:text-gray-300 hover:border-gray-600"
            >
              + NEW GAME
            </button>
          </div>
        )}

        {/* Login / Register form */}
        {mode !== 'menu' && (
          <div className="w-full animate-fade-in-up">
            <button
              onClick={() => { setMode('menu'); setError('') }}
              className="mb-5 text-xs text-gray-600 hover:text-amber-500 tracking-widest uppercase transition-colors flex items-center gap-2"
            >
              ← BACK TO MENU
            </button>

            <div
              className="rounded-2xl p-6 border"
              style={{
                background: 'rgba(10,10,15,0.9)',
                borderColor: 'rgba(245,158,11,0.15)',
                boxShadow: '0 0 40px rgba(245,158,11,0.04), inset 0 1px 0 rgba(255,255,255,0.03)',
              }}
            >
              {/* HUD header */}
              <div className="flex items-center gap-2 mb-5">
                <div className="w-1.5 h-5 rounded-sm bg-amber-500" />
                <span className="text-xs font-bold tracking-[0.2em] uppercase text-amber-500">
                  {mode === 'login' ? 'PLAYER LOGIN' : 'CREATE CHARACTER'}
                </span>
              </div>

              {error && (
                <div className="mb-4 bg-red-950/50 border border-red-800/50 rounded-xl p-3 text-red-400 text-xs leading-relaxed">
                  {error}
                </div>
              )}

              {/* Google in form too */}
              <button
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2.5 bg-white/95 hover:bg-white rounded-xl py-3 font-semibold text-gray-900 text-sm transition-all disabled:opacity-50 mb-4"
              >
                <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
                  <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                  <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
                  <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                  <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
                </svg>
                Google로 {mode === 'login' ? '로그인' : '가입'}
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 h-px bg-gray-800" />
                <span className="text-gray-700 text-xs">OR</span>
                <div className="flex-1 h-px bg-gray-800" />
              </div>

              <form onSubmit={mode === 'login' ? handleLogin : handleRegister} className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1.5 tracking-widest uppercase">EMAIL</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    className="w-full rounded-xl px-4 py-3 text-white text-sm placeholder-gray-700 focus:outline-none transition-all"
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.08)',
                    }}
                    placeholder="your@email.com"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1.5 tracking-widest uppercase">PASSWORD</label>
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full rounded-xl px-4 py-3 text-white text-sm placeholder-gray-700 focus:outline-none transition-all"
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.08)',
                    }}
                    placeholder="••••••••"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl py-3.5 font-black text-sm tracking-widest uppercase transition-all disabled:opacity-40"
                  style={{
                    background: loading
                      ? 'rgba(245,158,11,0.3)'
                      : 'linear-gradient(135deg, #f59e0b, #d97706)',
                    color: '#000',
                    boxShadow: loading ? 'none' : '0 0 20px rgba(245,158,11,0.3)',
                  }}
                >
                  {loading ? '...' : mode === 'login' ? '▶ ENTER GAME' : '✦ START ADVENTURE'}
                </button>
              </form>

              <p className="text-center text-gray-700 text-xs mt-5">
                {mode === 'login' ? '계정이 없으신가요? ' : '이미 계정이 있으신가요? '}
                <button
                  onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError('') }}
                  className="text-amber-600 hover:text-amber-400 transition-colors"
                >
                  {mode === 'login' ? 'NEW GAME' : 'CONTINUE'}
                </button>
              </p>
            </div>
          </div>
        )}

        {/* Bottom flavor text */}
        <p className="mt-8 text-xs text-gray-800 tracking-widest text-center uppercase">
          Restaurant · Airport · Hotel
        </p>
      </div>
    </div>
  )
}
