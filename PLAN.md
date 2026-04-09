# AI Travel English RPG — 개발 계획서

## 목표
- **한 줄 요약**: 영어 여행 회화를 Visual Novel 스타일 RPG로 배우는 AI 학습 앱
- **핵심 문제**: 해외여행 시 말이 안 나왔던 사람들이 실전 회화를 게임처럼 반복 학습
- **성공 기준**: 로그인 → 시나리오 플레이 → AI 피드백 → 오답 저장 → 재방문 시 복습 루프 완성

## 기술 스택
| 영역 | 선택 | 이유 |
|------|------|------|
| Frontend | Next.js 14 (App Router) + TypeScript | SSR, 파일 기반 라우팅 |
| Styling | Tailwind CSS | 빠른 UI 프로토타이핑 |
| Auth & DB | Supabase | Auth + PostgreSQL + RLS 통합 |
| AI 평가 | Anthropic API (Claude) | 자연어 표현 평가 |
| TTS | Web Speech API | 브라우저 내장, 추가 비용 없음 |
| 배포 | Vercel | Next.js 최적화 |

## 기능 목록 (우선순위)

### Must Have (Phase 1 — MVP)
1. Supabase 이메일 로그인/회원가입
2. 식당 시나리오 (5단계) 완전 구현
3. Visual Novel 스타일 게임 플레이 화면
4. Anthropic API 연동 — 유저 입력 AI 평가 및 피드백
5. Web Speech API TTS (NPC 대사 음성)
6. 오답 자동 저장 (user_mistakes 테이블)
7. 빈칸 힌트(Scaffold) 시스템

### Nice to Have (Phase 2)
1. 공항 / 호텔 시나리오 추가
2. 대시보드 복습 알림 (재방문 시 오답 우선 출제)
3. 결과 페이지 (점수 + 틀린 표현 복습)

### 게이미피케이션 (Phase 3)
1. 뱃지 시스템 (3번 연속 정답 = 마스터)
2. 마스터 표현 목록 (/profile)
3. 점수 히스토리 차트

## 파일 구조
```
c:/dev/english/
├── CLAUDE.md
├── PLAN.md
├── .env.local               ← 실제 키 (gitignore)
├── .env.example             ← placeholder
├── .claude/
│   ├── agents/
│   │   ├── frontend.md
│   │   ├── backend.md
│   │   └── database.md
│   ├── mistakes/
│   │   ├── ledger.json
│   │   └── active-rules.md
│   └── vault/
├── app/
│   ├── layout.tsx           ← 루트 레이아웃
│   ├── page.tsx             ← 랜딩 + 로그인
│   ├── dashboard/
│   │   └── page.tsx         ← 시나리오 선택
│   ├── scenario/
│   │   └── [id]/
│   │       └── page.tsx     ← 게임 플레이
│   ├── result/
│   │   └── [id]/
│   │       └── page.tsx     ← 클리어 결과
│   ├── profile/
│   │   └── page.tsx         ← 뱃지 + 마스터 표현
│   └── api/
│       ├── evaluate/
│       │   └── route.ts     ← AI 평가 (Anthropic)
│       └── auth/
│           └── callback/
│               └── route.ts ← Supabase Auth 콜백
├── components/
│   ├── GameScene.tsx        ← Visual Novel 메인 컴포넌트
│   ├── NPCDialogue.tsx      ← NPC 대사 박스 + TTS
│   ├── UserInput.tsx        ← 빈칸 힌트 + 입력창
│   ├── FeedbackPopup.tsx    ← AI 평가 결과 팝업
│   └── ScoreBar.tsx         ← 점수/진행 상태바
├── lib/
│   ├── supabase/
│   │   ├── client.ts        ← 브라우저용 클라이언트
│   │   └── server.ts        ← 서버용 클라이언트
│   └── scenarios/
│       └── data.ts          ← 시나리오 정적 데이터
└── supabase/
    ├── schema.sql           ← 테이블 스키마
    └── seed.sql             ← 초기 데이터
```

## Supabase 테이블
- **scenarios**: id, name, location, npc_name, npc_personality, thumbnail, order_index
- **dialogue_steps**: id, scenario_id, step_order, npc_line, hint_template, expected_keywords, tts_text
- **user_progress**: id, user_id, scenario_id, completed_at, total_score, steps_completed
- **user_mistakes**: id, user_id, scenario_id, step_id, wrong_input, correct_expression, context, mistake_count, mastered_at

## 환경 변수
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
ANTHROPIC_API_KEY=           ← 서버사이드 전용
```

## Phase 진행 현황
- [x] Phase 0: 프로젝트 초기화 (Next.js + 의존성)
- [ ] Phase 1: MVP 구현
- [ ] Phase 2: 시나리오 확장
- [ ] Phase 3: 게이미피케이션
