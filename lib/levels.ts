export type LevelInfo = {
  level: number
  title: string
  emoji: string
  minXP: number
  xp: number
  nextLevel: { level: number; minXP: number } | null
  progress: number // 0-100 percentage to next level
}

const LEVELS = [
  { level: 1,  title: '첫 발걸음',      emoji: '🌍', minXP: 0     },
  { level: 2,  title: '호기심 여행자',  emoji: '✈️', minXP: 500   },
  { level: 3,  title: '당당한 탐험가',  emoji: '🗺️', minXP: 1200  },
  { level: 4,  title: '베테랑 여행자',  emoji: '🎒', minXP: 2500  },
  { level: 5,  title: '언어 유목민',    emoji: '🌐', minXP: 4500  },
  { level: 6,  title: '문화 대사',      emoji: '🏆', minXP: 7000  },
  { level: 7,  title: '세계 시민',      emoji: '⭐', minXP: 10000 },
  { level: 8,  title: '언어 마스터',    emoji: '👑', minXP: 14000 },
  { level: 9,  title: '세계 방랑자',    emoji: '🌟', minXP: 19000 },
  { level: 10, title: '전설의 여행자',  emoji: '🎯', minXP: 25000 },
]

export function calculateXP(totalScore: number, masteredCount: number, completedCount: number) {
  return totalScore + masteredCount * 100 + completedCount * 200
}

export function getLevelInfo(xp: number): LevelInfo {
  let current = LEVELS[0]
  for (const l of LEVELS) {
    if (xp >= l.minXP) current = l
    else break
  }
  const nextIdx = LEVELS.findIndex(l => l.level === current.level) + 1
  const next = nextIdx < LEVELS.length ? LEVELS[nextIdx] : null
  const progress = next
    ? Math.round(((xp - current.minXP) / (next.minXP - current.minXP)) * 100)
    : 100
  return { ...current, xp, nextLevel: next, progress }
}

export { LEVELS }
