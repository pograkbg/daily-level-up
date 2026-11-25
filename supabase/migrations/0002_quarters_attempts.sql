-- =====================================================================
-- 0002: 분기 선택 · 하루 최대 5회 회차 · 연속 학습 · 해설 정보
-- 0001 을 먼저 실행한 뒤, 이 파일을 SQL Editor 에 붙여넣고 Run 하세요.
-- =====================================================================

-- ---------- 컬럼 추가 ----------

alter table public.children
  add column if not exists math_quarter smallint not null default 1
    check (math_quarter between 1 and 4),
  add column if not exists last_study_date date;

alter table public.daily_missions
  add column if not exists attempt_no smallint not null default 1
    check (attempt_no between 1 and 5),
  add column if not exists quarter smallint not null default 1
    check (quarter between 1 and 4);

-- 하루에 여러 회차를 허용: (아이, 날짜) 유일 → (아이, 날짜, 회차) 유일
alter table public.daily_missions
  drop constraint if exists daily_missions_child_id_mission_date_key;
alter table public.daily_missions
  add constraint daily_missions_child_date_attempt_key unique (child_id, mission_date, attempt_no);

-- 연산 기호 확장: 곱하기(×), 나누기(÷) 추가
alter table public.mission_problems
  drop constraint if exists mission_problems_operator_check;
alter table public.mission_problems
  add constraint mission_problems_operator_check check (operator in ('+', '-', '×', '÷'));

-- ---------- 기존 함수 교체 ----------

drop function if exists public.ensure_today_mission(uuid, date, text, integer, integer, jsonb);

-- 화면 문장 만들기 (기호 변환 포함)
create or replace function public.build_mission_view(p_mission_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  m public.daily_missions%rowtype;
  q public.mission_problems%rowtype;
  current_q jsonb := null;
begin
  select * into m from public.daily_missions where id = p_mission_id;
  if not found then
    raise exception 'mission_not_found';
  end if;

  if m.solved_count < m.total_questions then
    select * into q from public.mission_problems
    where mission_id = m.id and idx = m.solved_count;

    current_q := jsonb_build_object(
      'index', q.idx,
      'total', m.total_questions,
      'prompt', q.left_operand::text || ' '
        || (case when q.operator = '-' then '−' else q.operator end) || ' '
        || q.right_operand::text || ' = ?'
    );
  end if;

  return jsonb_build_object(
    'mission', jsonb_build_object(
      'id', m.id,
      'date', m.mission_date,
      'title', m.title,
      'totalQuestions', m.total_questions,
      'solvedCount', m.solved_count,
      'correctCount', m.correct_count,
      'status', m.status,
      'rewardXp', m.reward_xp,
      'rewardCoins', m.reward_coins,
      'attemptNo', m.attempt_no,
      'quarter', m.quarter
    ),
    'currentQuestion', current_q
  );
end;
$$;

-- ---------- 새 함수 ----------

-- 회차 시작 (같은 회차가 이미 있으면 그대로 반환)
create or replace function public.start_mission(
  p_child_id uuid,
  p_mission_date date,
  p_attempt_no integer,
  p_quarter integer,
  p_title text,
  p_reward_xp integer,
  p_reward_coins integer,
  p_problems jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
  v_count integer;
  p jsonb;
begin
  perform public.assert_child_owner(p_child_id);

  if p_attempt_no < 1 or p_attempt_no > 5 then
    raise exception 'invalid_attempt';
  end if;
  if p_quarter < 1 or p_quarter > 4 then
    raise exception 'invalid_quarter';
  end if;

  select id into v_id from public.daily_missions
  where child_id = p_child_id and mission_date = p_mission_date and attempt_no = p_attempt_no;

  if v_id is null then
    select count(*) into v_count from public.daily_missions
    where child_id = p_child_id and mission_date = p_mission_date;
    if v_count >= 5 then
      raise exception 'daily_limit_reached';
    end if;

    -- 이전 회차를 아직 끝내지 않았으면 새 회차를 열 수 없습니다.
    if exists (
      select 1 from public.daily_missions
      where child_id = p_child_id and mission_date = p_mission_date and status <> 'rewarded'
    ) then
      raise exception 'previous_mission_open';
    end if;

    insert into public.daily_missions (
      child_id, mission_date, title, total_questions, reward_xp, reward_coins, attempt_no, quarter
    )
    values (
      p_child_id, p_mission_date, p_title, jsonb_array_length(p_problems),
      p_reward_xp, p_reward_coins, p_attempt_no, p_quarter
    )
    returning id into v_id;

    for p in select value from jsonb_array_elements(p_problems) loop
      insert into public.mission_problems (
        mission_id, idx, left_operand, right_operand, operator, answer
      )
      values (
        v_id,
        (p->>'index')::smallint,
        (p->>'left')::integer,
        (p->>'right')::integer,
        p->>'operator',
        (p->>'answer')::integer
      );
    end loop;
  end if;

  return public.build_mission_view(v_id);
end;
$$;

-- 미션 화면 다시 불러오기 (본인 미션만)
create or replace function public.get_mission_view(p_mission_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.assert_child_owner(
    (select child_id from public.daily_missions where id = p_mission_id)
  );
  return public.build_mission_view(p_mission_id);
end;
$$;

-- 분기 바꾸기 (다음 회차부터 적용)
create or replace function public.set_math_quarter(p_child_id uuid, p_quarter integer)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.assert_child_owner(p_child_id);
  if p_quarter < 1 or p_quarter > 4 then
    raise exception 'invalid_quarter';
  end if;
  update public.children set math_quarter = p_quarter where id = p_child_id;
end;
$$;

-- 정답 제출: 해설에 필요한 문제 정보도 함께 돌려줍니다.
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

-- 보상 받기 (한 번만 지급 + 연속 학습 갱신)
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

  -- 연속 학습: 같은 날은 유지, 전날에 이어서 하면 +1, 그 밖에는 1일부터
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

-- ---------- 실행 권한 ----------

revoke execute on function public.build_mission_view(uuid) from public, anon, authenticated;
revoke execute on function public.assert_child_owner(uuid) from public, anon, authenticated;

grant execute on function public.start_mission(uuid, date, integer, integer, text, integer, integer, jsonb) to authenticated;
grant execute on function public.get_mission_view(uuid) to authenticated;
grant execute on function public.set_math_quarter(uuid, integer) to authenticated;
grant execute on function public.submit_answer(uuid, integer, integer) to authenticated;
grant execute on function public.claim_reward(uuid) to authenticated;
