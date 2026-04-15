'use client'

import { useState, useCallback, useRef, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import NPCDialogue from '@/components/NPCDialogue'
import UserInput from '@/components/UserInput'
import GameTutorial from '@/components/GameTutorial'
import { getSceneUrl, getCharacterUrl, scoreToExpression } from '@/lib/assets'
import type { Scenario, DialogueStep } from '@/lib/scenarios/data'
import type { Expression } from '@/lib/assets'
import type { ChatMessage } from '@/app/api/chat/route'
import { sfxForScore, sfxAdvance, sfxWarmup } from '@/lib/sfx'
import { createClient } from '@/lib/supabase/client'

/* ─── 대화 히스토리 패널 ─── */
type HistoryEntry = ChatMessage & { translation?: string; translating?: boolean }

function HistoryPanel({
  history,
  npcName,
  onClose,
}: {
  history: HistoryEntry[]
  npcName: string
  onClose: () => void
}) {
  const [entries, setEntries] = useState<HistoryEntry[]>(history)
  const bottomRef = useRef<HTMLDivElement>(null)

  // 외부 history 변경 시 동기화
  useEffect(() => {
    setEntries(history)
  }, [history])

  // 새 메시지 추가 시 스크롤
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [entries.length])

  async function translate(idx: number) {
    const entry = entries[idx]
    if (entry.translation || entry.translating) return
    setEntries(prev => prev.map((e, i) => i === idx ? { ...e, translating: true } : e))
    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: entry.content }),
      })
      const { translation } = await res.json()
      setEntries(prev => prev.map((e, i) => i === idx ? { ...e, translation, translating: false } : e))
    } catch {
      setEntries(prev => prev.map((e, i) => i === idx ? { ...e, translating: false } : e))
    }
  }

  return (
    <div
      className="absolute inset-0 z-40 flex flex-col animate-fade-in-up"
      style={{ background: 'rgba(2,6,23,0.97)', backdropFilter: 'blur(12px)' }}
    >
      {/* 헤더 */}
      <div
        className="shrink-0 flex items-center justify-between px-5 py-4 border-b"
        style={{ borderColor: 'rgba(255,255,255,0.07)' }}
      >
        <div>
          <p className="text-white/80 font-bold text-sm tracking-wide">대화 기록</p>
          <p className="text-white/30 text-[11px] mt-0.5">버블을 탭하면 한국어 번역</p>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-xl flex items-center justify-center text-white/40 hover:text-white/80 hover:bg-white/8 transition-all"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      {/* 메시지 목록 */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <span className="text-4xl opacity-20">💬</span>
            <p className="text-white/25 text-sm">아직 대화 기록이 없어요</p>
          </div>
        ) : (
          entries.map((entry, idx) => {
            const isUser = entry.role === 'user'
            return (
              <div key={idx} className={`flex flex-col gap-1 ${isUser ? 'items-end' : 'items-start'}`}>
                {/* 발화자 레이블 */}
                <span className="text-[10px] font-bold tracking-wider uppercase px-1"
                  style={{ color: isUser ? 'rgba(251,191,36,0.5)' : 'rgba(148,163,184,0.5)' }}>
                  {isUser ? 'YOU' : npcName}
                </span>
                {/* 말풍선 — 탭하면 번역 */}
                <button
                  onClick={() => translate(idx)}
                  className={`text-left max-w-[85%] rounded-2xl px-4 py-3 transition-all active:scale-[0.98] ${
                    isUser
                      ? 'rounded-tr-sm'
                      : 'rounded-tl-sm'
                  }`}
                  style={isUser ? {
                    background: 'rgba(245,158,11,0.15)',
                    border: '1px solid rgba(245,158,11,0.25)',
                  } : {
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}
                >
                  <p className="text-white/85 text-[13px] leading-relaxed">{entry.content}</p>
                  {/* 번역 결과 */}
                  {entry.translating && (
                    <p className="text-[11px] mt-2 flex items-center gap-1.5"
                      style={{ color: isUser ? 'rgba(251,191,36,0.5)' : 'rgba(148,163,184,0.5)' }}>
                      <span className="inline-flex gap-0.5">
                        <span className="animate-bounce" style={{ animationDelay: '0ms' }}>·</span>
                        <span className="animate-bounce" style={{ animationDelay: '120ms' }}>·</span>
                        <span className="animate-bounce" style={{ animationDelay: '240ms' }}>·</span>
                      </span>
                      번역 중
                    </p>
                  )}
                  {entry.translation && (
                    <p className="text-[12px] mt-2 pt-2 border-t leading-relaxed"
                      style={{
                        color: isUser ? 'rgba(251,191,36,0.7)' : 'rgba(148,163,184,0.7)',
                        borderColor: isUser ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.07)',
                      }}>
                      🇰🇷 {entry.translation}
                    </p>
                  )}
                  {/* 탭 유도 힌트 — 번역 전 */}
                  {!entry.translation && !entry.translating && (
                    <p className="text-[10px] mt-1.5 opacity-0 group-hover:opacity-100"
                      style={{ color: isUser ? 'rgba(251,191,36,0.3)' : 'rgba(148,163,184,0.3)' }}>
                      탭하여 번역
                    </p>
                  )}
                </button>
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}

type Props = {
  scenario: Scenario
  steps: DialogueStep[]
  userId: string
  mistakeStepIds: Set<string>
  characterName?: string
  avatarEmoji?: string
  difficulty?: string
}

const DIFFICULTY_OPTIONS = [
  { key: 'easy',   label: '쉬움',   desc: '문법 오류 관대히',  color: '#4ade80', bg: 'rgba(74,222,128,0.1)',  border: 'rgba(74,222,128,0.3)'  },
  { key: 'normal', label: '보통',   desc: '표준 기준',         color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.3)'  },
  { key: 'hard',   label: '어려움', desc: '정확한 표현만 정답', color: '#f87171', bg: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.3)' },
]

const SCENE_FALLBACK_GRADIENT: Record<string, string> = {
  '11111111-1111-1111-1111-111111111111': 'from-orange-950 via-amber-950 to-black',
  '22222222-2222-2222-2222-222222222222': 'from-blue-950 via-sky-950 to-black',
  '33333333-3333-3333-3333-333333333333': 'from-purple-950 via-violet-950 to-black',
  '44444444-4444-4444-4444-444444444444': 'from-yellow-950 via-amber-950 to-black',
  '55555555-5555-5555-5555-555555555555': 'from-yellow-900 via-zinc-950 to-black',
  '66666666-6666-6666-6666-666666666666': 'from-pink-950 via-rose-950 to-black',
  '77777777-7777-7777-7777-777777777777': 'from-teal-950 via-cyan-950 to-black',
}

const NPC_EMOJI: Record<string, string> = {
  SARAH: '👩‍🍳',
  MIKE:  '👨‍✈️',
  EMMA:  '👩‍💼',
  LUCY:  '☕',
  JAMES: '🚕',
  KATE:  '🛍️',
  CHEN:  '💊',
}

const MAX_ATTEMPTS = 2

function getReaction(pts: number): { label: string; color: string } | null {
  if (pts >= 90) return { label: 'Perfect! ✨', color: '#f59e0b' }
  if (pts >= 70) return { label: 'Great! 👍',   color: '#34d399' }
  if (pts >= 30) return { label: 'Nice try 💪',  color: '#94a3b8' }
  return            { label: 'Bad 😞',           color: '#f87171' }
}

export default function GameScene({ scenario, steps, userId, mistakeStepIds, characterName, avatarEmoji, difficulty: initialDifficulty = 'normal' }: Props) {
  void userId
  const router = useRouter()
  const supabase = createClient()
  const [difficulty, setDifficulty] = useState(initialDifficulty)

  async function handleDifficultyChange(d: string) {
    setDifficulty(d)
    await supabase.from('profiles').update({ difficulty: d }).eq('id', (await supabase.auth.getUser()).data.user!.id)
  }

  const orderedSteps = [
    ...steps.filter(s => mistakeStepIds.has(s.id)),
    ...steps.filter(s => !mistakeStepIds.has(s.id)),
  ]

  const [showIntro, setShowIntro] = useState(true)
  const [showHistory, setShowHistory] = useState(false)
  // 첫 게임 여부: localStorage 'sq_tutorial_done' 없으면 튜토리얼 표시
  const [showTutorial, setShowTutorial] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [loading, setLoading] = useState(false)
  const [expression, setExpression] = useState<Expression>('neutral')
  const [sceneError, setSceneError] = useState(false)
  const [charError, setCharError] = useState(false)

  // Hybrid multi-turn state
  const [convHistory, setConvHistory] = useState<ChatMessage[]>([])
  const [attempt, setAttempt] = useState(0)
  const [npcResponse, setNpcResponse] = useState<string | null>(null)
  const [pendingAdvance, setPendingAdvance] = useState(false)
  const [lastFeedback, setLastFeedback] = useState<string | null>(null)
  const [lastCorrection, setLastCorrection] = useState<string | null>(null)
  const [lastGoalAchieved, setLastGoalAchieved] = useState(false)
  const [lastScore, setLastScore] = useState<number | null>(null)
  const [lastNaturalExpression, setLastNaturalExpression] = useState<string | null>(null)
  const [scorePopup, setScorePopup] = useState<{ label: string; pts: number; color: string } | null>(null)

  const pendingScoreRef = useRef(0)
  const fallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const advancedRef = useRef(false)

  const currentStep = orderedSteps[currentIndex]
  const isLastStep = currentIndex === orderedSteps.length - 1

  // 스텝마다 대사 변형 랜덤 선택 (variants가 없으면 기본 npc_line 사용)
  const currentNpcLine = useMemo(() => {
    if (!currentStep) return ''
    const variants = currentStep.npc_line_variants ?? []
    if (variants.length === 0) return currentStep.npc_line
    const all = [currentStep.npc_line, ...variants]
    return all[Math.floor(Math.random() * all.length)]
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep?.id])
  const fallbackGradient = SCENE_FALLBACK_GRADIENT[scenario.id] ?? 'from-gray-900 to-black'

  const sceneUrl = getSceneUrl(scenario.id, currentStep?.step_order ?? 1, expression)
  const charUrl = !sceneUrl ? getCharacterUrl(scenario.id, scenario.npc_name, expression) : null

  const saveProgress = useCallback(async (stepsCompleted: number, totalScore: number, completed: boolean) => {
    await fetch('/api/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenarioId: scenario.id, stepsCompleted, totalScore, completed }),
    })
  }, [scenario.id])

  function resetStepState() {
    setConvHistory([])
    setAttempt(0)
    setNpcResponse(null)
    setPendingAdvance(false)
    setLastFeedback(null)
    setLastCorrection(null)
    setLastGoalAchieved(false)
    setLastScore(null)
    setLastNaturalExpression(null)
    setExpression('neutral')
    setSceneError(false)
    setCharError(false)
  }

  function handleNPCResponseEnd() {
    if (advancedRef.current) return
    advancedRef.current = true
    if (fallbackTimerRef.current) {
      clearTimeout(fallbackTimerRef.current)
      fallbackTimerRef.current = null
    }
    setNpcResponse(null)

    if (pendingAdvance) {
      goNext(pendingScoreRef.current)
    } else {
      // Stay on same step — reset to main image and re-enable input
      setExpression('neutral')
      advancedRef.current = false
    }
  }

  function goNext(newScore: number) {
    if (!isLastStep) sfxAdvance()
    resetStepState()
    if (isLastStep) {
      saveProgress(orderedSteps.length, newScore, true)
      router.push(`/result/${scenario.id}?score=${newScore}&steps=${orderedSteps.length}`)
    } else {
      const nextIndex = currentIndex + 1
      setCurrentIndex(nextIndex)
      saveProgress(nextIndex, newScore, false)
    }
  }

  async function handleSubmit(userInput: string) {
    setLoading(true)
    advancedRef.current = false
    const nextAttempt = attempt + 1

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userInput,
          conversationHistory: convHistory,
          stepId: currentStep.id,
          scenarioId: scenario.id,
          expectedKeywords: currentStep.expected_keywords,
          hintTemplate: currentStep.hint_template,
          npcName: scenario.npc_name,
          scenarioLocation: scenario.location,
          attempt: nextAttempt,
          maxAttempts: MAX_ATTEMPTS,
          difficulty,
        }),
      })

      const data = await res.json()
      const pts = data.score ?? 50

      // Korean input: don't count as attempt, don't add to score
      if (data.isKoreanInput) {
        setLastFeedback(data.feedback ?? null)
        setLastCorrection(data.correction ?? null)
        setLastGoalAchieved(false)
        setLastScore(0)
        if (data.npcResponse) {
          setPendingAdvance(false)
          setNpcResponse(data.npcResponse)
          fallbackTimerRef.current = setTimeout(() => {
            fallbackTimerRef.current = null
            if (!advancedRef.current) {
              advancedRef.current = true
              setNpcResponse(null)
              advancedRef.current = false
            }
          }, 6000)
        }
        setLoading(false)
        return
      }

      const newScore = score + pts
      setScore(newScore)
      pendingScoreRef.current = newScore
      setExpression(scoreToExpression(pts, data.goalAchieved ?? true))
      setLastFeedback(data.feedback ?? null)
      setLastCorrection(data.correction ?? null)
      setLastGoalAchieved(data.goalAchieved ?? false)
      setLastScore(pts)
      setLastNaturalExpression(data.naturalExpression ?? null)
      setAttempt(nextAttempt)

      // Update conversation history
      setConvHistory(prev => [
        ...prev,
        { role: 'user', content: userInput },
        ...(data.npcResponse ? [{ role: 'npc' as const, content: data.npcResponse }] : []),
      ])

      sfxForScore(pts)
      const reaction = getReaction(pts)
      if (reaction) {
        setScorePopup({ label: reaction.label, pts, color: reaction.color })
        setTimeout(() => setScorePopup(null), 1600)
      }

      if (data.npcResponse) {
        setPendingAdvance(data.advanceToNext ?? false)
        setNpcResponse(data.npcResponse)
        fallbackTimerRef.current = setTimeout(() => {
          fallbackTimerRef.current = null
          if (!advancedRef.current) {
            advancedRef.current = true
            setNpcResponse(null)
            if (data.advanceToNext) {
              goNext(newScore)
            } else {
              // Stay on same step — reset to main image
              setExpression('neutral')
              advancedRef.current = false
            }
          }
        }, 7000)
      } else {
        if (data.advanceToNext) {
          setTimeout(() => goNext(newScore), 900)
        }
      }
    } catch {
      const newScore = score + 50
      setScore(newScore)
      setTimeout(() => goNext(newScore), 900)
    }
    setLoading(false)
  }

  return (
    <div className="game-wrap">
      <div className="game-card">

        {/* ── 시나리오 인트로 화면 ── */}
        {showIntro && (
          <div className={`absolute inset-0 z-50 flex flex-col bg-gradient-to-b ${fallbackGradient}`}>
            {/* 상단 EXIT */}
            <div className="shrink-0 px-5 pt-5">
              <button
                onClick={() => router.push('/dashboard')}
                className="flex items-center gap-1.5 text-white/35 hover:text-white/75 transition-colors group"
              >
                <span className="text-sm group-hover:-translate-x-0.5 transition-transform">←</span>
                <span className="text-[11px] font-bold tracking-widest uppercase">EXIT</span>
              </button>
            </div>

            {/* NPC 이모지 */}
            <div className="flex-1 flex items-center justify-center">
              <span className="text-[96px] leading-none select-none opacity-80 drop-shadow-2xl">
                {NPC_EMOJI[scenario.npc_name] ?? '🧑'}
              </span>
            </div>

            {/* 인트로 정보 카드 */}
            <div className="shrink-0 px-5 pb-8 space-y-4 animate-fade-in-up">
              {/* 위치 레이블 */}
              <p className="text-[11px] font-bold uppercase tracking-[0.18em]" style={{ color: 'rgba(245,158,11,0.6)' }}>
                {scenario.location}
              </p>

              {/* 시나리오 이름 */}
              <div>
                <h1 className="text-3xl font-black text-white leading-tight" style={{ letterSpacing: '-0.03em' }}>
                  {scenario.thumbnail} {scenario.name}
                </h1>
                <p className="mt-2 text-sm" style={{ color: 'rgba(255,255,255,0.45)', lineHeight: '1.6' }}>
                  {scenario.npc_personality}
                </p>
              </div>

              {/* NPC 이름 배지 */}
              <div className="inline-flex items-center gap-2 rounded-full px-3 py-1.5"
                style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <span className="text-sm">{NPC_EMOJI[scenario.npc_name] ?? '🧑'}</span>
                <span className="text-xs font-bold text-white/60 tracking-wider uppercase">{scenario.npc_name}</span>
              </div>

              {/* 스텝 수 */}
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>
                총 {orderedSteps.length}단계 대화
                {mistakeStepIds.size > 0 && (
                  <span className="ml-2 text-amber-400/60">🔄 복습 {mistakeStepIds.size}개 포함</span>
                )}
              </p>

              {/* 난이도 선택 */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] mb-2" style={{ color: 'rgba(255,255,255,0.25)' }}>
                  난이도
                </p>
                <div className="flex gap-2">
                  {DIFFICULTY_OPTIONS.map(d => (
                    <button
                      key={d.key}
                      onClick={() => handleDifficultyChange(d.key)}
                      className="flex-1 py-2 rounded-xl text-center transition-all"
                      style={{
                        background: difficulty === d.key ? d.bg : 'rgba(255,255,255,0.04)',
                        border: `1px solid ${difficulty === d.key ? d.border : 'rgba(255,255,255,0.08)'}`,
                      }}
                    >
                      <p className="text-xs font-black" style={{ color: difficulty === d.key ? d.color : 'rgba(255,255,255,0.3)' }}>
                        {d.label}
                      </p>
                      <p className="text-[9px] mt-0.5" style={{ color: difficulty === d.key ? d.color + '99' : 'rgba(255,255,255,0.15)' }}>
                        {d.desc}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* 시작 버튼 */}
              <button
                onClick={() => {
                  sfxWarmup()
                  setShowIntro(false)
                  // 첫 게임이면 튜토리얼 표시
                  if (typeof window !== 'undefined' && !localStorage.getItem('sq_tutorial_done')) {
                    setShowTutorial(true)
                  }
                }}
                className="w-full py-4 rounded-2xl font-black text-sm tracking-widest uppercase transition-all hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  background: 'linear-gradient(135deg, #d97706, #f59e0b)',
                  color: '#000',
                  boxShadow: '0 0 32px rgba(245,158,11,0.35)',
                }}
              >
                ▶ 시작하기
              </button>
            </div>
          </div>
        )}

        {/* ── 배경: 씬 이미지 전체 채움 ── */}
        <div className="absolute inset-0 z-0">
          {sceneUrl && !sceneError ? (
            <>
              <Image
                src={sceneUrl}
                alt={scenario.npc_name}
                fill
                className="object-cover object-top"
                onError={() => setSceneError(true)}
                priority
              />
              <div className="absolute inset-x-0 top-0 h-32"
                style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.65), transparent)' }} />
              <div className="absolute inset-x-0 bottom-0 h-2/3"
                style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.97) 30%, rgba(0,0,0,0.6) 65%, transparent 100%)' }} />
            </>
          ) : charUrl && !charError ? (
            <>
              <div className={`absolute inset-0 bg-gradient-to-b ${fallbackGradient}`} />
              <div className="absolute bottom-48 right-0 left-0 flex justify-center">
                <Image
                  src={charUrl}
                  alt={scenario.npc_name}
                  width={200}
                  height={320}
                  className="object-contain drop-shadow-2xl opacity-70"
                  onError={() => setCharError(true)}
                />
              </div>
              <div className="absolute inset-x-0 bottom-0 h-2/3"
                style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.98) 40%, rgba(0,0,0,0.5) 70%, transparent 100%)' }} />
            </>
          ) : (
            <>
              <div className={`absolute inset-0 bg-gradient-to-b ${fallbackGradient}`} />
              <div className="absolute inset-0 flex items-center justify-center pb-56">
                <span className="text-8xl opacity-15 select-none">{NPC_EMOJI[scenario.npc_name] ?? '🧑'}</span>
              </div>
            </>
          )}
        </div>

        {/* ── 점수 반응 팝업 ── */}
        {scorePopup && (
          <div className="absolute inset-0 z-30 pointer-events-none">
            <div
              className="animate-reaction-pop absolute top-1/2 left-1/2 flex flex-col items-center gap-1"
              style={{ color: scorePopup.color }}
            >
              <span
                className="font-black leading-none"
                style={{ fontSize: '2.6rem', textShadow: `0 0 32px ${scorePopup.color}88, 0 2px 8px rgba(0,0,0,0.8)` }}
              >
                {scorePopup.label}
              </span>
              <span
                className="font-black text-xl tracking-wider"
                style={{ textShadow: `0 0 16px ${scorePopup.color}66, 0 2px 6px rgba(0,0,0,0.8)` }}
              >
                +{scorePopup.pts} pts
              </span>
            </div>
          </div>
        )}

        {/* ── 상단 HUD ── */}
        <div className="relative z-10 shrink-0 px-5 pt-5 pb-2">
          <div className="flex items-center justify-between gap-3">

            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center gap-1.5 text-white/35 hover:text-white/75 transition-colors group"
            >
              <span className="text-sm group-hover:-translate-x-0.5 transition-transform">←</span>
              <span className="text-[11px] font-bold tracking-widest uppercase">EXIT</span>
            </button>

            <div className="flex items-center gap-[3px]">
              {orderedSteps.map((_, i) => (
                <div
                  key={i}
                  className={`progress-seg ${i < currentIndex ? 'done' : i === currentIndex ? 'active' : ''}`}
                />
              ))}
            </div>

            <div className="flex items-center gap-2">
              {/* 대화 기록 버튼 */}
              <button
                onClick={() => setShowHistory(true)}
                className="relative flex items-center justify-center w-7 h-7 rounded-lg transition-all hover:bg-white/10 active:scale-95"
                style={{ color: convHistory.length > 0 ? 'rgba(251,191,36,0.7)' : 'rgba(255,255,255,0.25)' }}
                title="대화 기록"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
                {convHistory.length > 0 && (
                  <span
                    className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] font-black"
                    style={{ background: 'rgba(245,158,11,0.9)', color: '#000' }}
                  >
                    {convHistory.length}
                  </span>
                )}
              </button>
              {/* 점수 */}
              <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-sm border border-white/10 rounded-full px-3 py-1.5">
                <span className="text-amber-400 text-[11px] leading-none">★</span>
                <span className="text-white/85 text-[11px] font-bold tabular-nums leading-none">{score}</span>
              </div>
            </div>
          </div>

          {mistakeStepIds.has(currentStep?.id) && (
            <div className="mt-3 inline-flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 rounded-full px-3 py-1">
              <span className="text-amber-400 text-[11px]">🔄</span>
              <span className="text-amber-300/70 text-[11px] font-medium tracking-wide">복습 — 이전에 틀렸던 표현</span>
            </div>
          )}
        </div>

        {/* ── 씬 중앙 공백 ── */}
        <div className="flex-1 min-h-0" />

        {/* ── 하단 대화 영역 ── */}
        <div className="relative z-10 shrink-0 px-4 pb-5 space-y-2">

          {/* 시도 횟수 도트 (첫 번째 시도 이후) */}
          {attempt > 0 && !npcResponse && (
            <div className="flex items-center justify-center gap-2">
              {Array.from({ length: MAX_ATTEMPTS }, (_, i) => {
                const isUsed = i < attempt
                const isLast = i === attempt - 1
                const isDone = isLast && lastGoalAchieved
                return (
                  <div
                    key={i}
                    className={`w-1.5 h-1.5 rounded-full transition-all ${
                      isDone        ? 'bg-green-400 scale-125' :
                      isUsed        ? 'bg-white/25' :
                      i === attempt ? 'bg-amber-400 animate-pulse scale-110' :
                                      'bg-white/10'
                    }`}
                  />
                )
              })}
              <span className="text-white/25 text-[10px] ml-1 tracking-wide">
                {attempt >= MAX_ATTEMPTS ? '마지막 시도' : `${attempt} / ${MAX_ATTEMPTS}`}
              </span>
            </div>
          )}

          {/* 피드백 패널 — 점수별 스타일 */}
          {lastFeedback && !npcResponse && attempt > 0 && !lastGoalAchieved && (
            (() => {
              const isWrong = lastScore === 0
              const isTried = lastScore !== null && lastScore > 0 && lastScore < 70
              return (
                <div className="rounded-xl px-4 py-2.5 space-y-1 animate-fade-in-up" style={{
                  background: isWrong ? 'rgba(239,68,68,0.07)' : isTried ? 'rgba(245,158,11,0.07)' : 'rgba(0,0,0,0.4)',
                  border: `1px solid ${isWrong ? 'rgba(239,68,68,0.2)' : isTried ? 'rgba(245,158,11,0.2)' : 'rgba(255,255,255,0.07)'}`,
                }}>
                  <p className={`text-[12px] leading-relaxed ${isWrong ? 'text-red-300/70' : isTried ? 'text-amber-200/70' : 'text-white/55'}`}>
                    {lastFeedback}
                  </p>
                  {lastCorrection && (
                    <p className={`text-[11px] font-medium ${isWrong ? 'text-red-400/60' : 'text-amber-400/70'}`}>
                      {lastCorrection}
                    </p>
                  )}
                </div>
              )
            })()
          )}

          {/* 힌트 + 넘어가기 — 완전 오답 즉시 표시, 또는 2회 이상 실패 */}
          {((lastScore === 0 && attempt >= 1) || attempt >= 2) && !npcResponse && !lastGoalAchieved && currentStep.hint_template && (
            <div className="rounded-xl px-4 py-3 space-y-2.5 animate-fade-in-up"
              style={{ background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.12)' }}>
              <div className="flex items-start gap-2">
                <span className="text-[13px] opacity-40 shrink-0 mt-0.5">💡</span>
                <p className="text-white/25 text-[13px] leading-relaxed tracking-wide select-none">
                  {currentStep.hint_template}
                </p>
              </div>
              <button
                onClick={() => goNext(score)}
                className="w-full py-2 rounded-lg text-[11px] font-bold tracking-widest uppercase transition-all text-white/20 hover:text-white/50 hover:bg-white/5"
              >
                읽었어요, 다음으로 →
              </button>
            </div>
          )}

          {/* 학습 목표 키워드 스트립 — 채점 기준 명시 */}
          {currentStep.expected_keywords.length > 0 && !npcResponse && (
            <div className="flex items-center gap-2 px-1 animate-fade-in-up">
              <span className="text-[10px] font-bold tracking-wider uppercase shrink-0" style={{ color: 'rgba(245,158,11,0.4)' }}>🎯 목표</span>
              <div className="flex flex-wrap gap-1.5">
                {currentStep.expected_keywords.map((kw, i) => (
                  <span
                    key={i}
                    className="text-[11px] font-mono px-2 py-0.5 rounded-md"
                    style={{
                      background: 'rgba(245,158,11,0.07)',
                      border: '1px solid rgba(245,158,11,0.15)',
                      color: 'rgba(255,255,255,0.35)',
                    }}
                  >
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 추천 표현 — 통과했지만 90점 미만일 때 NPC 응답과 함께 표시 */}
          {npcResponse && lastGoalAchieved && lastScore !== null && lastScore < 90 && lastNaturalExpression && (
            <div
              className="rounded-xl px-4 py-3 space-y-1 animate-fade-in-up"
              style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)' }}
            >
              <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'rgba(245,158,11,0.5)' }}>
                💡 더 자연스러운 표현
              </p>
              <p className="text-sm font-mono" style={{ color: 'rgba(255,255,255,0.7)' }}>
                &ldquo;{lastNaturalExpression}&rdquo;
              </p>
            </div>
          )}

          {/* NPC 대화 박스 */}
          {npcResponse ? (
            <NPCDialogue
              npcName={scenario.npc_name}
              line={npcResponse}
              ttsText={npcResponse}
              onTTSEnd={handleNPCResponseEnd}
            />
          ) : (
            <NPCDialogue
              npcName={scenario.npc_name}
              line={currentNpcLine}
              ttsText={currentStep.tts_text ?? currentNpcLine}
            />
          )}

          {/* 유저 입력 */}
          {!npcResponse && (
            <UserInput
              hintTemplate={currentStep.hint_template}
              onSubmit={handleSubmit}
              loading={loading}
              disabled={loading}
              characterName={characterName}
              avatarEmoji={avatarEmoji}
            />
          )}
        </div>

        {/* ── 대화 히스토리 패널 ── */}
        {showHistory && (
          <HistoryPanel
            history={convHistory}
            npcName={scenario.npc_name}
            onClose={() => setShowHistory(false)}
          />
        )}

        {/* ── 인게임 튜토리얼 오버레이 (첫 게임만) ── */}
        {showTutorial && (
          <GameTutorial
            onDone={() => {
              localStorage.setItem('sq_tutorial_done', '1')
              setShowTutorial(false)
            }}
          />
        )}

      </div>
    </div>
  )
}
