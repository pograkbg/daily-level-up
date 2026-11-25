-- =====================================================================
-- 0006: 영어 단어 (English Quest) 테이블
-- 0001 ~ 0005 를 먼저 실행한 뒤, 이 파일을 SQL Editor 에 붙여넣고 Run 하세요.
-- 단어 데이터는 이 파일 실행 후 supabase/seed/english_words.sql 을 실행합니다.
-- =====================================================================

-- ---------- 단어 (모든 아이가 읽을 수 있는 공개 데이터) ----------

create table if not exists public.english_words (
  id integer primary key,
  word text not null unique,
  level smallint not null check (level between 1 and 6),
  meaning_ko text not null default '',
  example_en text not null default '',
  example_ko text not null default '',
  source text not null default '',
  created_at timestamptz not null default now()
);

-- ---------- 아이별 단어 기록 ----------

create table if not exists public.english_progress (
  child_id uuid not null references public.children (id) on delete cascade,
  word_id integer not null references public.english_words (id) on delete cascade,
  correct_count integer not null default 0 check (correct_count >= 0),
  attempt_count integer not null default 0 check (attempt_count >= 0),
  last_seen_at timestamptz,
  primary key (child_id, word_id)
);

-- ---------- RLS ----------

alter table public.english_words enable row level security;
alter table public.english_progress enable row level security;

-- 단어는 로그인한 사용자가 읽을 수 있습니다. 쓰기 정책은 없습니다 (관리자가 시드로만 넣음).
create policy english_words_read on public.english_words
  for select to authenticated
  using (true);

-- 기록은 본인 아이 것만 읽습니다. 쓰기는 서버 함수에서만 합니다.
create policy english_progress_owner_select on public.english_progress
  for select to authenticated
  using (exists (
    select 1 from public.children c
    where c.id = english_progress.child_id and c.parent_id = (select auth.uid())
  ));
