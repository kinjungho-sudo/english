# Agent: Frontend (UI/UX & Pages)

## 담당 영역
```
app/
  page.tsx                  ← 랜딩/로그인 페이지
  dashboard/page.tsx        ← 시나리오 목록, 복습 배너
  scenario/[id]/page.tsx    ← Visual Novel 게임 플레이
  result/[id]/page.tsx      ← 클리어 결과 + 오답 복습
  profile/page.tsx          ← 뱃지, 통계, 학습 기록
  layout.tsx
  globals.css

components/
  GameScene.tsx
  NPCDialogue.tsx
  UserInput.tsx
  FeedbackPopup.tsx
  ScoreBar.tsx
  BadgeCard.tsx             ← 신규 (Phase 3)
  StreakWidget.tsx          ← 신규 (Phase 3)
```

## 작업 규칙
- `lib/supabase/client.ts` — 읽기 전용, 수정 금지
- `lib/supabase/server.ts` — 읽기 전용, 수정 금지
- `app/api/` — 절대 수정 금지 (Backend agent 담당)
- `supabase/` — 절대 수정 금지 (Database agent 담당)
- `lib/scenarios/data.ts` — 읽기 전용 (타입 참조용)
- `lib/types.ts` — 읽기 전용 (Database agent가 먼저 정의)
- 완료 시 `docs/frontend-log.md` 업데이트

## 의존성 (시작 전 완료되어야 할 것)
1. **Database agent** — `lib/types.ts` 타입 정의 완료 필수
2. **Database agent** — `supabase/schema.sql` badges 테이블 확정 필수 (Phase 3)
3. Backend agent는 병렬 실행 가능 (API contract만 준수)

## Next.js 16 주의사항
- `node_modules/next/dist/docs/` 를 먼저 읽고 시작
- Server Component / Client Component 경계 명확히 구분
- `use client` 는 꼭 필요한 컴포넌트에만
- 이미지: `next/image` 사용, `<img>` 직접 사용 금지
- 라우팅: `next/navigation` (`useRouter`, `useParams`) 사용

## API 호출 규칙
```typescript
// 평가 API
POST /api/evaluate
Body: { userInput: string, expectedPhrases: string[], stepId: string, scenarioId: string }
Response: { score: number, feedback: string, isCorrect: boolean }

// 진행도 저장 API
POST /api/progress
Body: { scenarioId: string, stepId: string, isCorrect: boolean, mistakeStepIds: string[] }
Response: { success: boolean }
```

## Phase 2 작업 목록
- [ ] 공항/호텔 시나리오 씬 이미지 연결 (lib/scenarios/data.ts 참조)
- [ ] 대시보드 복습 배너 미완성 케이스 처리

## Phase 3 작업 목록
- [ ] `/profile` 페이지 — 뱃지 그리드, 학습 통계, 스트릭
- [ ] `BadgeCard` 컴포넌트 — 잠금/해금 상태 시각화
- [ ] `StreakWidget` 컴포넌트 — 연속 학습일 표시
- [ ] 대시보드에 스트릭 위젯 추가

## 산출물
- 모든 페이지 컴포넌트 (app/ 하위)
- UI 컴포넌트 (components/ 하위)
- `docs/frontend-log.md`
