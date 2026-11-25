-- =====================================================================
-- 0018: 예문 풀 (Tatoeba 기반)
-- 0017 을 먼저 실행한 뒤, SQL Editor 에 붙여넣고 Run 하세요.
-- 이 다음에 scripts/output/insert.sql 을 실행해서 예문을 넣습니다.
-- =====================================================================

-- ---------- 예문 풀 ----------
create table if not exists public.english_examples (
  id bigserial primary key,
  word_id integer not null references public.english_words (id) on delete cascade,
  tatoeba_en_id bigint not null,
  tatoeba_ko_id bigint not null,
  en text not null,
  ko text not null,
  owner text not null default '',
  license text not null,
  approved boolean not null default true,
  created_at timestamptz not null default now(),
  -- 같은 문장이 여러 단어에 쓰일 수 있으므로 (단어, 문장) 쌍으로 고유하게 둡니다.
  unique (word_id, tatoeba_en_id)
);

create index if not exists english_examples_word_idx
  on public.english_examples (word_id)
  where approved;

alter table public.english_examples enable row level security;

-- 로그인한 사용자는 승인된 예문을 읽을 수 있습니다. 쓰기는 SQL(관리자)만 합니다.
drop policy if exists examples_read on public.english_examples;
create policy examples_read on public.english_examples
  for select to authenticated
  using (approved);

grant select on public.english_examples to authenticated;

-- ---------- 아이별 노출 기록 ----------
create table if not exists public.english_example_views (
  child_id uuid not null references public.children (id) on delete cascade,
  example_id bigint not null references public.english_examples (id) on delete cascade,
  shown_on date not null,
  primary key (child_id, example_id, shown_on)
);

alter table public.english_example_views enable row level security;

drop policy if exists example_views_owner_select on public.english_example_views;
create policy example_views_owner_select on public.english_example_views
  for select to authenticated
  using (exists (
    select 1 from public.children c
    where c.id = english_example_views.child_id and c.parent_id = (select auth.uid())
  ));

grant select on public.english_example_views to authenticated;

-- ---------- 예문 고르기 (아이·단어·날짜 기준) ----------
-- 1) 오늘 이미 보여 준 예문은 제외
-- 2) 최근 30일 안에 본 예문은 뒤로
-- 3) 나머지는 "아이 + 날짜 + 예문" 해시 순서 (같은 날에는 같은 결과)
-- 고른 예문은 노출 기록에 남깁니다.
create or replace function public.pick_examples(
  p_child_id uuid,
  p_word_id integer,
  p_limit integer default 1
)
returns table (
  example_id bigint,
  en text,
  ko text,
  owner text,
  license text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_today date := (now() at time zone 'Asia/Seoul')::date;
begin
  perform public.assert_child_owner(p_child_id);

  return query
  with cand as (
    select e.id as cid, e.en as cen, e.ko as cko, e.owner as cowner, e.license as clicense,
      exists (
        select 1 from public.english_example_views v
        where v.child_id = p_child_id and v.example_id = e.id and v.shown_on = v_today
      ) as shown_today,
      exists (
        select 1 from public.english_example_views v
        where v.child_id = p_child_id and v.example_id = e.id and v.shown_on >= v_today - 30
      ) as shown_recent
    from public.english_examples e
    where e.word_id = p_word_id and e.approved
  ),
  picked as (
    select c.cid, c.cen, c.cko, c.cowner, c.clicense
    from cand c
    where not c.shown_today
    order by c.shown_recent, md5(p_child_id::text || v_today::text || c.cid::text)
    limit greatest(p_limit, 0)
  ),
  logged as (
    insert into public.english_example_views (child_id, example_id, shown_on)
    select p_child_id, picked.cid, v_today from picked
    on conflict do nothing
    returning 1
  )
  select picked.cid, picked.cen, picked.cko, picked.cowner, picked.clicense from picked;
end;
$$;

grant execute on function public.pick_examples(uuid, integer, integer) to authenticated;
