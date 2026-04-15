'use client'

import { useState } from 'react'
import type { CSSProperties } from 'react'

type Props = {
  onDone: () => void
}

type Step = {
  // which UI region to spotlight
  target: 'npc' | 'input' | 'goal' | 'hud'
  title: string
  body: string
  // arrow direction from the tooltip card
  arrow?: 'up' | 'down'
}

const TUTORIAL_STEPS: Step[] = [
  {
    target: 'hud',
    arrow: 'down',
    title: '진행 바 & 점수',
    body: '상단의 점 하나가 대화 1단계예요. 오른쪽 ★ 숫자가 내 점수예요.',
  },
  {
    target: 'npc',
    arrow: 'down',
    title: 'NPC가 먼저 말해요',
    body: '영어로 말을 걸어와요. 잘 읽고 대화 상황을 파악하세요.',
  },
  {
    target: 'goal',
    arrow: 'up',
    title: '🎯 목표 키워드',
    body: '이 표현들을 포함해서 대답하면 높은 점수를 받아요. 참고만 해도 OK!',
  },
  {
    target: 'input',
    arrow: 'up',
    title: '영어로 입력하고 전송!',
    body: '입력창에 영어로 타이핑한 뒤 → 버튼을 누르세요. AI가 즉시 채점해드려요.',
  },
]

export default function GameTutorial({ onDone }: Props) {
  const [step, setStep] = useState(0)
  const current = TUTORIAL_STEPS[step]
  const isLast = step === TUTORIAL_STEPS.length - 1

  function next() {
    if (isLast) onDone()
    else setStep(s => s + 1)
  }

  // Spotlight positions mapped to target
  // These position the highlight ring + tooltip relative to the game card
  const spotlightStyle: Record<Step['target'], CSSProperties> = {
    hud:   { top: 0,   left: 0,   right: 0,   height: '72px' },
    npc:   { bottom: '140px', left: 0, right: 0, height: '80px' },
    goal:  { bottom: '192px', left: 0, right: 0, height: '36px' },
    input: { bottom: 0, left: 0, right: 0, height: '60px' },
  }

  const tooltipPosition: Record<Step['target'], CSSProperties> = {
    hud:   { top: '82px',   left: '16px', right: '16px' },
    npc:   { bottom: '232px', left: '16px', right: '16px' },
    goal:  { bottom: '238px', left: '16px', right: '16px' },
    input: { bottom: '70px',  left: '16px', right: '16px' },
  }

  return (
    <div
      className="absolute inset-0 z-40 pointer-events-none"
      style={{ isolation: 'isolate' }}
    >
      {/* 어두운 전체 오버레이 */}
      <div
        className="absolute inset-0"
        style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(1px)' }}
      />

      {/* 스포트라이트 컷아웃 */}
      <div
        className="absolute"
        style={{
          ...spotlightStyle[current.target],
          background: 'transparent',
          boxShadow: '0 0 0 9999px rgba(0,0,0,0.72)',
          borderRadius: current.target === 'hud' ? '0 0 12px 12px' : '12px',
          zIndex: 1,
          pointerEvents: 'none',
        }}
      />

      {/* 스포트라이트 테두리 */}
      <div
        className="absolute animate-pulse"
        style={{
          ...spotlightStyle[current.target],
          border: '1.5px solid rgba(245,158,11,0.55)',
          borderRadius: current.target === 'hud' ? '0 0 12px 12px' : '12px',
          zIndex: 2,
          pointerEvents: 'none',
          boxShadow: '0 0 12px rgba(245,158,11,0.2), inset 0 0 12px rgba(245,158,11,0.05)',
        }}
      />

      {/* 툴팁 카드 */}
      <div
        className="absolute pointer-events-auto animate-fade-in-up"
        style={{
          ...tooltipPosition[current.target],
          zIndex: 3,
        }}
      >
        {/* 위쪽 화살표 */}
        {current.arrow === 'down' && (
          <div className="flex justify-center mb-1.5">
            <div
              style={{
                width: 0, height: 0,
                borderLeft: '7px solid transparent',
                borderRight: '7px solid transparent',
                borderBottom: '8px solid rgba(245,158,11,0.35)',
              }}
            />
          </div>
        )}

        <div
          className="rounded-2xl px-5 py-4"
          style={{
            background: 'linear-gradient(135deg, rgba(20,20,28,0.97), rgba(12,12,18,0.97))',
            border: '1px solid rgba(245,158,11,0.25)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.6), 0 0 20px rgba(245,158,11,0.08)',
          }}
        >
          {/* 스텝 표시 */}
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold tracking-[0.2em] uppercase" style={{ color: 'rgba(245,158,11,0.5)' }}>
              튜토리얼 {step + 1} / {TUTORIAL_STEPS.length}
            </span>
            <button
              onClick={onDone}
              className="text-white/20 hover:text-white/50 text-[10px] tracking-widest uppercase transition-colors"
            >
              건너뛰기
            </button>
          </div>

          <p className="text-white font-black text-[15px] mb-1.5" style={{ letterSpacing: '-0.02em' }}>
            {current.title}
          </p>
          <p className="text-white/50 text-[12px] leading-relaxed">
            {current.body}
          </p>

          {/* 진행 도트 */}
          <div className="flex items-center gap-1.5 mt-3 mb-3">
            {TUTORIAL_STEPS.map((_, i) => (
              <div
                key={i}
                className={`rounded-full transition-all duration-300 ${
                  i === step ? 'w-4 h-1.5 bg-amber-400' : 'w-1.5 h-1.5 bg-white/15'
                }`}
              />
            ))}
          </div>

          <button
            onClick={next}
            className="w-full py-2.5 rounded-xl font-black text-[12px] tracking-widest uppercase transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              color: '#000',
              boxShadow: '0 0 16px rgba(245,158,11,0.2)',
            }}
          >
            {isLast ? '알겠어요! 시작할게요 ▶' : '다음 →'}
          </button>
        </div>

        {/* 아래쪽 화살표 */}
        {current.arrow === 'up' && (
          <div className="flex justify-center mt-1.5">
            <div
              style={{
                width: 0, height: 0,
                borderLeft: '7px solid transparent',
                borderRight: '7px solid transparent',
                borderTop: '8px solid rgba(245,158,11,0.35)',
              }}
            />
          </div>
        )}
      </div>
    </div>
  )
}
