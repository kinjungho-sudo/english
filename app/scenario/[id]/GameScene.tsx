'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import NPCDialogue from '@/components/NPCDialogue'
import UserInput from '@/components/UserInput'
import FeedbackPopup from '@/components/FeedbackPopup'
import ScoreBar from '@/components/ScoreBar'
import type { Scenario, DialogueStep, AIEvaluation } from '@/lib/scenarios/data'

type Props = {
  scenario: Scenario
  steps: DialogueStep[]
  userId: string
  mistakeStepIds: Set<string>
}

const SCENE_BACKGROUNDS: Record<string, string> = {
  '11111111-1111-1111-1111-111111111111': 'from-amber-950/40 via-orange-950/20 to-gray-950',
  '22222222-2222-2222-2222-222222222222': 'from-blue-950/40 via-sky-950/20 to-gray-950',
  '33333333-3333-3333-3333-333333333333': 'from-purple-950/40 via-violet-950/20 to-gray-950',
}

const NPC_COLORS: Record<string, string> = {
  SARAH: 'text-orange-300',
  MIKE:  'text-blue-300',
  EMMA:  'text-purple-300',
}

export default function GameScene({ scenario, steps, userId, mistakeStepIds }: Props) {
  const router = useRouter()

  // Reorder steps: mistake steps first (review mode)
  const orderedSteps = [
    ...steps.filter(s => mistakeStepIds.has(s.id)),
    ...steps.filter(s => !mistakeStepIds.has(s.id)),
  ]

  const [currentIndex, setCurrentIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [evaluation, setEvaluation] = useState<AIEvaluation | null>(null)
  const [loading, setLoading] = useState(false)
  const [retrying, setRetrying] = useState(false)
  const [completedStepIds, setCompletedStepIds] = useState<Set<string>>(new Set())

  const currentStep = orderedSteps[currentIndex]
  const isLastStep = currentIndex === orderedSteps.length - 1
  const bgGradient = SCENE_BACKGROUNDS[scenario.id] ?? 'from-gray-900 to-gray-950'
  const npcColor = NPC_COLORS[scenario.npc_name] ?? 'text-amber-300'

  const saveProgress = useCallback(async (stepsCompleted: number, totalScore: number, completed: boolean) => {
    await fetch('/api/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        scenarioId: scenario.id,
        stepsCompleted,
        totalScore,
        completed,
      }),
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

      // Add score
      const earned = data.score
      setScore(prev => prev + earned)

      // Track completed
      if (data.is_correct || !data.needs_retry) {
        setCompletedStepIds(prev => new Set([...prev, currentStep.id]))
      }
    } catch {
      setEvaluation({
        score: 50,
        is_correct: true,
        praise: "Good effort! Let's keep going.",
        correction: null,
        correct_expression: userInput,
        needs_retry: false,
      })
    }
    setLoading(false)
  }

  function handleNext() {
    setEvaluation(null)
    setRetrying(false)

    if (isLastStep) {
      // 완료 — progress 저장 후 결과 페이지
      saveProgress(orderedSteps.length, score, true)
      router.push(`/result/${scenario.id}?score=${score}&steps=${orderedSteps.length}`)
    } else {
      const nextIndex = currentIndex + 1
      setCurrentIndex(nextIndex)
      // 중간 진행 저장
      saveProgress(nextIndex, score, false)
    }
  }

  function handleRetry() {
    setEvaluation(null)
    setRetrying(true)
  }

  return (
    <div className={`min-h-screen bg-gradient-to-b ${bgGradient} flex flex-col`}>
      {/* Scene Header */}
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-center justify-between mb-1">
          <button
            onClick={() => router.push('/dashboard')}
            className="text-gray-600 hover:text-gray-400 text-sm transition-colors"
          >
            ← Exit
          </button>
          <div className="flex items-center gap-2">
            <span className="text-gray-600 text-sm">{scenario.thumbnail}</span>
            <span className="text-gray-500 text-sm font-medium">{scenario.name}</span>
          </div>
        </div>

        {/* Review badge */}
        {mistakeStepIds.has(currentStep?.id) && (
          <div className="mt-2 inline-flex items-center gap-1.5 bg-amber-900/30 border border-amber-800/50 rounded-full px-3 py-1">
            <span className="text-amber-400 text-xs">🔄</span>
            <span className="text-amber-400 text-xs font-medium">복습 중 — 이전에 틀렸던 표현</span>
          </div>
        )}
      </div>

      {/* NPC Character Area */}
      <div className="flex-1 flex flex-col justify-end px-5 pb-3 gap-4 max-w-2xl mx-auto w-full">
        {/* NPC Avatar */}
        <div className="text-center py-4">
          <div className="text-7xl mb-2">
            {scenario.npc_name === 'SARAH' ? '👩‍🍳' : scenario.npc_name === 'MIKE' ? '👨‍✈️' : '👩‍💼'}
          </div>
          <p className={`text-xs font-bold uppercase tracking-widest ${npcColor}`}>{scenario.npc_name}</p>
          <p className="text-gray-600 text-xs">{scenario.npc_personality}</p>
        </div>

        {/* NPC Dialogue */}
        <NPCDialogue
          npcName={scenario.npc_name}
          line={currentStep.npc_line}
          ttsText={currentStep.tts_text}
        />

        {/* User Input */}
        <UserInput
          hintTemplate={currentStep.hint_template}
          onSubmit={handleSubmit}
          loading={loading}
          disabled={!!evaluation && !retrying}
        />
      </div>

      {/* Score Bar */}
      <ScoreBar
        score={score}
        currentStep={currentIndex + 1}
        totalSteps={orderedSteps.length}
        scenarioName={scenario.name}
      />

      {/* Feedback Popup */}
      {evaluation && !retrying && (
        <FeedbackPopup
          evaluation={evaluation}
          onNext={handleNext}
          onRetry={handleRetry}
          isLastStep={isLastStep}
        />
      )}
    </div>
  )
}
