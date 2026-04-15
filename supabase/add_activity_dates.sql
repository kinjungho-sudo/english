-- profiles 테이블에 activity_dates 컬럼 추가
-- YYYY-MM-DD 문자열 배열로 접속 날짜 기록
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS activity_dates TEXT[] NOT NULL DEFAULT '{}';
