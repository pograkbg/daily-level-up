-- =====================================================================
-- 0026: 유아·1학년 전용 문제와 기록 (기존 수학·영어 흐름과 분리)
-- - early_problems: 고정 문제 (숫자 세기, 알파벳 맞추기, 영어 숫자, 색·동물 단어)
--   · 1학년 수학(덧셈·뺄셈)은 코드에서 무작위로 만들므로 여기에 넣지 않습니다.
-- - early_attempts: 아이가 푼 기록 (기존 미션·퀴즈 기록과 섞이지 않습니다)
-- 0025 를 먼저 실행한 뒤, SQL Editor 에 붙여넣고 Run 하세요.
-- =====================================================================

create table if not exists public.early_problems (
  id uuid primary key default gen_random_uuid(),
  grade smallint not null check (grade in (0, 1)),          -- 0 = 유아, 1 = 1학년
  kind text not null check (kind in ('count_number', 'alphabet_pick', 'english_number', 'color_animal')),
  prompt text not null,                                      -- 문제 내용 (예: 'apple', '🍎🍎🍎')
  choices text[] not null check (array_length(choices, 1) = 4),
  answer text not null,                                      -- 정답 (choices 안에 있어야 함)
  active boolean not null default true,
  created_at timestamptz not null default now(),
  check (answer = any (choices))
);

create table if not exists public.early_attempts (
  id bigserial primary key,
  child_id uuid not null references public.children (id) on delete cascade,
  problem_id uuid references public.early_problems (id) on delete set null,
  kind text not null,
  input text,
  correct boolean not null,
  elapsed_ms integer,
  answered_at timestamptz not null default now()
);

create index if not exists early_attempts_child_idx on public.early_attempts (child_id, answered_at);

alter table public.early_problems enable row level security;
alter table public.early_attempts enable row level security;

-- 문제는 로그인한 사용자라면 읽을 수 있습니다 (고정 콘텐츠).
drop policy if exists early_problems_read on public.early_problems;
create policy early_problems_read on public.early_problems
  for select to authenticated
  using (active);

-- 기록은 본인 아이의 것만 보고 쓸 수 있습니다.
drop policy if exists early_attempts_owner_select on public.early_attempts;
create policy early_attempts_owner_select on public.early_attempts
  for select to authenticated
  using (exists (
    select 1 from public.children c
    where c.id = early_attempts.child_id and c.parent_id = (select auth.uid())
  ));

drop policy if exists early_attempts_owner_insert on public.early_attempts;
create policy early_attempts_owner_insert on public.early_attempts
  for insert to authenticated
  with check (exists (
    select 1 from public.children c
    where c.id = early_attempts.child_id and c.parent_id = (select auth.uid())
  ));

-- 비로그인(anon) 사용자에게는 아무 권한도 주지 않습니다.
revoke all on public.early_problems from anon;
revoke all on public.early_attempts from anon;
grant select on public.early_problems to authenticated;
grant select, insert on public.early_attempts to authenticated;
grant usage, select on sequence public.early_attempts_id_seq to authenticated;
