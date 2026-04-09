# Agent: Frontend

## 담당 영역
- app/page.tsx, app/dashboard/, app/scenario/, app/result/, app/profile/
- components/ 디렉토리 전체
- app/layout.tsx, globals.css

## 작업 규칙
- lib/supabase/client.ts 는 읽기만 가능
- API Route (app/api/) 수정 금지
- supabase/ 스키마 파일 수정 금지
- 완료 시 docs/frontend-log.md 업데이트

## 의존성
- database agent 완료 후 시작 (테이블 스키마 확정 필요)
- lib/scenarios/data.ts 타입 정의 필요

## 산출물
- 모든 페이지 컴포넌트
- GameScene, NPCDialogue, UserInput, FeedbackPopup, ScoreBar 컴포넌트