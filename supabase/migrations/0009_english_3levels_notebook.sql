-- =====================================================================
-- 0009: 영어 3단계 · 20문제 퀴즈 · 학습 기록 · 단계별 오답노트
-- 0008 을 먼저 실행한 뒤, 이 파일을 SQL Editor 에 붙여넣고 Run 하세요.
-- 그다음 supabase/seed/english_levels_v3.sql 을 한 번 실행합니다.
-- =====================================================================

-- ---------- 레벨 3단계로 제한 ----------

alter table public.children drop constraint if exists children_english_max_level_check;
update public.children set english_max_level = 3 where english_max_level > 3;
alter table public.children
  add constraint children_english_max_level_check check (english_max_level between 1 and 3);

create or replace function public.set_english_max_level(p_child_id uuid, p_level integer)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.assert_child_owner(p_child_id);
  if p_level < 1 or p_level > 3 then
    raise exception 'invalid_level';
  end if;
  update public.children set english_max_level = p_level where id = p_child_id;
end;
$$;

-- ---------- 퀴즈 시작 (최대 20문제, 오답만 다시 풀기 옵션) ----------

drop function if exists public.start_english_quiz(uuid, integer, integer);

create or replace function public.start_english_quiz(
  p_child_id uuid,
  p_level integer,
  p_count integer,
  p_wrong_only boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_session uuid;
  v_max integer;
  v_pool integer;
  v_n integer;
  rw record;
  v_choices integer[];
  v_idx integer := 0;
begin
  perform public.assert_child_owner(p_child_id);
  if p_level < 1 or p_level > 3 then
    raise exception 'invalid_level';
  end if;
  select english_max_level into v_max from public.children where id = p_child_id;
  if p_level > v_max then
    raise exception 'level_locked';
  end if;
  if p_count < 1 or p_count > 20 then
    raise exception 'invalid_count';
  end if;

  -- 하루 최대 5회 (수학 회차와 같은 제한)
  if (
    select count(*) from public.english_quiz_sessions s
    where s.child_id = p_child_id
      and (s.created_at at time zone 'Asia/Seoul')::date = (now() at time zone 'Asia/Seoul')::date
  ) >= 5 then
    raise exception 'english_daily_limit';
  end if;

  select count(*) into v_pool
  from public.english_words w
  where w.level = p_level
    and (not p_wrong_only or exists (
      select 1 from public.english_progress p
      where p.child_id = p_child_id and p.word_id = w.id and p.attempt_count > p.correct_count
    ));
  if v_pool = 0 then
    raise exception 'no_wrong_words';
  end if;
  v_n := least(p_count, v_pool);

  insert into public.english_quiz_sessions (child_id, level, total_questions)
  values (p_child_id, p_level, v_n)
  returning id into v_session;

  for rw in
    select w.id from public.english_words w
    where w.level = p_level
      and (not p_wrong_only or exists (
        select 1 from public.english_progress p
        where p.child_id = p_child_id and p.word_id = w.id and p.attempt_count > p.correct_count
      ))
    order by random()
    limit v_n
  loop
    select array_agg(x order by random()) into v_choices
    from unnest(
      array[rw.id] || array(
        select d.id from public.english_words d
        where d.level = p_level and d.id <> rw.id
        order by random()
        limit 3
      )
    ) as x;

    insert into public.english_quiz_items (session_id, idx, word_id, choices)
    values (v_session, v_idx, rw.id, v_choices);
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

-- ---------- 영어 학습 기록 ----------

create or replace function public.get_english_stats(p_child_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v jsonb;
begin
  perform public.assert_child_owner(p_child_id);

  select jsonb_build_object(
    'total', coalesce(sum(p.attempt_count), 0),
    'correct', coalesce(sum(p.correct_count), 0),
    'byLevel', (
      select coalesce(jsonb_agg(jsonb_build_object('level', x.lv, 'total', x.t, 'correct', x.c) order by x.lv), '[]'::jsonb)
      from (
        select w.level as lv, sum(p2.attempt_count) as t, sum(p2.correct_count) as c
        from public.english_progress p2
        join public.english_words w on w.id = p2.word_id
        where p2.child_id = p_child_id
        group by w.level
      ) x
    )
  ) into v
  from public.english_progress p
  where p.child_id = p_child_id;

  return v;
end;
$$;

-- ---------- 단계별 오답노트 (한 번이라도 틀린 단어) ----------

create or replace function public.get_english_wrong_words(p_child_id uuid, p_level integer)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v jsonb;
begin
  perform public.assert_child_owner(p_child_id);

  select coalesce(jsonb_agg(jsonb_build_object(
    'id', w.id,
    'word', w.word,
    'meaning', w.meaning_ko,
    'example', w.example_en,
    'exampleKo', w.example_ko,
    'wrong', p.attempt_count - p.correct_count,
    'attempts', p.attempt_count,
    'correct', p.correct_count
  ) order by (p.attempt_count - p.correct_count) desc, w.word), '[]'::jsonb)
  into v
  from public.english_progress p
  join public.english_words w on w.id = p.word_id
  where p.child_id = p_child_id
    and w.level = p_level
    and p.attempt_count > p.correct_count;

  return v;
end;
$$;

-- ---------- 실행 권한 ----------

grant execute on function public.set_english_max_level(uuid, integer) to authenticated;
grant execute on function public.start_english_quiz(uuid, integer, integer, boolean) to authenticated;
grant execute on function public.get_english_stats(uuid) to authenticated;
grant execute on function public.get_english_wrong_words(uuid, integer) to authenticated;
