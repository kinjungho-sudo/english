'use client'

import { useState } from 'react'

type Props = {
  onClose: () => void
}

const SLIDES = [
  {
    emoji: '✈️',
    title: '여행 영어를\n게임처럼 배워요',
    body: '레스토랑, 공항, 호텔 — 실제 여행에서 맞닥뜨리는 상황을 AI와 함께 직접 말하며 연습해요.',
    visual: (
      <div className="flex justify-center gap-3 mt-4">
        {(['🍽️', '✈️', '🏨'] as const).map((e, i) => (
          <div key={i} className="w-14 h-14 rounded-2xl bg-white/6 border border-white/10 flex items-center justify-center text-2xl">
            {e}
          </div>
        ))}
      </div>
    ),
  },
  {
    emoji: '🎮',
    title: '이렇게\n플레이해요',
    body: null,
    visual: (
      <div className="mt-4 space-y-3">
        {[
          { num: '1', icon: '🔊', text: 'NPC가 영어로 말해요', sub: '자동으로 음성이 나와요' },
          { num: '2', icon: '⌨️', text: '영어로 직접 답해요', sub: '입력창에 타이핑하고 전송' },
          { num: '3', icon: '⭐', text: 'AI가 즉시 평가해요', sub: 'Perfect / Great / 틀렸을 땐 설명' },
        ].map(s => (
          <div key={s.num} className="flex items-center gap-3 bg-white/5 rounded-xl px-4 py-3">
            <span className="text-xl w-7 shrink-0">{s.icon}</span>
            <div>
              <p className="text-white/85 text-[13px] font-semibold">{s.text}</p>
              <p className="text-white/35 text-[11px]">{s.sub}</p>
            </div>
          </div>
        ))}
      </div>
    ),
  },
  {
    emoji: '🎯',
    title: '목표 키워드를\n포함해서 말해요',
    body: null,
    visual: (
      <div className="mt-4 space-y-3">
        <p className="text-white/40 text-[12px] leading-relaxed text-center">
          각 대화마다 꼭 써야 하는 표현이 있어요.
        </p>
        {/* 목표 키워드 예시 */}
        <div className="rounded-xl px-4 py-3 space-y-2"
          style={{ background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.12)' }}>
          <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'rgba(245,158,11,0.5)' }}>
            🎯 목표 예시
          </p>
          <div className="flex flex-wrap gap-1.5">
            {['Can I have', 'please'].map(kw => (
              <span key={kw} className="text-[11px] font-mono px-2 py-0.5 rounded-md"
                style={{ background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.15)', color: 'rgba(255,255,255,0.55)' }}>
                {kw}
              </span>
            ))}
          </div>
          <p className="text-white/30 text-[11px]">→ <span className="text-white/55 font-medium">"Can I have a menu, please?"</span></p>
        </div>
        <p className="text-white/30 text-[11px] text-center leading-relaxed">
          목표 표현을 포함할수록 높은 점수를 받아요
        </p>
      </div>
    ),
  },
  {
    emoji: '💡',
    title: '막히면\n이렇게 해요',
    body: null,
    visual: (
      <div className="mt-4 space-y-3">
        {[
          { icon: '💡', text: '힌트 자동 제공', sub: '틀렸을 때 자동으로 힌트가 나타나요 — 단, 점수가 깎여요' },
          { icon: '🔄', text: '복습 시스템', sub: '틀린 표현은 다음 게임에서 다시 출제돼요' },
          { icon: '🏆', text: 'XP & 레벨', sub: '점수가 쌓일수록 레벨이 올라가요' },
        ].map(s => (
          <div key={s.icon} className="flex items-center gap-3 bg-white/5 rounded-xl px-4 py-3">
            <span className="text-xl w-7 shrink-0">{s.icon}</span>
            <div>
              <p className="text-white/85 text-[13px] font-semibold">{s.text}</p>
              <p className="text-white/35 text-[11px]">{s.sub}</p>
            </div>
          </div>
        ))}
      </div>
    ),
  },
]

export default function OnboardingModal({ onClose }: Props) {
  const [slide, setSlide] = useState(0)
  const isLast = slide === SLIDES.length - 1
  const current = SLIDES[slide]

  function next() {
    if (isLast) onClose()
    else setSlide(s => s + 1)
  }

  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-end pb-0"
      style={{ background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(6px)' }}>

      {/* 카드 */}
      <div className="w-full animate-fade-in-up"
        style={{
          background: 'linear-gradient(to bottom, #111117, #0a0a0f)',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '24px 24px 0 0',
          padding: '28px 24px 36px',
        }}>

        {/* 건너뛰기 */}
        <div className="flex justify-end mb-2">
          <button
            onClick={onClose}
            className="text-white/25 hover:text-white/55 text-[11px] tracking-widest uppercase transition-colors"
          >
            건너뛰기
          </button>
        </div>

        {/* 이모지 + 제목 */}
        <div className="text-center mb-1">
          <div className="text-4xl mb-4">{current.emoji}</div>
          <h2 className="text-white font-black text-xl leading-snug whitespace-pre-line"
            style={{ letterSpacing: '-0.02em' }}>
            {current.title}
          </h2>
          {current.body && (
            <p className="mt-3 text-white/45 text-[13px] leading-relaxed">
              {current.body}
            </p>
          )}
        </div>

        {/* 슬라이드별 비주얼 */}
        {current.visual}

        {/* 슬라이드 도트 */}
        <div className="flex justify-center gap-1.5 mt-6 mb-5">
          {SLIDES.map((_, i) => (
            <div key={i} className={`rounded-full transition-all duration-300 ${
              i === slide
                ? 'w-5 h-1.5 bg-amber-400'
                : 'w-1.5 h-1.5 bg-white/18'
            }`} />
          ))}
        </div>

        {/* CTA 버튼 */}
        <button
          onClick={next}
          className="w-full py-3.5 rounded-xl font-black text-sm tracking-widest uppercase transition-all hover:scale-[1.02] active:scale-[0.98]"
          style={{
            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
            color: '#000',
            boxShadow: '0 0 24px rgba(245,158,11,0.25)',
          }}
        >
          {isLast ? '▶  게임 시작하기' : '다음'}
        </button>
      </div>
    </div>
  )
}
