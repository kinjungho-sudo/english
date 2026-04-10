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

// ─── Restaurant: combined scene images (character + background) ─────────────
function getRestaurantScene(stepOrder: number, expression: Expression): string {
  // Expression state (after AI feedback) takes priority
  if (expression === 'happy' || expression === 'surprised') return 'order done'
  if (expression === 'thinking' || expression === 'sad')    return 'order mistake'

  // Neutral — pick by dialogue step context
  if (stepOrder >= 5) return 'cafe'          // bill / payment
  if (stepOrder === 4) return 'order change' // dietary / modification
  return 'order'                             // greeting + ordering (steps 1-3)
}

/**
 * Returns a combined scene image URL (character + background in one).
 * Returns null for scenarios that don't yet have scene images.
 */
export function getSceneUrl(
  scenarioId: string,
  stepOrder: number,
  expression: Expression,
): string | null {
  const slug = SCENARIO_SLUG[scenarioId]
  if (!slug) return null

  if (slug === 'restaurant') {
    const scene = getRestaurantScene(stepOrder, expression)
    return `/assets/restaurant/${encodeURIComponent(scene)}.png`
  }

  // Airport / Hotel: no combined scenes yet — fall back to gradient + emoji
  return null
}

// ─── Legacy helpers (kept for non-restaurant scenarios) ─────────────────────
export function getBackgroundUrl(scenarioId: string, variant = 'main') {
  const slug = SCENARIO_SLUG[scenarioId]
  if (!slug) return null
  return `/assets/${slug}/backgrounds/${variant}.png`
}

export function getCharacterUrl(
  scenarioId: string,
  npcName: string,
  expression: Expression = 'neutral',
) {
  const scenarioSlug = SCENARIO_SLUG[scenarioId]
  const npcSlug = NPC_SLUG[npcName]
  if (!scenarioSlug || !npcSlug) return null
  return `/assets/${scenarioSlug}/characters/${npcSlug}/expressions/${expression}.png`
}

// AI 평가 점수 → 표정 매핑
export function scoreToExpression(score: number, isCorrect: boolean): Expression {
  if (!isCorrect) return 'thinking'
  if (score >= 90) return 'happy'
  if (score >= 70) return 'neutral'
  return 'surprised'
}
