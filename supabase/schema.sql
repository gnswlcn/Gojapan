-- ============================================================
-- GoJapan — Supabase Schema
-- Supabase 대시보드 > SQL Editor 에서 실행
-- ============================================================

-- 단어 학습 진도
CREATE TABLE IF NOT EXISTS word_progress (
  user_id      TEXT        NOT NULL,
  word_id      TEXT        NOT NULL,
  confidence   INT         NOT NULL DEFAULT 0 CHECK (confidence BETWEEN 0 AND 5),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, word_id)
);

-- 생성된 에피소드 (Claude가 만든 맞춤 에피소드)
CREATE TABLE IF NOT EXISTS episodes (
  id           TEXT        PRIMARY KEY,
  level        TEXT        NOT NULL,          -- N5 / N4 / N3 / N2 / N1
  target_words TEXT[]      NOT NULL DEFAULT '{}',
  content      JSONB       NOT NULL,          -- shadow_ep*.json 과 동일한 구조
  is_generated BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS 비활성화 (프로토타입: 인증 없이 anon key로 읽기/쓰기)
ALTER TABLE word_progress DISABLE ROW LEVEL SECURITY;
ALTER TABLE episodes       DISABLE ROW LEVEL SECURITY;
