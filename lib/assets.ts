// 시나리오 ID → 에셋 슬러그 매핑
export const SCENARIO_SLUG: Record<string, string> = {
  '11111111-1111-1111-1111-111111111111': 'restaurant',
  '22222222-2222-2222-2222-222222222222': 'airport',
  '33333333-3333-3333-3333-333333333333': 'hotel',
}

export const NPC_SLUG: Record<string, string> = {
  SARAH: 'sarah',
  MIKE:  'mike',
  EMMA:  'emma',
}

export type Expression = 'neutral' | 'happy' | 'surprised' | 'thinking' | 'sad'
export type Motion = 'greeting' | 'waiting' | 'explaining' | 'approving' | 'writing'

export function getBackgroundUrl(scenarioId: string, variant = 'main') {
  const slug = SCENARIO_SLUG[scenarioId]
  if (!slug) return null
  return `/assets/${slug}/backgrounds/${variant}.png`
}

export function getCharacterUrl(scenarioId: string, npcName: string, expression: Expression = 'neutral') {
  const scenarioSlug = SCENARIO_SLUG[scenarioId]
  const npcSlug = NPC_SLUG[npcName]
  if (!scenarioSlug || !npcSlug) return null
  return `/assets/${scenarioSlug}/characters/${npcSlug}/expressions/${expression}.png`
}

export function getMotionUrl(scenarioId: string, npcName: string, motion: Motion) {
  const scenarioSlug = SCENARIO_SLUG[scenarioId]
  const npcSlug = NPC_SLUG[npcName]
  if (!scenarioSlug || !npcSlug) return null
  return `/assets/${scenarioSlug}/characters/${npcSlug}/motions/${motion}.png`
}

// AI 평가 점수 → 표정 매핑
export function scoreToExpression(score: number, isCorrect: boolean): Expression {
  if (!isCorrect) return 'thinking'
  if (score >= 90) return 'happy'
  if (score >= 70) return 'neutral'
  return 'surprised'
}
