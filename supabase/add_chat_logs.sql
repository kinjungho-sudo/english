-- ─── chat_logs table ────────────────────────────────────────────────────────
-- AI 대화 로그 저장: 모든 /api/chat 요청의 입출력 기록

CREATE TABLE IF NOT EXISTS chat_logs (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  scenario_id       UUID REFERENCES scenarios(id) ON DELETE SET NULL,
  step_id           UUID REFERENCES dialogue_steps(id) ON DELETE SET NULL,

  -- 입력
  user_input        TEXT NOT NULL,
  attempt           INT NOT NULL DEFAULT 1,
  difficulty        TEXT NOT NULL DEFAULT 'normal',
  keyword_used      BOOLEAN NOT NULL DEFAULT FALSE,

  -- 출력
  goal_achieved     BOOLEAN NOT NULL DEFAULT FALSE,
  score             INT NOT NULL DEFAULT 0,
  npc_response      TEXT,
  feedback          TEXT,
  correction        TEXT,
  natural_expression TEXT,
  advance_to_next   BOOLEAN NOT NULL DEFAULT FALSE,

  -- 메타
  model             TEXT DEFAULT 'claude-haiku-4-5-20251001',
  is_korean_input   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS chat_logs_user_id_idx ON chat_logs(user_id);
CREATE INDEX IF NOT EXISTS chat_logs_scenario_id_idx ON chat_logs(scenario_id);
CREATE INDEX IF NOT EXISTS chat_logs_created_at_idx ON chat_logs(created_at DESC);

-- RLS: 관리자 전용 (일반 유저는 자기 로그만 읽기)
ALTER TABLE chat_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own logs"
  ON chat_logs FOR SELECT
  USING (auth.uid() = user_id);

-- 서비스 역할 키로만 INSERT (API 서버에서만 삽입)
CREATE POLICY "Service role can insert logs"
  ON chat_logs FOR INSERT
  WITH CHECK (TRUE);
