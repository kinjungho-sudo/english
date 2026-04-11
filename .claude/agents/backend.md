# Agent: Backend (API Routes & Server Logic)

## 담당 영역
```
app/api/
  evaluate/route.ts         ← Anthropic AI 답변 평가
  progress/route.ts         ← 진행도 저장
  auth/callback/route.ts    ← Supabase 인증 콜백
  badges/route.ts           ← 신규 (Phase 3) 뱃지 지급/조회

lib/
  supabase/server.ts        ← 서버사이드 Supabase 클라이언트

proxy.ts                    ← Next.js 16 미들웨어 (함수명 반드시 `proxy`)
```

## 작업 규칙
- **ANTHROPIC_API_KEY** — 서버사이드 전용, 클라이언트 노출 절대 금지
- **SUPABASE_SERVICE_ROLE_KEY** — 서버사이드 전용
- `app/` 페이지 컴포넌트 수정 금지 (Frontend agent 담당)
- `supabase/` 스키마 파일 수정 금지 (Database agent 담당)
- `lib/types.ts` — 읽기 전용 (Database agent가 먼저 정의)
- 모든 API route는 입력값 서버사이드 검증 필수
- 완료 시 `docs/backend-log.md` 업데이트

## 의존성
- 없음 — 독립 실행 가능
- Database agent와 병렬 실행 가능
- Frontend agent와 병렬 실행 가능 (API contract는 이 파일의 스펙을 기준으로)

## Next.js 16 API Route 규칙
```typescript
// app/api/*/route.ts 형식 — pages/api/ 방식 사용 금지
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  // ...
  return NextResponse.json({ ... })
}
```

## proxy.ts 주의사항 (Next.js 16 breaking change)
```typescript
// proxy.ts (루트 위치)
// 함수명은 반드시 `proxy` — `middleware` 아님
export async function proxy(request: NextRequest) { ... }
export const config = { matcher: [...] }
```

## AI 평가 API 스펙 (evaluate/route.ts)
```
POST /api/evaluate
Content-Type: application/json

Request:
{
  userInput: string           // 사용자 입력 문장
  expectedPhrases: string[]   // 정답 후보 문장들
  stepId: string              // 현재 스텝 ID
  scenarioId: string          // 시나리오 ID
}

Response (200):
{
  score: number               // 0-100
  feedback: string            // AI 피드백 (한국어)
  isCorrect: boolean          // 70점 이상이면 true
  correctedSentence?: string  // 교정된 문장 (오답일 때)
}

Response (400): { error: string }
Response (500): { error: string }
```

## 진행도 API 스펙 (progress/route.ts)
```
POST /api/progress
Content-Type: application/json

Request:
{
  scenarioId: string
  stepId: string
  isCorrect: boolean
  mistakeStepIds: string[]    // 틀린 스텝들 누적
}

Response (200): { success: boolean }
```

## 뱃지 API 스펙 — Phase 3 신규 (badges/route.ts)
```
POST /api/badges/check
Body: { userId: string, completedScenarios: string[] }
Response: { newBadges: Badge[], allBadges: Badge[] }

GET /api/badges?userId=xxx
Response: { badges: Badge[] }
```

## 사용 모델
- 평가: `claude-haiku-4-5-20251001` (속도 우선)
- 상세 피드백 필요 시: `claude-sonnet-4-6` 으로 업그레이드 고려

## 산출물
- `app/api/evaluate/route.ts`
- `app/api/progress/route.ts`
- `app/api/auth/callback/route.ts`
- `app/api/badges/route.ts` (Phase 3)
- `docs/backend-log.md`
