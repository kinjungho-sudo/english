-- AI Travel English RPG — Database Schema
-- Run this in Supabase SQL Editor

-- scenarios table
CREATE TABLE IF NOT EXISTS scenarios (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  location      TEXT NOT NULL,
  npc_name      TEXT NOT NULL,
  npc_personality TEXT NOT NULL,
  thumbnail     TEXT,
  order_index   INT NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- dialogue_steps table
CREATE TABLE IF NOT EXISTS dialogue_steps (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_id        UUID NOT NULL REFERENCES scenarios(id) ON DELETE CASCADE,
  step_order         INT NOT NULL,
  npc_line           TEXT NOT NULL,
  hint_template      TEXT,
  expected_keywords  TEXT[] NOT NULL DEFAULT '{}',
  tts_text           TEXT,
  created_at         TIMESTAMPTZ DEFAULT NOW()
);

-- user_progress table
CREATE TABLE IF NOT EXISTS user_progress (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scenario_id     UUID NOT NULL REFERENCES scenarios(id) ON DELETE CASCADE,
  completed_at    TIMESTAMPTZ,
  total_score     INT DEFAULT 0,
  steps_completed INT DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, scenario_id)
);

-- user_mistakes table
CREATE TABLE IF NOT EXISTS user_mistakes (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scenario_id         UUID NOT NULL REFERENCES scenarios(id) ON DELETE CASCADE,
  step_id             UUID NOT NULL REFERENCES dialogue_steps(id) ON DELETE CASCADE,
  wrong_input         TEXT NOT NULL,
  correct_expression  TEXT NOT NULL,
  context             TEXT,
  mistake_count       INT DEFAULT 1,
  mastered_at         TIMESTAMPTZ,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- RLS 활성화
ALTER TABLE scenarios        ENABLE ROW LEVEL SECURITY;
ALTER TABLE dialogue_steps   ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress    ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_mistakes    ENABLE ROW LEVEL SECURITY;

-- scenarios / dialogue_steps: 모든 인증 유저 읽기 가능
CREATE POLICY "authenticated users can read scenarios"
  ON scenarios FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "authenticated users can read dialogue_steps"
  ON dialogue_steps FOR SELECT
  TO authenticated
  USING (true);

-- user_progress: 본인 데이터만
CREATE POLICY "users manage own progress"
  ON user_progress FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- user_mistakes: 본인 데이터만
CREATE POLICY "users manage own mistakes"
  ON user_mistakes FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
