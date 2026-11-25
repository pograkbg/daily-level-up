-- =====================================================================
-- 0007: 영어 퀴즈 (뜻 고르기 4지선다) · 서버 정답 확인 · 기록 저장
-- 0006 을 먼저 실행한 뒤, 이 파일을 SQL Editor 에 붙여넣고 Run 하세요.
-- =====================================================================

-- ---------- 테이블 ----------

create table if not exists public.english_quiz_sessions (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.children (id) on delete cascade,
  level smallint not null check (level between 1 and 6),
  total_questions smallint not null check (total_questions > 0),
  created_at timestamptz not null default now()
);

-- 문제 한 개. 정답 단어(word_id)는 클라이언트에 보내지 않습니다.
create table if not exists public.english_quiz_items (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.english_quiz_sessions (id) on delete cascade,
  idx smallint not null check (idx >= 0),
  word_id integer not null references public.english_words (id),
  choices integer[] not null,
  answered_choice integer,
  correct boolean,
  unique (session_id, idx)
);

alter table public.english_quiz_sessions enable row level security;
alter table public.english_quiz_items enable row level security;

create policy english_sessions_owner_select on public.english_quiz_sessions
  for select to authenticated
  using (exists (
    select 1 from public.children c
    where c.id = english_quiz_sessions.child_id and c.parent_id = (select auth.uid())
  ));

-- 문제 테이블에는 클라이언트 정책이 없습니다. 서버 함수만 읽고 씁니다.

-- ---------- 퀴즈 시작 ----------

create or replace function public.start_english_quiz(
  p_child_id uuid,
  p_level integer,
  p_count integer
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_session uuid;
  w record;
  v_choices integer[];
  v_idx integer := 0;
begin
  perform public.assert_child_owner(p_child_id);
  if p_level < 1 or p_level > 6 then
    raise exception 'invalid_level';
  end if;
  if p_count < 1 or p_count > 20 then
    raise exception 'invalid_count';
  end if;

  insert into public.english_quiz_sessions (child_id, level, total_questions)
  values (p_child_id, p_level, p_count)
  returning id into v_session;

  for w in
    select id from public.english_words
    where level = p_level
    order by random()
    limit p_count
  loop
    -- 정답 1개 + 다른 단어 3개를 섞어서 4지선다 보기를 만듭니다.
    select array_agg(x order by random()) into v_choices
    from unnest(
      array[w.id] || array(
        select d.id from public.english_words d
        where d.level = p_level and d.id <> w.id
        order by random()
        limit 3
      )
    ) as x;

    insert into public.english_quiz_items (session_id, idx, word_id, choices)
    values (v_session, v_idx, w.id, v_choices);
    v_idx := v_idx + 1;
  end loop;

  return jsonb_build_object(
    'sessionId', v_session,
    'items', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'id', i.id,
        'idx', i.idx,
        'word', ew.word,
        'choices', (
          select jsonb_agg(jsonb_build_object('id', cw.id, 'meaning', cw.meaning_ko) order by array_position(i.choices, cw.id))
          from public.english_words cw
          where cw.id = any(i.choices)
        )
      ) order by i.idx), '[]'::jsonb)
      from public.english_quiz_items i
      join public.english_words ew on ew.id = i.word_id
      where i.session_id = v_session
    )
  );
end;
$$;

-- ---------- 답 확인 (정답이면 기록과 경험치 저장) ----------

create or replace function public.answer_english_quiz(
  p_item_id uuid,
  p_choice integer
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  it public.english_quiz_items%rowtype;
  s public.english_quiz_sessions%rowtype;
  w public.english_words%rowtype;
  v_correct boolean;
begin
  select * into it from public.english_quiz_items where id = p_item_id for update;
  if not found then
    raise exception 'item_not_found';
  end if;
  select * into s from public.english_quiz_sessions where id = it.session_id;
  perform public.assert_child_owner(s.child_id);

  if it.answered_choice is not null then
    raise exception 'already_answered';
  end if;
  if not (p_choice = any(it.choices)) then
    raise exception 'invalid_choice';
  end if;

  select * into w from public.english_words where id = it.word_id;
  v_correct := (p_choice = it.word_id);

  update public.english_quiz_items
  set answered_choice = p_choice, correct = v_correct
  where id = it.id;

  insert into public.english_progress (child_id, word_id, correct_count, attempt_count, last_seen_at)
  values (s.child_id, it.word_id, case when v_correct then 1 else 0 end, 1, now())
  on conflict (child_id, word_id) do update
  set attempt_count = public.english_progress.attempt_count + 1,
      correct_count = public.english_progress.correct_count + (case when v_correct then 1 else 0 end),
      last_seen_at = now();

  if v_correct then
    update public.children set total_xp = total_xp + 5 where id = s.child_id;
  end if;

  return jsonb_build_object(
    'correct', v_correct,
    'correctWordId', w.id,
    'correctMeaning', w.meaning_ko,
    'example', w.example_en,
    'exampleKo', w.example_ko
  );
end;
$$;

-- ---------- 실행 권한 ----------

grant execute on function public.start_english_quiz(uuid, integer, integer) to authenticated;
grant execute on function public.answer_english_quiz(uuid, integer) to authenticated;
