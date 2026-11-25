-- =====================================================================
-- 0011: 실제 학습 시간 기록 (수학·영어 모두)
-- 문제 하나를 풀 때 걸린 시간(ms)을 저장합니다. 한 문제당 최대 120초로 자릅니다.
-- 0001 ~ 0010 을 먼저 실행한 뒤, 이 파일을 SQL Editor 에 붙여넣고 Run 하세요.
-- =====================================================================

-- ---------- 문제별 풀이 시간 컬럼 ----------

alter table public.mission_answers
  add column if not exists elapsed_ms integer not null default 0;

alter table public.english_quiz_items
  add column if not exists elapsed_ms integer not null default 0;

-- ---------- 수학 정답 제출 (풀이 시간 추가) ----------

drop function if exists public.submit_answer(uuid, integer, integer);

create or replace function public.submit_answer(
  p_mission_id uuid,
  p_index integer,
  p_input integer,
  p_elapsed_ms integer default 0
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  m public.daily_missions%rowtype;
  prob public.mission_problems%rowtype;
  v_correct boolean;
  v_progress jsonb;
begin
  select * into m from public.daily_missions where id = p_mission_id for update;
  if not found then
    raise exception 'mission_not_found';
  end if;
  perform public.assert_child_owner(m.child_id);

  if m.status in ('completed', 'rewarded') then
    raise exception 'mission_already_finished';
  end if;
  if p_index <> m.solved_count then
    raise exception 'wrong_question_order';
  end if;
  if p_input < 0 or p_input > 999 then
    raise exception 'invalid_input';
  end if;

  select * into prob from public.mission_problems
  where mission_id = m.id and idx = p_index;

  v_correct := (prob.answer = p_input);

  insert into public.mission_answers (mission_id, idx, input, is_correct, elapsed_ms)
  values (m.id, p_index, p_input, v_correct, least(greatest(coalesce(p_elapsed_ms, 0), 0), 120000));

  update public.daily_missions
  set solved_count = m.solved_count + 1,
      correct_count = m.correct_count + (case when v_correct then 1 else 0 end),
      status = case when m.solved_count + 1 >= m.total_questions then 'completed' else 'in_progress' end
  where id = m.id;

  if v_correct then
    select study_progress into v_progress from public.children where id = m.child_id for update;
    update public.children
    set study_progress = public.add_op_xp(v_progress, prob.operator, 5)
    where id = m.child_id;
  end if;

  return jsonb_build_object(
    'result', jsonb_build_object(
      'index', p_index,
      'input', p_input,
      'correct', v_correct,
      'correctAnswer', prob.answer,
      'left', prob.left_operand,
      'right', prob.right_operand,
      'operator', prob.operator
    ),
    'view', public.build_mission_view(m.id)
  );
end;
$$;

-- ---------- 수학 학습 통계 (시간 추가) ----------

create or replace function public.get_child_stats(p_child_id uuid, p_today date)
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
    'total', count(*),
    'correct', count(*) filter (where a.is_correct),
    'totalMs', coalesce(sum(a.elapsed_ms), 0),
    'today', jsonb_build_object(
      'total', count(*) filter (where m.mission_date = p_today),
      'correct', count(*) filter (where m.mission_date = p_today and a.is_correct),
      'ms', coalesce(sum(a.elapsed_ms) filter (where m.mission_date = p_today), 0)
    ),
    'byOp', jsonb_build_object(
      '+', jsonb_build_object('total', count(*) filter (where p.operator = '+'),
                              'correct', count(*) filter (where p.operator = '+' and a.is_correct)),
      '-', jsonb_build_object('total', count(*) filter (where p.operator = '-'),
                              'correct', count(*) filter (where p.operator = '-' and a.is_correct)),
      '×', jsonb_build_object('total', count(*) filter (where p.operator = '×'),
                              'correct', count(*) filter (where p.operator = '×' and a.is_correct)),
      '÷', jsonb_build_object('total', count(*) filter (where p.operator = '÷'),
                              'correct', count(*) filter (where p.operator = '÷' and a.is_correct))
    )
  ) into v
  from public.mission_answers a
  join public.daily_missions m on m.id = a.mission_id
  join public.mission_problems p on p.mission_id = a.mission_id and p.idx = a.idx
  where m.child_id = p_child_id;

  return v;
end;
$$;

-- ---------- 영어 정답 (풀이 시간 추가) ----------

drop function if exists public.answer_english_quiz(uuid, integer);

create or replace function public.answer_english_quiz(
  p_item_id uuid,
  p_choice integer,
  p_elapsed_ms integer default 0
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
  set answered_choice = p_choice,
      correct = v_correct,
      elapsed_ms = least(greatest(coalesce(p_elapsed_ms, 0), 0), 120000)
  where id = it.id;

  insert into public.english_progress (child_id, word_id, correct_count, attempt_count, last_seen_at)
  values (s.child_id, it.word_id, case when v_correct then 1 else 0 end, 1, now())
  on conflict (child_id, word_id) do update
  set attempt_count = public.english_progress.attempt_count + 1,
      correct_count = public.english_progress.correct_count + (case when v_correct then 1 else 0 end),
      last_seen_at = now();

  if v_correct then
    update public.children set total_xp = total_xp + 5 where id = s.child_id;
    perform public.grow_character(s.child_id, 5);
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

-- ---------- 영어 학습 기록 (시간 추가) ----------

drop function if exists public.get_english_stats(uuid);

create or replace function public.get_english_stats(p_child_id uuid, p_today date default null)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v jsonb;
  v_today date := coalesce(p_today, (now() at time zone 'Asia/Seoul')::date);
  v_total_ms bigint;
  v_today_ms bigint;
begin
  perform public.assert_child_owner(p_child_id);

  select coalesce(sum(i.elapsed_ms), 0),
         coalesce(sum(i.elapsed_ms) filter (where (s.created_at at time zone 'Asia/Seoul')::date = v_today), 0)
    into v_total_ms, v_today_ms
  from public.english_quiz_items i
  join public.english_quiz_sessions s on s.id = i.session_id
  where s.child_id = p_child_id and i.answered_choice is not null;

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

  return v || jsonb_build_object('totalMs', v_total_ms, 'todayMs', v_today_ms);
end;
$$;

-- ---------- 실행 권한 ----------

grant execute on function public.submit_answer(uuid, integer, integer, integer) to authenticated;
grant execute on function public.get_child_stats(uuid, date) to authenticated;
grant execute on function public.answer_english_quiz(uuid, integer, integer) to authenticated;
grant execute on function public.get_english_stats(uuid, date) to authenticated;
