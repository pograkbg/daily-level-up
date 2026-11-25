-- =====================================================================
-- 0004: 한 회차 40문제 · 연산별 난이도 지정 · 당일 중복 문제 제외
-- 0001 ~ 0003 을 먼저 실행한 뒤, 이 파일을 SQL Editor 에 붙여넣고 Run 하세요.
-- =====================================================================

-- ---------- 컬럼 ----------

alter table public.children
  add column if not exists practice_bands jsonb not null
    default '{"+": null, "-": null, "×": null, "÷": null}'::jsonb;

alter table public.children drop column if exists practice_op;
alter table public.children drop column if exists practice_band;

alter table public.daily_missions
  add column if not exists plan_label text not null default '';

-- ---------- 화면용 미션 정보 (요약 문구 포함) ----------

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
      'planLabel', m.plan_label
    ),
    'currentQuestion', current_q
  );
end;
$$;

-- ---------- 회차 시작 (40문제 + 요약 문구) ----------

drop function if exists public.start_mission(uuid, date, integer, integer, text, integer, integer, jsonb);

create or replace function public.start_mission(
  p_child_id uuid,
  p_mission_date date,
  p_attempt_no integer,
  p_plan_label text,
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
      child_id, mission_date, title, total_questions, reward_xp, reward_coins, attempt_no, plan_label
    )
    values (
      p_child_id, p_mission_date, p_title, jsonb_array_length(p_problems),
      p_reward_xp, p_reward_coins, p_attempt_no, p_plan_label
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

-- ---------- 오늘 나온 문제 목록 (중복 제외용) ----------

create or replace function public.today_problem_keys(p_child_id uuid, p_mission_date date)
returns text[]
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.assert_child_owner(p_child_id);
  return coalesce((
    select array_agg(mp.operator || '|' || mp.left_operand::text || '|' || mp.right_operand::text)
    from public.mission_problems mp
    join public.daily_missions m on m.id = mp.mission_id
    where m.child_id = p_child_id and m.mission_date = p_mission_date
  ), array[]::text[]);
end;
$$;

-- ---------- 풀이 방식 저장 (연산별 난이도) ----------

drop function if exists public.set_practice(uuid, text, text, integer);

create or replace function public.set_practice(
  p_child_id uuid,
  p_mode text,
  p_bands jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  op text;
begin
  perform public.assert_child_owner(p_child_id);
  if p_mode not in ('random', 'choose') then
    raise exception 'invalid_mode';
  end if;

  if p_mode = 'choose' then
    foreach op in array array['+', '-', '×', '÷'] loop
      if (p_bands->>op) is null or (p_bands->>op) not in ('0', '1', '2') then
        raise exception 'invalid_mode';
      end if;
    end loop;
    update public.children
    set practice_mode = 'choose', practice_bands = p_bands
    where id = p_child_id;
  else
    update public.children
    set practice_mode = 'random',
        practice_bands = '{"+": null, "-": null, "×": null, "÷": null}'::jsonb
    where id = p_child_id;
  end if;
end;
$$;

-- ---------- 실행 권한 ----------

revoke execute on function public.build_mission_view(uuid) from public, anon, authenticated;

grant execute on function public.start_mission(uuid, date, integer, text, text, integer, integer, jsonb) to authenticated;
grant execute on function public.today_problem_keys(uuid, date) to authenticated;
grant execute on function public.set_practice(uuid, text, jsonb) to authenticated;
