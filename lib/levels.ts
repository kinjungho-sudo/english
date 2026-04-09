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
  { level: 1,  title: 'Nervous Tourist',      emoji: '🌍', minXP: 0     },
  { level: 2,  title: 'Curious Traveler',      emoji: '✈️', minXP: 500   },
  { level: 3,  title: 'Confident Explorer',    emoji: '🗺️', minXP: 1200  },
  { level: 4,  title: 'Seasoned Adventurer',   emoji: '🎒', minXP: 2500  },
  { level: 5,  title: 'Language Nomad',        emoji: '🌐', minXP: 4500  },
  { level: 6,  title: 'Cultural Ambassador',   emoji: '🏆', minXP: 7000  },
  { level: 7,  title: 'Global Citizen',        emoji: '⭐', minXP: 10000 },
  { level: 8,  title: 'Master Linguist',       emoji: '👑', minXP: 14000 },
  { level: 9,  title: 'World Wanderer',        emoji: '🌟', minXP: 19000 },
  { level: 10, title: 'Legendary Traveler',    emoji: '🎯', minXP: 25000 },
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
