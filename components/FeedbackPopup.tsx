'use client'

import type { AIEvaluation } from '@/lib/scenarios/data'

type Props = {
  evaluation: AIEvaluation
  onNext: () => void
  onRetry: () => void
  isLastStep: boolean
}

export default function FeedbackPopup({ evaluation, onNext, onRetry, isLastStep }: Props) {
  const { score, is_correct, praise, correction, correct_expression, needs_retry } = evaluation

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in-up">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
        {/* Score */}
        <div className="flex items-center justify-between mb-4">
          <div className={`text-4xl font-black animate-score-pop ${is_correct ? 'text-green-400' : 'text-amber-400'}`}>
            {score}
            <span className="text-lg font-normal text-gray-500">pts</span>
          </div>
          <div className={`px-3 py-1 rounded-full text-xs font-bold border ${
            is_correct
              ? 'bg-green-900/30 text-green-400 border-green-800'
              : 'bg-amber-900/30 text-amber-400 border-amber-800'
          }`}>
            {is_correct ? '✓ Correct!' : '△ Almost!'}
          </div>
        </div>

        {/* Praise */}
        <div className="bg-gray-800 rounded-xl p-4 mb-4">
          <p className="text-white text-sm leading-relaxed">{praise}</p>
        </div>

        {/* Correction */}
        {correction && (
          <div className="bg-blue-900/20 border border-blue-800/40 rounded-xl p-4 mb-4">
            <p className="text-xs text-blue-400 font-bold uppercase tracking-wider mb-2">더 자연스러운 표현</p>
            <p className="text-blue-200 text-sm leading-relaxed">{correction}</p>
            <p className="text-blue-300 font-medium text-sm mt-2">"{correct_expression}"</p>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2">
          {needs_retry ? (
            <button
              onClick={onRetry}
              className="flex-1 bg-amber-500 hover:bg-amber-400 text-gray-950 font-bold rounded-xl py-3 transition-colors"
            >
              다시 시도 →
            </button>
          ) : (
            <button
              onClick={onNext}
              className="flex-1 bg-amber-500 hover:bg-amber-400 text-gray-950 font-bold rounded-xl py-3 transition-colors"
            >
              {isLastStep ? '완료! 결과 보기 🎉' : '다음 단계 →'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
