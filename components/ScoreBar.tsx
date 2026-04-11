type Props = {
  score: number
  currentStep: number
  totalSteps: number
  scenarioName: string
}

export default function ScoreBar({ score, currentStep, totalSteps, scenarioName }: Props) {
  return (
    <div className="bg-gray-900/80 border-t border-gray-800/50 px-5 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <span className="text-amber-400 font-bold text-sm">⭐ {score}점</span>
        <span className="text-gray-700">·</span>
        <span className="text-gray-500 text-xs">{scenarioName}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-gray-500 text-xs">{currentStep}/{totalSteps} 단계</span>
        <div className="flex gap-1">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-colors ${
                i < currentStep ? 'bg-amber-500' : i === currentStep ? 'bg-amber-500/50 animate-pulse' : 'bg-gray-700'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
