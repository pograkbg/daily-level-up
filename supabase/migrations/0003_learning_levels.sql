-- =====================================================================
-- 0003: 학습 레벨(60단계) · 풀이 방식(랜덤/지정) · 보호자 학년 승인
-- 0001, 0002 를 먼저 실행한 뒤, 이 파일을 SQL Editor 에 붙여넣고 Run 하세요.
-- =====================================================================

-- ---------- 컬럼 추가 ----------

alter table public.children
  add column if not exists study_level smallint not null default 1
    check (study_level between 1 and 60),
  add column if not exists study_xp integer not null default 0
    check (study_xp >= 0),
  add column if not exists practice_mode text not null default 'random'
    check (practice_mode in ('random', 'choose')),
  add column if not exists practice_op text
    check (practice_op in ('+', '-', '×', '÷')),
  add column if not exists practice_band smallint
    check (practice_band between 0 and 2),
  add column if not exists next_grade_approved boolean not null default false;

alter table public.daily_missions
  add column if not exists level_index smallint not null default 1
    check (level_index between 1 and 60);

-- ---------- 화면용 미션 정보 (레벨 번호 포함) ----------

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
      'levelIndex', m.level_index
    ),
    'currentQuestion', current_q
  );
end;
$$;

-- ---------- 회차 시작 (학습 레벨 번호를 받습니다) ----------

drop function if exists public.start_mission(uuid, date, integer, integer, text, integer, integer, jsonb);

create or replace function public.start_mission(
  p_child_id uuid,
  p_mission_date date,
  p_attempt_no integer,
  p_level_index integer,
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
  if p_level_index < 1 or p_level_index > 60 then
    raise exception 'invalid_level';
  end if;

  select id into v_id from public.daily_missions
  where child_id = p_child_id and mission_date = p_mission_date and attempt_no = p_attempt_no;

  if v_id is null then
    select count(*) into v_count from public.daily_missions
    where child_id = p_child_id and mission_date = p_mission_date;
    if v_count >= 5 then
      raise exception 'daily_limit_reached';
    end if;

    if exists (
      select 1 from public.daily_missions
      where child_id = p_child_id and mission_date = p_mission_date and status <> 'rewarded'
    ) then
      raise exception 'previous_mission_open';
    end if;

    insert into public.daily_missions (
      child_id, mission_date, title, total_questions, reward_xp, reward_coins, attempt_no, level_index
    )
    values (
      p_child_id, p_mission_date, p_title, jsonb_array_length(p_problems),
      p_reward_xp, p_reward_coins, p_attempt_no, p_level_index
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

-- ---------- 풀이 방식 저장 (랜덤 / 지정) ----------

create or replace function public.set_practice(
  p_child_id uuid,
  p_mode text,
  p_op text,
  p_band integer
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.assert_child_owner(p_child_id);
  if p_mode not in ('random', 'choose') then
    raise exception 'invalid_mode';
  end if;
  if p_mode = 'choose' and (p_op is null or p_band is null) then
    raise exception 'invalid_mode';
  end if;
  update public.children
  set practice_mode = p_mode,
      practice_op = case when p_mode = 'choose' then p_op else null end,
      practice_band = case when p_mode = 'choose' then p_band else null end
  where id = p_child_id;
end;
$$;

-- ---------- 학년 완료 후 보호자 승인 ----------

create or replace function public.approve_next_grade(p_child_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  c public.children%rowtype;
begin
  perform public.assert_child_owner(p_child_id);
  select * into c from public.children where id = p_child_id;
  if not (c.study_level >= 60 and c.study_xp >= 250) then
    raise exception 'grade_not_cleared';
  end if;
  update public.children set next_grade_approved = true where id = p_child_id;
end;
$$;

-- ---------- 보상 받기: 캐릭터 경험치 + 학습 레벨 + 연속 학습 ----------

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
  v_xp integer;
  v_level integer;
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

  -- 연속 학습
  if c.last_study_date = m.mission_date then
    new_streak := c.streak_days;
  elsif c.last_study_date = m.mission_date - 1 then
    new_streak := c.streak_days + 1;
  else
    new_streak := 1;
  end if;

  -- 학습 레벨: 250 XP 가 차면 다음 레벨 (레벨 60 은 바가 찬 상태에서 멈춤)
  v_xp := c.study_xp + m.reward_xp;
  v_level := c.study_level;
  while v_level < 60 and v_xp >= 250 loop
    v_xp := v_xp - 250;
    v_level := v_level + 1;
  end loop;
  if v_level >= 60 then
    v_xp := least(v_xp, 250);
  end if;

  update public.children
  set total_xp = total_xp + m.reward_xp,
      coins = coins + m.reward_coins,
      streak_days = new_streak,
      last_study_date = m.mission_date,
      study_level = v_level,
      study_xp = v_xp
  where id = m.child_id;

  update public.daily_missions set status = 'rewarded' where id = m.id;

  return jsonb_build_object(
    'reward', jsonb_build_object('xp', m.reward_xp, 'coins', m.reward_coins, 'alreadyClaimed', false),
    'view', public.build_mission_view(m.id)
  );
end;
$$;

-- ---------- 실행 권한 ----------

grant execute on function public.start_mission(uuid, date, integer, integer, text, integer, integer, jsonb) to authenticated;
grant execute on function public.set_practice(uuid, text, text, integer) to authenticated;
grant execute on function public.approve_next_grade(uuid) to authenticated;
grant execute on function public.claim_reward(uuid) to authenticated;
