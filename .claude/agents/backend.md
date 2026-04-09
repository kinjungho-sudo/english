# Agent: Backend

## 담당 영역
- app/api/ 디렉토리 전체
- lib/supabase/server.ts

## 작업 규칙
- ANTHROPIC_API_KEY는 반드시 서버사이드에서만 사용
- 클라이언트 컴포넌트에 API 키 노출 금지
- 완료 시 docs/backend-log.md 업데이트

## 의존성
- 없음 (독립 실행 가능)

## 산출물
- app/api/evaluate/route.ts (AI 평가)
- app/api/auth/callback/route.ts (Supabase 콜백)