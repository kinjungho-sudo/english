'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LandingPage() {
  const router = useRouter()
  const supabase = createClient()

  const [mode, setMode] = useState<'landing' | 'login' | 'signup'>('landing')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
    } else {
      router.push('/dashboard')
      router.refresh()
    }
    setLoading(false)
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/api/auth/callback` },
    })
    if (error) {
      setError(error.message)
    } else {
      setMessage('Check your email for a confirmation link!')
    }
    setLoading(false)
  }

  async function handleGoogleLogin() {
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/api/auth/callback` },
    })
    if (error) {
      setError(error.message)
      setLoading(false)
    }
    // 성공 시 Google 리다이렉트 — 로딩 상태 유지
  }

  if (mode !== 'landing') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-950 via-gray-900 to-amber-950/20 px-4">
        <div className="w-full max-w-sm">
          <button
            onClick={() => { setMode('landing'); setError(''); setMessage('') }}
            className="mb-6 text-amber-400/70 hover:text-amber-400 text-sm flex items-center gap-1 transition-colors"
          >
            ← Back
          </button>

          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-white mb-1">
              {mode === 'login' ? 'Welcome back' : 'Create account'}
            </h2>
            <p className="text-gray-500 text-sm mb-6">
              {mode === 'login' ? 'Continue your language journey' : 'Start learning travel English'}
            </p>

            {message ? (
              <div className="bg-green-900/30 border border-green-700 rounded-xl p-4 text-green-300 text-sm">
                {message}
              </div>
            ) : (
              <>
                {/* Google OAuth */}
                <button
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-100 disabled:opacity-50 text-gray-900 font-semibold rounded-xl py-3 transition-colors mb-4"
                >
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                    <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
                    <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
                  </svg>
                  {loading ? '...' : 'Continue with Google'}
                </button>

                {/* Divider */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex-1 h-px bg-gray-800" />
                  <span className="text-gray-600 text-xs">or</span>
                  <div className="flex-1 h-px bg-gray-800" />
                </div>

                {/* Email form */}
                <form onSubmit={mode === 'login' ? handleLogin : handleSignup} className="space-y-4">
                  {error && (
                    <div className="bg-red-900/30 border border-red-700 rounded-xl p-3 text-red-300 text-sm">
                      {error}
                    </div>
                  )}
                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5 font-medium uppercase tracking-wider">Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                      className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-amber-500 transition-colors"
                      placeholder="you@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5 font-medium uppercase tracking-wider">Password</label>
                    <input
                      type="password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                      minLength={6}
                      className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-amber-500 transition-colors"
                      placeholder="••••••••"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-gray-950 font-bold rounded-xl py-3 transition-colors"
                  >
                    {loading ? '...' : mode === 'login' ? 'Sign In' : 'Sign Up'}
                  </button>
                </form>
              </>
            )}

            <p className="text-center text-gray-600 text-sm mt-6">
              {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
              <button
                onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError('') }}
                className="text-amber-400 hover:text-amber-300 font-medium transition-colors"
              >
                {mode === 'login' ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-amber-950/20">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-gray-800/50">
        <div className="flex items-center gap-2">
          <span className="text-2xl">✈️</span>
          <span className="font-bold text-white text-lg tracking-tight">TravelSpeak</span>
        </div>
        <button
          onClick={() => setMode('login')}
          className="text-sm text-gray-400 hover:text-white transition-colors"
        >
          Sign In
        </button>
      </header>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-full px-4 py-1.5 mb-8">
          <span className="text-amber-400 text-xs font-bold uppercase tracking-wider">AI-Powered RPG Learning</span>
        </div>

        <h1 className="text-5xl md:text-6xl font-black text-white leading-tight mb-6" style={{ letterSpacing: '-0.04em' }}>
          말이 안 나왔던 그 순간,<br />
          <span className="text-amber-400">이번엔 자신 있게.</span>
        </h1>

        <p className="text-lg text-gray-400 max-w-xl mx-auto mb-10 leading-relaxed">
          식당, 공항, 호텔 — 실제 여행에서 마주치는 상황을<br />
          AI NPC와 함께 게임처럼 연습합니다.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => setMode('signup')}
            className="bg-amber-500 hover:bg-amber-400 text-gray-950 font-black px-8 py-3.5 rounded-xl transition-colors text-base"
          >
            무료로 시작하기
          </button>
          <button
            onClick={() => setMode('login')}
            className="border border-gray-700 hover:border-gray-500 text-gray-300 hover:text-white font-semibold px-8 py-3.5 rounded-xl transition-colors text-base"
          >
            로그인
          </button>
        </div>

        <p className="text-xs text-gray-600 mt-4">무료 · 스팸 없음 · 언제든 탈퇴 가능</p>
      </section>

      {/* Scenarios Preview */}
      <section className="max-w-4xl mx-auto px-6 pb-20">
        <p className="text-center text-xs text-gray-500 uppercase tracking-widest font-bold mb-8">학습 시나리오</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { icon: '🍽️', title: 'Restaurant', sub: '뉴욕 레스토랑', npc: 'SARAH', desc: '주문부터 계산까지 완벽하게' },
            { icon: '✈️', title: 'Airport', sub: 'JFK 공항 체크인', npc: 'MIKE', desc: '수하물·좌석·게이트 정보 요청' },
            { icon: '🏨', title: 'Hotel', sub: '맨해튼 호텔', npc: 'EMMA', desc: '체크인부터 편의시설 문의까지' },
          ].map(s => (
            <div key={s.title} className="bg-gray-900/60 border border-gray-800 rounded-2xl p-6 hover:border-amber-500/30 transition-colors">
              <div className="text-4xl mb-4">{s.icon}</div>
              <div className="text-xs text-amber-400/70 font-bold uppercase tracking-wider mb-1">with {s.npc}</div>
              <h3 className="text-white font-bold text-lg mb-1">{s.title}</h3>
              <p className="text-gray-500 text-sm mb-2">{s.sub}</p>
              <p className="text-gray-400 text-sm">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="border-t border-gray-800/50 py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <p className="text-center text-xs text-gray-500 uppercase tracking-widest font-bold mb-12">어떻게 작동하나요</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'NPC와 대화', desc: 'AI NPC가 실제 상황처럼 영어로 질문합니다' },
              { step: '02', title: 'AI가 평가', desc: '내 답변을 분석해 점수와 더 자연스러운 표현을 알려줍니다' },
              { step: '03', title: '틀린 것만 복습', desc: '재방문 시 틀렸던 표현이 우선 출제되어 성장을 느낍니다' },
            ].map((item, i) => (
              <div key={i} className="text-center">
                <div className="text-amber-500/30 font-black text-5xl mb-3">{item.step}</div>
                <h3 className="text-white font-bold mb-2">{item.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 text-center">
        <h2 className="text-3xl font-black text-white mb-4" style={{ letterSpacing: '-0.03em' }}>
          지금 바로 시작하세요
        </h2>
        <p className="text-gray-500 mb-8">5분이면 첫 시나리오를 클리어할 수 있습니다</p>
        <button
          onClick={() => setMode('signup')}
          className="bg-amber-500 hover:bg-amber-400 text-gray-950 font-black px-10 py-4 rounded-xl transition-colors text-base"
        >
          무료로 시작하기
        </button>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800/50 py-8 px-6 text-center">
        <p className="text-gray-600 text-sm">© 2026 TravelSpeak · AI-Powered Language Learning</p>
      </footer>
    </div>
  )
}
