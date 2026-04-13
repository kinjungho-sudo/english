'use client'

import { useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import NPCDialogue from '@/components/NPCDialogue'
import UserInput from '@/components/UserInput'
import { getSceneUrl, getCharacterUrl, scoreToExpression } from '@/lib/assets'
import type { Scenario, DialogueStep } from '@/lib/scenarios/data'
import type { Expression } from '@/lib/assets'
import type { ChatMessage } from '@/app/api/chat/route'

type Props = {
  scenario: Scenario
  steps: DialogueStep[]
  userId: string
  mistakeStepIds: Set<string>
  characterName?: string
  avatarEmoji?: string
}

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

const MAX_ATTEMPTS = 3

function getReaction(pts: number): { label: string; color: string } | null {
  if (pts >= 90) return { label: 'Perfect! ✨', color: '#f59e0b' }
  if (pts >= 70) return { label: 'Great! 👍',   color: '#34d399' }
  return null
}

export default function GameScene({ scenario, steps, userId, mistakeStepIds, characterName, avatarEmoji }: Props) {
  void userId
  const router = useRouter()

  const orderedSteps = [
    ...steps.filter(s => mistakeStepIds.has(s.id)),
    ...steps.filter(s => !mistakeStepIds.has(s.id)),
  ]

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
  const [scorePopup, setScorePopup] = useState<{ label: string; pts: number; color: string } | null>(null)

  const pendingScoreRef = useRef(0)
  const fallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const advancedRef = useRef(false)

  const currentStep = orderedSteps[currentIndex]
  const isLastStep = currentIndex === orderedSteps.length - 1
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
      // Stay on same step — re-enable input by resetting advancedRef
      advancedRef.current = false
    }
  }

  function goNext(newScore: number) {
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
        }),
      })

      const data = await res.json()
      const pts = data.score ?? 50
      const newScore = score + pts
      setScore(newScore)
      pendingScoreRef.current = newScore
      setExpression(scoreToExpression(pts, data.goalAchieved ?? true))
      setLastFeedback(data.feedback ?? null)
      setLastCorrection(data.correction ?? null)
      setLastGoalAchieved(data.goalAchieved ?? false)
      setLastScore(pts)
      setAttempt(nextAttempt)

      // Update conversation history
      setConvHistory(prev => [
        ...prev,
        { role: 'user', content: userInput },
        ...(data.npcResponse ? [{ role: 'npc' as const, content: data.npcResponse }] : []),
      ])

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

            <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-sm border border-white/10 rounded-full px-3 py-1.5">
              <span className="text-amber-400 text-[11px] leading-none">★</span>
              <span className="text-white/85 text-[11px] font-bold tabular-nums leading-none">{score}</span>
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
              line={currentStep.npc_line}
              ttsText={currentStep.tts_text}
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

      </div>
    </div>
  )
}
