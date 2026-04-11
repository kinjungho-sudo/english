<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# Sub-Agent 조율 규칙

## 에이전트 구성
| Agent | 파일 | 담당 |
|-------|------|------|
| [database](.claude/agents/database.md) | `supabase/`, `lib/types.ts`, `lib/scenarios/` | 스키마, 시드, 공유 타입 |
| [backend](.claude/agents/backend.md) | `app/api/`, `lib/supabase/server.ts`, `proxy.ts` | API Routes, AI 평가 |
| [frontend](.claude/agents/frontend.md) | `app/` 페이지, `components/` | UI/UX, 페이지 |

## 실행 순서

```
Step 1 — Database agent (단독, 먼저 실행)
  lib/types.ts 타입 정의 완료 후 다음 단계로

Step 2 — Backend + Frontend 병렬 실행
  Terminal A: backend agent
  Terminal B: frontend agent
  (두 agent 모두 lib/types.ts 를 읽기 전용으로 참조)

Step 3 — 통합 검증
  npm run build && npx tsc --noEmit
```

## 파일 소유권 (충돌 방지)

```
database   단독 소유: supabase/, lib/types.ts, lib/scenarios/data.ts
backend    단독 소유: app/api/, lib/supabase/server.ts, proxy.ts
frontend   단독 소유: app/(pages)/, components/
공유 읽기:  lib/types.ts — 모든 agent 읽기 가능, database만 쓰기 가능
```

## 터미널 실행 명령어

```bash
# Terminal 1 (먼저)
claude --agent .claude/agents/database.md \
  "AGENTS.md를 읽고 Phase 2/3 작업을 수행해줘. supabase/, lib/ 에만 작업할 것."

# Terminal 2 (database 완료 후 병렬)
claude --agent .claude/agents/backend.md \
  "AGENTS.md를 읽고 Phase 2/3 API를 구현해줘. app/api/ 에만 작업할 것."

# Terminal 3 (database 완료 후 병렬)
claude --agent .claude/agents/frontend.md \
  "AGENTS.md를 읽고 Phase 2/3 UI를 구현해줘. app/(pages)/, components/ 에만 작업할 것."
```

## 통합 체크리스트

```
□ lib/types.ts 의 타입과 supabase 테이블 컬럼이 일치하는가?
□ Frontend의 API 호출 경로가 backend route.ts 경로와 일치하는가?
□ proxy.ts 함수명이 `proxy` 인가? (Next.js 16 breaking change)
□ .env.local 에 SUPABASE_URL, SUPABASE_ANON_KEY, ANTHROPIC_API_KEY 설정됨?
□ npm run build 에러 없음?
□ npx tsc --noEmit 에러 없음?
```
