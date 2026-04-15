-- ─── chat_logs table ────────────────────────────────────────────────────────
-- AI 대화 로그 저장: 모든 /api/chat 요청의 입출력 기록
-- FK 없이 UUID만 저장 (시나리오/스텝 삭제 시에도 로그 보존)

CREATE TABLE IF NOT EXISTS chat_logs (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID,
  scenario_id       UUID,
  step_id           UUID,

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

-- RLS
ALTER TABLE chat_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own logs"
  ON chat_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert logs"
  ON chat_logs FOR INSERT
  WITH CHECK (TRUE);
