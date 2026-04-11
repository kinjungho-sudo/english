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
    <div className="absolute inset-0 z-50 flex flex-col justify-end bg-black/55 backdrop-blur-[2px]">
      <div className="animate-result-slide">

        {/* 점수 헤더 */}
        <div className={`px-6 pt-6 pb-5 ${
          is_correct
            ? 'bg-gradient-to-b from-green-950/95 to-black/98'
            : 'bg-gradient-to-b from-red-950/90 to-black/98'
        }`}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className={`text-[10px] font-black tracking-[0.2em] uppercase mb-2 ${
                is_correct ? 'text-green-400' : 'text-red-400'
              }`}>
                {is_correct ? '✓  CORRECT' : '✕  INCORRECT'}
              </p>
              <p className="text-white/65 text-sm leading-relaxed">{praise}</p>
            </div>
            <div className={`text-6xl font-black tabular-nums shrink-0 leading-none animate-score-pop ${
              is_correct ? 'text-green-400' : 'text-red-400'
            }`}>
              {score}
            </div>
          </div>
        </div>

        {/* 교정 표현 */}
        {correction && (
          <div className="px-6 py-4 bg-black border-t border-white/5">
            <p className="text-[10px] text-blue-400/60 font-black tracking-[0.15em] uppercase mb-2">
              더 자연스러운 표현
            </p>
            <p className="text-white/45 text-[13px] leading-relaxed mb-1.5">{correction}</p>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-white/20">→</span>
              <p className="text-blue-300/90 text-[14px] font-medium">"{correct_expression}"</p>
            </div>
          </div>
        )}

        {/* 액션 버튼 */}
        <div className="px-5 py-4 bg-black border-t border-white/5">
          {needs_retry ? (
            <button
              onClick={onRetry}
              className="w-full py-4 rounded-2xl text-sm font-black tracking-widest uppercase transition-all
                bg-amber-500 hover:bg-amber-400 text-black
                hover:scale-[1.02] active:scale-[0.98]"
            >
              다시 시도 →
            </button>
          ) : (
            <button
              onClick={onNext}
              className={`w-full py-4 rounded-2xl text-sm font-black tracking-widest uppercase transition-all
                hover:scale-[1.02] active:scale-[0.98] ${
                is_correct
                  ? 'bg-green-500 hover:bg-green-400 text-black'
                  : 'bg-white/10 hover:bg-white/15 text-white/80 border border-white/10'
              }`}
            >
              {isLastStep ? '결과 보기 →' : '다음 장면 →'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
