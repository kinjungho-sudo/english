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
import { useMute } from '@/lib/useMute'

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
  { key: 'easy',   label: '쉬움',   desc: '정답이 보임 · 따라 말하기',  color: '#4ade80', bg: 'rgba(74,222,128,0.1)',  border: 'rgba(74,222,128,0.3)'  },
  { key: 'normal', label: '보통',   desc: '힌트·번역 사용 가능',         color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.3)'  },
  { key: 'hard',   label: '어려움', desc: '도움 없이 혼자 해결',          color: '#f87171', bg: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.3)' },
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

const NPC_PERSONALITY_KO: Record<string, string> = {
  SARAH: '친절하고 활기찬 레스토랑 웨이트리스',
  MIKE:  '전문적이고 능숙한 항공사 직원',
  EMMA:  '우아하고 세심한 호텔 컨시어지',
  LUCY:  '손님을 반기는 밝은 바리스타',
  JAMES: '수다스럽고 친근한 택시 기사',
  KATE:  '도움을 잘 주는 쇼핑몰 직원',
  CHEN:  '지식이 풍부하고 친절한 약사',
}

const MAX_ATTEMPTS = 2

// AI 점수(0~100) → 게임 획득 점수
function aiScoreToGamePts(aiScore: number, goalAchieved: boolean): number {
  if (goalAchieved && aiScore >= 90) return 50  // Perfect
  if (goalAchieved)                  return 40  // Good
  if (aiScore >= 30)                 return 10  // Nice try
  return 0                                      // Wrong
}

function getReaction(aiScore: number, goalAchieved: boolean): { label: string; color: string } {
  if (goalAchieved && aiScore >= 90) return { label: 'Perfect! ✨', color: '#f59e0b' }
  if (goalAchieved)                  return { label: 'Good! 👍',    color: '#34d399' }
  if (aiScore >= 30)                 return { label: 'Nice try 💪',  color: '#94a3b8' }
  return                                    { label: '다시 도전! 🔁', color: '#f87171' }
}

export default function GameScene({ scenario, steps, userId, mistakeStepIds, characterName, avatarEmoji, difficulty: initialDifficulty = 'normal' }: Props) {
  void userId
  const router = useRouter()
  const supabase = createClient()
  const { muted, toggle: toggleMute } = useMute()
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
  // 게임 시작 2초 후 NPC 첫 발화 트리거
  const [npcReady, setNpcReady] = useState(false)
  const npcReadyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
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
  const pendingAdvanceRef = useRef(false)   // ref로 관리 — onTTSEnd 클로저에서 최신값 보장
  const [lastFeedback, setLastFeedback] = useState<string | null>(null)
  const [lastCorrection, setLastCorrection] = useState<string | null>(null)
  const [lastGoalAchieved, setLastGoalAchieved] = useState(false)
  const [lastScore, setLastScore] = useState<number | null>(null)
  const [lastNaturalExpression, setLastNaturalExpression] = useState<string | null>(null)
  const [lastPartialPass, setLastPartialPass] = useState(false)
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

  function resetStepState(triggerSpeak = false) {
    setConvHistory([])
    setAttempt(0)
    setNpcResponse(null)
    pendingAdvanceRef.current = false
    setLastFeedback(null)
    setLastCorrection(null)
    setLastGoalAchieved(false)
    setLastScore(null)
    setLastNaturalExpression(null)
    setLastPartialPass(false)
    setExpression('neutral')
    setSceneError(false)
    setCharError(false)
    // 다음 스텝 이동 시 NPC 즉시 발화 (false → true 토글로 useEffect 트리거)
    if (triggerSpeak) {
      setNpcReady(false)
      setTimeout(() => setNpcReady(true), 0)
    }
  }

  function handleNPCResponseEnd() {
    if (advancedRef.current) return
    advancedRef.current = true
    if (fallbackTimerRef.current) {
      clearTimeout(fallbackTimerRef.current)
      fallbackTimerRef.current = null
    }
    setNpcResponse(null)

    if (pendingAdvanceRef.current) {
      goNext(pendingScoreRef.current)
    } else {
      // Stay on same step — reset to main image and re-enable input
      setExpression('neutral')
      advancedRef.current = false
    }
  }

  function goNext(newScore: number) {
    if (!isLastStep) sfxAdvance()
    // 마지막 스텝이 아니면 다음 스텝 NPC 발화 트리거
    resetStepState(!isLastStep)
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
      const aiScore = data.score ?? 0
      const pts = aiScoreToGamePts(aiScore, data.goalAchieved ?? false)

      // Korean input: don't count as attempt, don't add to score
      if (data.isKoreanInput) {
        setLastFeedback(data.feedback ?? null)
        setLastCorrection(data.correction ?? null)
        setLastGoalAchieved(false)
        setLastScore(0)
        if (data.npcResponse) {
          pendingAdvanceRef.current = false
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
      setExpression(scoreToExpression(aiScore, data.goalAchieved ?? true))
      setLastFeedback(data.feedback ?? null)
      setLastCorrection(data.correction ?? null)
      setLastGoalAchieved(data.goalAchieved ?? false)
      setLastPartialPass(data.partialPass ?? false)
      setLastScore(aiScore)
      setLastNaturalExpression(data.naturalExpression ?? null)
      setAttempt(nextAttempt)

      // Update conversation history
      setConvHistory(prev => [
        ...prev,
        { role: 'user', content: userInput },
        ...(data.npcResponse ? [{ role: 'npc' as const, content: data.npcResponse }] : []),
      ])

      sfxForScore(aiScore)
      const reaction = getReaction(aiScore, data.goalAchieved ?? false)
      setScorePopup({ label: reaction.label, pts, color: reaction.color })
      setTimeout(() => setScorePopup(null), 1600)

      if (data.npcResponse) {
        pendingAdvanceRef.current = data.advanceToNext ?? false
        setNpcResponse(data.npcResponse)
        fallbackTimerRef.current = setTimeout(() => {
          fallbackTimerRef.current = null
          if (!advancedRef.current) {
            advancedRef.current = true
            setNpcResponse(null)
            if (pendingAdvanceRef.current) {
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
          <div className="absolute inset-0 z-50 flex flex-col">
            {/* 배경: 첫 번째 씬 이미지 */}
            <div className="absolute inset-0">
              {getSceneUrl(scenario.id, 1, 'neutral') && !sceneError ? (
                <>
                  <Image
                    src={getSceneUrl(scenario.id, 1, 'neutral')!}
                    alt={scenario.name}
                    fill
                    className="object-cover object-top"
                    onError={() => setSceneError(true)}
                    priority
                  />
                  <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.2) 30%, rgba(0,0,0,0.75) 65%, rgba(0,0,0,0.97) 100%)' }} />
                </>
              ) : (
                <div className={`absolute inset-0 bg-gradient-to-b ${fallbackGradient}`} />
              )}
            </div>

            {/* 상단 EXIT */}
            <div className="relative shrink-0 px-5 pt-5">
              <button
                onClick={() => router.push('/dashboard')}
                className="flex items-center gap-1.5 text-white/35 hover:text-white/75 transition-colors group"
              >
                <span className="text-sm group-hover:-translate-x-0.5 transition-transform">←</span>
                <span className="text-[11px] font-bold tracking-widest uppercase">EXIT</span>
              </button>
            </div>

            {/* 여백 (이미지가 보이도록) */}
            <div className="flex-1" />

            {/* 인트로 정보 카드 */}
            <div className="relative shrink-0 px-5 pb-8 space-y-4 animate-fade-in-up">
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
                  {NPC_PERSONALITY_KO[scenario.npc_name] ?? scenario.npc_personality}
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
                  // 2초 후 NPC 첫 발화 트리거
                  npcReadyTimerRef.current = setTimeout(() => setNpcReady(true), 2000)
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
              {/* 음소거 토글 */}
              <button
                onClick={toggleMute}
                className="flex items-center justify-center w-7 h-7 rounded-lg transition-all hover:bg-white/10 active:scale-95"
                style={{ color: muted ? 'rgba(248,113,113,0.8)' : 'rgba(255,255,255,0.35)' }}
                title={muted ? '음소거 해제' : '음소거'}
              >
                {muted ? (
                  // 음소거 아이콘
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
                  </svg>
                ) : (
                  // 스피커 아이콘
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>
                  </svg>
                )}
              </button>
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

          {/* 시도 횟수 도트 — wrong(0~29)이고 아직 retry 가능할 때만 표시 */}
          {attempt > 0 && !npcResponse && !lastGoalAchieved && !lastPartialPass && (
            <div className="flex items-center justify-center gap-2">
              {Array.from({ length: MAX_ATTEMPTS }, (_, i) => (
                <div
                  key={i}
                  className={`w-1.5 h-1.5 rounded-full transition-all ${
                    i < attempt   ? 'bg-red-400/50' :
                    i === attempt ? 'bg-amber-400 animate-pulse scale-110' :
                                    'bg-white/10'
                  }`}
                />
              ))}
              <span className="text-white/25 text-[10px] ml-1 tracking-wide">
                {attempt >= MAX_ATTEMPTS ? '마지막 시도' : `다시 시도 (${MAX_ATTEMPTS - attempt}번 남음)`}
              </span>
            </div>
          )}

          {/* 피드백 패널 */}
          {lastFeedback && !npcResponse && attempt > 0 && !lastGoalAchieved && (
            (() => {
              const isNiceTry = lastScore !== null && lastScore >= 30 && lastScore < 70
              const isWrong   = lastScore === 0 || lastScore === null
              return (
                <div className="rounded-xl px-4 py-2.5 space-y-2 animate-fade-in-up" style={{
                  background: isWrong ? 'rgba(239,68,68,0.07)' : 'rgba(245,158,11,0.07)',
                  border: `1px solid ${isWrong ? 'rgba(239,68,68,0.2)' : 'rgba(245,158,11,0.2)'}`,
                }}>
                  <p className={`text-[12px] leading-relaxed ${isWrong ? 'text-red-300/70' : 'text-amber-200/70'}`}>
                    {lastFeedback}
                  </p>
                  {lastCorrection && (
                    <p className={`text-[11px] font-medium ${isWrong ? 'text-red-400/60' : 'text-amber-400/70'}`}>
                      {lastCorrection}
                    </p>
                  )}
                  {/* Nice try → 재도전 or 넘어가기 선택 */}
                  {isNiceTry && attempt < MAX_ATTEMPTS && (
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => goNext(score)}
                        className="flex-1 py-2 rounded-lg text-[11px] font-bold tracking-wide transition-all text-white/30 hover:text-white/60 hover:bg-white/5 border border-white/8"
                      >
                        그냥 넘어갈게요 →
                      </button>
                    </div>
                  )}
                </div>
              )
            })()
          )}

          {/* 힌트 + 넘어가기 — 시도 모두 소진 & 완전 오답일 때 */}
          {attempt >= MAX_ATTEMPTS && !npcResponse && !lastGoalAchieved && lastScore === 0 && currentStep.hint_template && (
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


          {/* 추천 표현 — Good(aiScore 70~89)일 때 NPC 응답과 함께 표시 */}
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
              autoTranslate={difficulty === 'easy'}
              muted={muted}
              autoSpeak={npcReady}
              difficulty={difficulty}
            />
          ) : (
            <NPCDialogue
              npcName={scenario.npc_name}
              line={currentNpcLine}
              ttsText={currentStep.tts_text ?? currentNpcLine}
              autoTranslate={difficulty === 'easy'}
              muted={muted}
              autoSpeak={npcReady}
              difficulty={difficulty}
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
              easyKeywords={difficulty === 'easy' ? currentStep.expected_keywords : undefined}
              difficulty={difficulty}
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
