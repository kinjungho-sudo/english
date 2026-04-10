'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import NPCDialogue from '@/components/NPCDialogue'
import UserInput from '@/components/UserInput'
import FeedbackPopup from '@/components/FeedbackPopup'
import ScoreBar from '@/components/ScoreBar'
import { getSceneUrl, getCharacterUrl, scoreToExpression } from '@/lib/assets'
import type { Scenario, DialogueStep, AIEvaluation } from '@/lib/scenarios/data'
import type { Expression } from '@/lib/assets'

type Props = {
  scenario: Scenario
  steps: DialogueStep[]
  userId: string
  mistakeStepIds: Set<string>
}

const SCENE_GRADIENTS: Record<string, string> = {
  '11111111-1111-1111-1111-111111111111': 'from-amber-950/60 via-orange-950/30 to-gray-950',
  '22222222-2222-2222-2222-222222222222': 'from-blue-950/60 via-sky-950/30 to-gray-950',
  '33333333-3333-3333-3333-333333333333': 'from-purple-950/60 via-violet-950/30 to-gray-950',
}

const NPC_COLORS: Record<string, string> = {
  SARAH: 'text-orange-300',
  MIKE:  'text-blue-300',
  EMMA:  'text-purple-300',
}

const NPC_EMOJI: Record<string, string> = {
  SARAH: '👩‍🍳',
  MIKE:  '👨‍✈️',
  EMMA:  '👩‍💼',
}

export default function GameScene({ scenario, steps, userId, mistakeStepIds }: Props) {
  const router = useRouter()

  const orderedSteps = [
    ...steps.filter(s => mistakeStepIds.has(s.id)),
    ...steps.filter(s => !mistakeStepIds.has(s.id)),
  ]

  const [currentIndex, setCurrentIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [evaluation, setEvaluation] = useState<AIEvaluation | null>(null)
  const [loading, setLoading] = useState(false)
  const [retrying, setRetrying] = useState(false)
  const [expression, setExpression] = useState<Expression>('neutral')
  const [sceneError, setSceneError] = useState(false)
  const [charError, setCharError] = useState(false)

  const currentStep = orderedSteps[currentIndex]
  const isLastStep = currentIndex === orderedSteps.length - 1
  const bgGradient = SCENE_GRADIENTS[scenario.id] ?? 'from-gray-900 to-gray-950'
  const npcColor = NPC_COLORS[scenario.npc_name] ?? 'text-amber-300'

  // Combined scene image (character + background in one illustration)
  const sceneUrl = getSceneUrl(scenario.id, currentStep?.step_order ?? 1, expression)
  // Fallback character image for scenarios without combined scenes
  const charUrl = !sceneUrl ? getCharacterUrl(scenario.id, scenario.npc_name, expression) : null

  const saveProgress = useCallback(async (stepsCompleted: number, totalScore: number, completed: boolean) => {
    await fetch('/api/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenarioId: scenario.id, stepsCompleted, totalScore, completed }),
    })
  }, [scenario.id])

  async function handleSubmit(userInput: string) {
    setLoading(true)
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
      const data: AIEvaluation = await res.json()
      setEvaluation(data)
      setScore(prev => prev + data.score)
      setExpression(scoreToExpression(data.score, data.is_correct))
      setSceneError(false)
      setCharError(false)
    } catch {
      setEvaluation({
        score: 50, is_correct: true,
        praise: "Good effort! Let's keep going.",
        correction: null, correct_expression: userInput, needs_retry: false,
      })
    }
    setLoading(false)
  }

  function handleNext() {
    setEvaluation(null)
    setRetrying(false)
    setExpression('neutral')
    setSceneError(false)
    setCharError(false)
    if (isLastStep) {
      saveProgress(orderedSteps.length, score, true)
      router.push(`/result/${scenario.id}?score=${score}&steps=${orderedSteps.length}`)
    } else {
      const nextIndex = currentIndex + 1
      setCurrentIndex(nextIndex)
      saveProgress(nextIndex, score, false)
    }
  }

  function handleRetry() {
    setEvaluation(null)
    setRetrying(true)
  }

  return (
    <div className="game-wrap" style={{ background: '#000' }}>
      <div className={`game-card bg-gradient-to-b ${bgGradient}`}>

        {/* ── Header ── */}
        <div className="relative z-10 shrink-0 px-5 pt-4 pb-2">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push('/dashboard')}
              className="text-gray-500 hover:text-gray-300 text-sm transition-colors"
            >
              ← Exit
            </button>
            <div className="flex items-center gap-2">
              <span className="text-gray-600 text-sm">{scenario.thumbnail}</span>
              <span className="text-gray-400 text-sm font-medium">{scenario.name}</span>
            </div>
          </div>
          {mistakeStepIds.has(currentStep?.id) && (
            <div className="mt-2 inline-flex items-center gap-1.5 bg-amber-900/30 border border-amber-800/50 rounded-full px-3 py-1">
              <span className="text-amber-400 text-xs">🔄</span>
              <span className="text-amber-400 text-xs font-medium">복습 중 — 이전에 틀렸던 표현</span>
            </div>
          )}
        </div>

        {/* ── Scene Image ── */}
        <div className="relative shrink-0 z-10" style={{ height: '260px' }}>
          {sceneUrl && !sceneError ? (
            <>
              <Image
                src={sceneUrl}
                alt={scenario.npc_name}
                fill
                className="object-cover object-top transition-opacity duration-300"
                onError={() => setSceneError(true)}
                priority
              />
              {/* Bottom fade so dialogue area blends in */}
              <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/10 to-transparent" />
              {/* NPC label overlay */}
              <div className="absolute bottom-3 left-5 z-10">
                <p className={`text-xs font-bold uppercase tracking-widest ${npcColor}`}>
                  {scenario.npc_name}
                </p>
              </div>
            </>
          ) : charUrl && !charError ? (
            // Fallback: separate character image
            <div className="flex flex-col items-center justify-center h-full">
              <Image
                src={charUrl}
                alt={scenario.npc_name}
                width={160}
                height={240}
                className="object-contain drop-shadow-2xl"
                onError={() => setCharError(true)}
              />
              <p className={`text-xs font-bold uppercase tracking-widest mt-2 ${npcColor}`}>
                {scenario.npc_name}
              </p>
            </div>
          ) : (
            // Fallback: emoji
            <div className="flex flex-col items-center justify-center h-full">
              <div className="text-7xl mb-2">{NPC_EMOJI[scenario.npc_name] ?? '🧑'}</div>
              <p className={`text-xs font-bold uppercase tracking-widest ${npcColor}`}>
                {scenario.npc_name}
              </p>
              <p className="text-gray-600 text-xs">{scenario.npc_personality}</p>
            </div>
          )}
        </div>

        {/* ── Dialogue + Input ── */}
        <div className="relative z-10 flex-1 overflow-y-auto px-5 pt-2 pb-3 flex flex-col gap-3">
          <NPCDialogue
            npcName={scenario.npc_name}
            line={currentStep.npc_line}
            ttsText={currentStep.tts_text}
          />
          <UserInput
            hintTemplate={currentStep.hint_template}
            onSubmit={handleSubmit}
            loading={loading}
            disabled={!!evaluation && !retrying}
          />
        </div>

        {/* ── Score Bar ── */}
        <div className="relative z-10 shrink-0">
          <ScoreBar
            score={score}
            currentStep={currentIndex + 1}
            totalSteps={orderedSteps.length}
            scenarioName={scenario.name}
          />
        </div>

        {evaluation && !retrying && (
          <FeedbackPopup
            evaluation={evaluation}
            onNext={handleNext}
            onRetry={handleRetry}
            isLastStep={isLastStep}
          />
        )}
      </div>
    </div>
  )
}
