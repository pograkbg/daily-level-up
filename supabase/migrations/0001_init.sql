-- =====================================================================
-- Daily Level Up 1차 DB 스키마 (3단계)
-- Supabase 대시보드 > SQL Editor 에 이 파일 내용을 붙여넣고 Run 하세요.
--
-- 핵심 원칙
-- 1) 모든 테이블에 RLS(행 단위 보안)를 켭니다.
-- 2) 정답표(mission_problems)는 클라이언트가 직접 읽을 수 없습니다.
-- 3) 정답 검사·경험치/코인 지급은 DB 함수(RPC) 안에서만 합니다.
--    함수는 트랜잭션 + 행 잠금(FOR UPDATE)으로 실행되어 중복 지급이 불가능합니다.
-- =====================================================================

-- ---------- 테이블 ----------

-- 아이 프로필 (부모 계정 1명 아래 아이 여러 명 가능)
create table if not exists public.children (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid not null references auth.users (id) on delete cascade,
  nickname text not null check (char_length(nickname) between 1 and 20),
  grade smallint not null check (grade between 2 and 6),
  character_id text not null check (character_id in ('honeybee', 'mantis', 'cicada')),
  total_xp integer not null default 0 check (total_xp >= 0),
  coins integer not null default 0 check (coins >= 0),
  streak_days integer not null default 0 check (streak_days >= 0),
  created_at timestamptz not null default now()
);

-- 하루 미션 (아이 1명당 날짜별 1개)
create table if not exists public.daily_missions (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.children (id) on delete cascade,
  mission_date date not null,
  title text not null,
  total_questions smallint not null check (total_questions > 0),
  solved_count smallint not null default 0 check (solved_count >= 0),
  correct_count smallint not null default 0 check (correct_count >= 0),
  status text not null default 'ready'
    check (status in ('ready', 'in_progress', 'completed', 'rewarded')),
  reward_xp integer not null check (reward_xp >= 0),
  reward_coins integer not null check (reward_coins >= 0),
  created_at timestamptz not null default now(),
  unique (child_id, mission_date)
);

-- 정답표: 서버 함수만 읽고 씁니다. 클라이언트 정책을 만들지 않습니다.
create table if not exists public.mission_problems (
  mission_id uuid not null references public.daily_missions (id) on delete cascade,
  idx smallint not null check (idx >= 0),
  left_operand integer not null,
  right_operand integer not null,
  operator text not null check (operator in ('+', '-')),
  answer integer not null,
  primary key (mission_id, idx)
);

-- 아이가 제출한 답 기록
create table if not exists public.mission_answers (
  mission_id uuid not null references public.daily_missions (id) on delete cascade,
  idx smallint not null,
  input integer not null,
  is_correct boolean not null,
  answered_at timestamptz not null default now(),
  primary key (mission_id, idx)
);

-- 보상 지급 기록. mission_id 가 기본키이므로 같은 미션은 두 번 기록될 수 없습니다.
create table if not exists public.mission_rewards (
  mission_id uuid primary key references public.daily_missions (id) on delete cascade,
  xp integer not null,
  coins integer not null,
  claimed_at timestamptz not null default now()
);

-- 하루 공부 시간 기록
create table if not exists public.study_logs (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.children (id) on delete cascade,
  study_date date not null,
  minutes integer not null default 0 check (minutes >= 0),
  unique (child_id, study_date)
);

-- ---------- RLS 켜기 ----------

alter table public.children enable row level security;
alter table public.daily_missions enable row level security;
alter table public.mission_problems enable row level security; -- 정책 없음 = 직접 접근 불가
alter table public.mission_answers enable row level security;
alter table public.mission_rewards enable row level security;
alter table public.study_logs enable row level security;

-- anon(로그인 안 한 사용자)에게는 아무 권한도 주지 않습니다.
revoke all on all tables in schema public from anon;

-- 아이 프로필: 본인 부모 계정만 보기·추가 (수정·삭제 정책 없음 → XP/코인은 함수로만 변경)
create policy children_owner_select on public.children
  for select to authenticated
  using (parent_id = (select auth.uid()));

create policy children_owner_insert on public.children
  for insert to authenticated
  with check (parent_id = (select auth.uid()));

-- 미션: 본인 아이의 미션만 보기 (쓰기 정책 없음)
create policy missions_owner_select on public.daily_missions
  for select to authenticated
  using (exists (
    select 1 from public.children c
    where c.id = daily_missions.child_id and c.parent_id = (select auth.uid())
  ));

create policy answers_owner_select on public.mission_answers
  for select to authenticated
  using (exists (
    select 1 from public.daily_missions m
    join public.children c on c.id = m.child_id
    where m.id = mission_answers.mission_id and c.parent_id = (select auth.uid())
  ));

create policy rewards_owner_select on public.mission_rewards
  for select to authenticated
  using (exists (
    select 1 from public.daily_missions m
    join public.children c on c.id = m.child_id
    where m.id = mission_rewards.mission_id and c.parent_id = (select auth.uid())
  ));

create policy study_owner_select on public.study_logs
  for select to authenticated
  using (exists (
    select 1 from public.children c
    where c.id = study_logs.child_id and c.parent_id = (select auth.uid())
  ));

-- ---------- 내부 도우미 함수 ----------

-- 이 아이가 현재 로그인한 부모의 아이인지 확인
create or replace function public.assert_child_owner(p_child_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.children
    where id = p_child_id and parent_id = auth.uid()
  ) then
    raise exception 'not_allowed';
  end if;
end;
$$;

-- 화면에 보낼 미션 상태 (정답 값은 절대 포함하지 않음)
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
        || (case when q.operator = '+' then '+' else '−' end) || ' '
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
      'rewardCoins', m.reward_coins
    ),
    'currentQuestion', current_q
  );
end;
$$;

-- ---------- 공개 함수 (앱이 호출) ----------

-- 1) 오늘의 미션 가져오기 (없으면 만들고, 있으면 그대로 반환)
create or replace function public.ensure_today_mission(
  p_child_id uuid,
  p_mission_date date,
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
  p jsonb;
begin
  perform public.assert_child_owner(p_child_id);

  insert into public.daily_missions (
    child_id, mission_date, title, total_questions, reward_xp, reward_coins
  )
  values (
    p_child_id, p_mission_date, p_title,
    jsonb_array_length(p_problems), p_reward_xp, p_reward_coins
  )
  on conflict (child_id, mission_date) do nothing
  returning id into v_id;

  if v_id is null then
    select id into v_id from public.daily_missions
    where child_id = p_child_id and mission_date = p_mission_date;
  else
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

-- 2) 정답 제출 (서버에서 정답 검사)
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
  -- 행 잠금: 같은 미션에 동시에 들어온 요청이 순서대로 처리됩니다.
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
  if p_input < 0 or p_input > 99 then
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
      'correctAnswer', prob.answer
    ),
    'view', public.build_mission_view(m.id)
  );
end;
$$;

-- 3) 보상 받기 (한 번만 지급)
create or replace function public.claim_reward(p_mission_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  m public.daily_missions%rowtype;
begin
  select * into m from public.daily_missions where id = p_mission_id for update;
  if not found then
    raise exception 'mission_not_found';
  end if;
  perform public.assert_child_owner(m.child_id);

  -- 이미 받은 보상이면 아무것도 더하지 않습니다.
  if m.status = 'rewarded' then
    return jsonb_build_object(
      'reward', jsonb_build_object('xp', 0, 'coins', 0, 'alreadyClaimed', true),
      'view', public.build_mission_view(m.id)
    );
  end if;

  if m.status <> 'completed' then
    raise exception 'not_completed';
  end if;

  -- mission_rewards 의 기본키 덕분에 두 번 기록될 수 없습니다.
  insert into public.mission_rewards (mission_id, xp, coins)
  values (m.id, m.reward_xp, m.reward_coins);

  update public.children
  set total_xp = total_xp + m.reward_xp,
      coins = coins + m.reward_coins
  where id = m.child_id;

  update public.daily_missions set status = 'rewarded' where id = m.id;

  return jsonb_build_object(
    'reward', jsonb_build_object('xp', m.reward_xp, 'coins', m.reward_coins, 'alreadyClaimed', false),
    'view', public.build_mission_view(m.id)
  );
end;
$$;

-- ---------- 함수 실행 권한 ----------

revoke execute on function public.assert_child_owner(uuid) from public, anon, authenticated;
revoke execute on function public.build_mission_view(uuid) from public, anon, authenticated;

grant execute on function public.ensure_today_mission(uuid, date, text, integer, integer, jsonb) to authenticated;
grant execute on function public.submit_answer(uuid, integer, integer) to authenticated;
grant execute on function public.claim_reward(uuid) to authenticated;
