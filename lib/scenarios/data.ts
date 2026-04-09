export type Scenario = {
  id: string
  name: string
  location: string
  npc_name: string
  npc_personality: string
  thumbnail: string
  order_index: number
}

export type DialogueStep = {
  id: string
  scenario_id: string
  step_order: number
  npc_line: string
  hint_template: string | null
  expected_keywords: string[]
  tts_text: string | null
}

export type UserMistake = {
  id: string
  user_id: string
  scenario_id: string
  step_id: string
  wrong_input: string
  correct_expression: string
  context: string | null
  mistake_count: number
  mastered_at: string | null
  created_at: string
  updated_at: string
}

export type UserProgress = {
  id: string
  user_id: string
  scenario_id: string
  completed_at: string | null
  total_score: number
  steps_completed: number
}

export type AIEvaluation = {
  score: number
  is_correct: boolean
  praise: string
  correction: string | null
  correct_expression: string
  needs_retry: boolean
}

// Fallback static data (used when DB is unavailable)
export const STATIC_SCENARIOS: Scenario[] = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'Restaurant',
    location: 'A bustling restaurant in New York City',
    npc_name: 'SARAH',
    npc_personality: 'Friendly and energetic waitress',
    thumbnail: '🍽️',
    order_index: 1,
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    name: 'Airport Check-in',
    location: 'JFK International Airport check-in counter',
    npc_name: 'MIKE',
    npc_personality: 'Professional and efficient airline staff',
    thumbnail: '✈️',
    order_index: 2,
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    name: 'Hotel Check-in',
    location: 'Manhattan luxury hotel front desk',
    npc_name: 'EMMA',
    npc_personality: 'Elegant and attentive hotel concierge',
    thumbnail: '🏨',
    order_index: 3,
  },
]
