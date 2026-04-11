'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import NPCDialogue from '@/components/NPCDialogue'
import UserInput from '@/components/UserInput'
import { getSceneUrl, getCharacterUrl, scoreToExpression } from '@/lib/assets'
import type { Scenario, DialogueStep } from '@/lib/scenarios/data'
import type { Expression } from '@/lib/assets'

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
}

const NPC_EMOJI: Record<string, string> = {
  SARAH: '👩‍🍳',
  MIKE:  '👨‍✈️',
  EMMA:  '👩‍💼',
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

  function goNext(newScore: number) {
    setExpression('neutral')
    setSceneError(false)
    setCharError(false)
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
    let newScore = score
    try {
      const res = await fetch('/api/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userInput,
          npcLine: currentStep.npc_line,
          hintTemplate: currentStep.hint_template,
          expectedKeywords: currentStep.expected_keywords,
          stepId: currentStep.id,
          scenarioId: scenario.id,
        }),
      })
      const data = await res.json()
      newScore = score + (data.score ?? 50)
      setScore(newScore)
      setExpression(scoreToExpression(data.score ?? 50, data.is_correct ?? true))
      setSceneError(false)
      setCharError(false)
    } catch {
      newScore = score + 50
      setScore(newScore)
    }
    setLoading(false)
    setTimeout(() => goNext(newScore), 900)
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
              {/* 상단: HUD 가독성 */}
              <div className="absolute inset-x-0 top-0 h-32"
                style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.65), transparent)' }} />
              {/* 하단: 대사 박스 가독성 */}
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

        {/* ── 상단 HUD ── */}
        <div className="relative z-10 shrink-0 px-5 pt-5 pb-2">
          <div className="flex items-center justify-between gap-3">

            {/* 나가기 버튼 */}
            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center gap-1.5 text-white/35 hover:text-white/75 transition-colors group"
            >
              <span className="text-sm group-hover:-translate-x-0.5 transition-transform">←</span>
              <span className="text-[11px] font-bold tracking-widest uppercase">EXIT</span>
            </button>

            {/* 진행도 세그먼트 바 */}
            <div className="flex items-center gap-[3px]">
              {orderedSteps.map((_, i) => (
                <div
                  key={i}
                  className={`progress-seg ${i < currentIndex ? 'done' : i === currentIndex ? 'active' : ''}`}
                />
              ))}
            </div>

            {/* 점수 배지 */}
            <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-sm border border-white/10 rounded-full px-3 py-1.5">
              <span className="text-amber-400 text-[11px] leading-none">★</span>
              <span className="text-white/85 text-[11px] font-bold tabular-nums leading-none">{score}</span>
            </div>
          </div>

          {/* 복습 뱃지 */}
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
          <NPCDialogue
            npcName={scenario.npc_name}
            line={currentStep.npc_line}
            ttsText={currentStep.tts_text}
          />
          <UserInput
            hintTemplate={currentStep.hint_template}
            onSubmit={handleSubmit}
            loading={loading}
            disabled={loading}
            characterName={characterName}
            avatarEmoji={avatarEmoji}
          />
        </div>

      </div>
    </div>
  )
}
