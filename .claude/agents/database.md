# Agent: Database (Schema, Seed, Types)

## 담당 영역
```
supabase/
  schema.sql                ← 테이블 정의 + RLS 정책
  seed.sql                  ← 시나리오/뱃지 초기 데이터

lib/
  scenarios/data.ts         ← 정적 시나리오 데이터 (타입 포함)
  types.ts                  ← 공유 TypeScript 타입 정의 (신규)
```

## 작업 규칙
- `app/` 코드 수정 금지 (Frontend / Backend agent 담당)
- `lib/types.ts` — 이 agent가 **단독 소유**, 다른 agent는 읽기만 가능
- RLS는 모든 테이블에 반드시 활성화
- 완료 시 `docs/database-log.md` 업데이트

## 의존성
- 없음 — 가장 먼저 실행 (다른 agent들이 이 결과물에 의존)
- **완료 즉시 Frontend / Backend agent에게 types.ts 경로 알림**

## 현재 테이블 구조 (schema.sql 기준)
```sql
-- 사용자 프로필
profiles (id, email, created_at)

-- 시나리오 진행도
user_progress (
  id, user_id, scenario_id,
  completed_at, score,
  mistake_step_ids text[]
)

-- 오답 기록
user_mistakes (
  id, user_id, scenario_id, step_id,
  user_input, correct_phrase,
  created_at
)
```

## Phase 3 추가 테이블
```sql
-- 뱃지 정의
badges (
  id text PRIMARY KEY,          -- 'first_clear', 'streak_7' 등
  name text NOT NULL,           -- '첫 클리어'
  description text,             -- '첫 번째 시나리오 완료'
  icon_emoji text,              -- '🏆'
  condition_type text,          -- 'scenario_count', 'streak_days', 'perfect_score'
  condition_value integer        -- 1, 7, 100 등
)

-- 사용자 뱃지 보유
user_badges (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  badge_id text REFERENCES badges(id),
  earned_at timestamptz DEFAULT now(),
  UNIQUE(user_id, badge_id)
)

-- 학습 스트릭
user_streaks (
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE PRIMARY KEY,
  current_streak integer DEFAULT 0,
  longest_streak integer DEFAULT 0,
  last_activity_date date
)
```

## RLS 정책 필수 적용
```sql
-- 모든 테이블 공통 패턴
ALTER TABLE [table] ENABLE ROW LEVEL SECURITY;

-- 본인 데이터만 읽기/쓰기
CREATE POLICY "[table]_select" ON [table]
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "[table]_insert" ON [table]
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- badges 테이블은 전체 읽기 허용 (공개 정의)
CREATE POLICY "badges_public_read" ON badges
  FOR SELECT USING (true);
```

## lib/types.ts — 공유 타입 정의 (다른 agent 참조용)
```typescript
// 이 파일은 Database agent가 작성, 다른 agent는 import만 가능

export interface Scenario {
  id: string
  title: string
  description: string
  location: 'restaurant' | 'airport' | 'hotel'
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  steps: ScenarioStep[]
}

export interface ScenarioStep {
  id: string
  npcText: string              // NPC 대사
  expectedPhrases: string[]    // 정답 후보
  hint?: string
  sceneImage?: string          // public/ 경로
}

export interface Badge {
  id: string
  name: string
  description: string
  iconEmoji: string
  conditionType: 'scenario_count' | 'streak_days' | 'perfect_score' | 'mistake_free'
  conditionValue: number
  earned?: boolean
  earnedAt?: string
}

export interface UserProgress {
  scenarioId: string
  completedAt: string
  score: number
  mistakeStepIds: string[]
}

export interface UserStreak {
  currentStreak: number
  longestStreak: number
  lastActivityDate: string
}
```

## seed.sql — 뱃지 초기 데이터 (Phase 3)
```sql
INSERT INTO badges (id, name, description, icon_emoji, condition_type, condition_value) VALUES
  ('first_clear',    '첫 클리어',     '첫 번째 시나리오 완료',      '🌟', 'scenario_count', 1),
  ('triple_clear',   '여행 준비 완료', '시나리오 3개 완료',          '🎒', 'scenario_count', 3),
  ('perfect_score',  '완벽한 영어',   '100점 달성',                 '💯', 'perfect_score',  100),
  ('streak_3',       '3일 연속',      '3일 연속 학습',              '🔥', 'streak_days',    3),
  ('streak_7',       '일주일 도전',   '7일 연속 학습',              '🗓️', 'streak_days',    7),
  ('mistake_free',   '실수 없음',     '시나리오를 오답 없이 완료',   '✨', 'mistake_free',   1);
```

## 산출물
- `supabase/schema.sql` (기존 + Phase 3 테이블 추가)
- `supabase/seed.sql` (기존 시나리오 + 뱃지 데이터)
- `lib/types.ts` (신규 — 공유 타입 정의)
- `lib/scenarios/data.ts` (시나리오 데이터 업데이트)
- `docs/database-log.md`
