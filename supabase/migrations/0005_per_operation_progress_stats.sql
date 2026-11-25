-- =====================================================================
-- 0005: 연산별 학습 진도(A안) · 정답 1개 = 5 XP · 학습 통계
-- 0001 ~ 0004 를 먼저 실행한 뒤, 이 파일을 SQL Editor 에 붙여넣고 Run 하세요.
-- =====================================================================

-- ---------- 연산별 진도 컬럼 ----------

alter table public.children
  add column if not exists study_progress jsonb not null
    default '{"+": {"level": 1, "xp": 0}, "-": {"level": 1, "xp": 0}, "×": {"level": 1, "xp": 0}, "÷": {"level": 1, "xp": 0}}'::jsonb;

-- 예전 전체 진도 컬럼은 더 이상 쓰지 않습니다.
alter table public.children drop column if exists study_level;
alter table public.children drop column if exists study_xp;

-- ---------- 연산 진도 올리기 (정답 1개 = 5 XP, 250 XP = 레벨 1) ----------

create or replace function public.add_op_xp(p_progress jsonb, p_op text, p_gain integer)
returns jsonb
language plpgsql
immutable
set search_path = ''
as $$
declare
  v_level integer := (p_progress -> p_op ->> 'level')::integer;
  v_xp integer := (p_progress -> p_op ->> 'xp')::integer + p_gain;
begin
  while v_level < 15 and v_xp >= 250 loop
    v_xp := v_xp - 250;
    v_level := v_level + 1;
  end loop;
  if v_level >= 15 then
    v_xp := least(v_xp, 250);
  end if;
  return jsonb_set(p_progress, array[p_op], jsonb_build_object('level', v_level, 'xp', v_xp));
end;
$$;

-- ---------- 정답 제출: 정답이면 해당 연산 진도 증가 ----------

create or replace function public.submit_answer(
  p_mission_id uuid,
  p_index integer,
  p_input integer
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

  insert into public.mission_answers (mission_id, idx, input, is_correct)
  values (m.id, p_index, p_input, v_correct);

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

-- ---------- 보상 받기: 캐릭터 경험치 + 연속 학습 ----------

create or replace function public.claim_reward(p_mission_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  m public.daily_missions%rowtype;
  c public.children%rowtype;
  new_streak integer;
begin
  select * into m from public.daily_missions where id = p_mission_id for update;
  if not found then
    raise exception 'mission_not_found';
  end if;
  perform public.assert_child_owner(m.child_id);

  if m.status = 'rewarded' then
    return jsonb_build_object(
      'reward', jsonb_build_object('xp', 0, 'coins', 0, 'alreadyClaimed', true),
      'view', public.build_mission_view(m.id)
    );
  end if;

  if m.status <> 'completed' then
    raise exception 'not_completed';
  end if;

  insert into public.mission_rewards (mission_id, xp, coins)
  values (m.id, m.reward_xp, m.reward_coins);

  select * into c from public.children where id = m.child_id for update;

  if c.last_study_date = m.mission_date then
    new_streak := c.streak_days;
  elsif c.last_study_date = m.mission_date - 1 then
    new_streak := c.streak_days + 1;
  else
    new_streak := 1;
  end if;

  update public.children
  set total_xp = total_xp + m.reward_xp,
      coins = coins + m.reward_coins,
      streak_days = new_streak,
      last_study_date = m.mission_date
  where id = m.child_id;

  update public.daily_missions set status = 'rewarded' where id = m.id;

  return jsonb_build_object(
    'reward', jsonb_build_object('xp', m.reward_xp, 'coins', m.reward_coins, 'alreadyClaimed', false),
    'view', public.build_mission_view(m.id)
  );
end;
$$;

-- ---------- 학년 완료 후 보호자 승인 (네 연산 모두 레벨 15) ----------

create or replace function public.approve_next_grade(p_child_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  c public.children%rowtype;
  op text;
begin
  perform public.assert_child_owner(p_child_id);
  select * into c from public.children where id = p_child_id;
  foreach op in array array['+', '-', '×', '÷'] loop
    if not ((c.study_progress -> op ->> 'level')::integer >= 15
            and (c.study_progress -> op ->> 'xp')::integer >= 250) then
      raise exception 'grade_not_cleared';
    end if;
  end loop;
  update public.children set next_grade_approved = true where id = p_child_id;
end;
$$;

-- ---------- 학습 통계 ----------

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
    'today', jsonb_build_object(
      'total', count(*) filter (where m.mission_date = p_today),
      'correct', count(*) filter (where m.mission_date = p_today and a.is_correct)
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

-- ---------- 실행 권한 ----------

revoke execute on function public.add_op_xp(jsonb, text, integer) from public, anon, authenticated;
grant execute on function public.submit_answer(uuid, integer, integer) to authenticated;
grant execute on function public.claim_reward(uuid) to authenticated;
grant execute on function public.approve_next_grade(uuid) to authenticated;
grant execute on function public.get_child_stats(uuid, date) to authenticated;
