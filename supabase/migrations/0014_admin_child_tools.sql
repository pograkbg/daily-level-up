-- =====================================================================
-- 0014: 관리자 도구 (아이별 레벨 수동 설정, 한 아이의 모든 데이터 초기화)
-- 0013 을 먼저 실행한 뒤, SQL Editor 에 붙여넣고 Run 하세요.
-- 모든 함수는 관리자(is_admin)만 쓸 수 있습니다.
-- 계정(로그인)과 승인 상태, 아이 이름·학년은 지우지 않습니다.
-- =====================================================================

-- ---------- 아이 목록 (관리자용) ----------
create or replace function public.admin_list_children()
returns table (
  child_id uuid,
  nickname text,
  grade integer,
  parent_email text,
  study_progress jsonb,
  english_max_level integer,
  total_xp integer
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'not_admin';
  end if;
  return query
    select c.id, c.nickname::text, c.grade::integer, u.email::text, c.study_progress,
           c.english_max_level::integer, c.total_xp::integer
    from public.children c
    join auth.users u on u.id = c.parent_id
    order by c.created_at;
end;
$$;

-- ---------- 연산별 레벨 수동 설정 ----------
-- p_levels 예: {"+": 3, "-": 2, "×": 1, "÷": 1}  (각 1~15, 경험치는 0으로 맞춥니다)
create or replace function public.admin_set_math_levels(p_child_id uuid, p_levels jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  op text;
  lv integer;
  v_progress jsonb := '{}'::jsonb;
begin
  if not public.is_admin() then
    raise exception 'not_admin';
  end if;
  foreach op in array array['+', '-', '×', '÷'] loop
    lv := (p_levels ->> op)::integer;
    if lv is null or lv < 1 or lv > 15 then
      raise exception 'invalid_level';
    end if;
    v_progress := jsonb_set(v_progress, array[op], jsonb_build_object('level', lv, 'xp', 0));
  end loop;
  update public.children set study_progress = v_progress where id = p_child_id;
end;
$$;

-- ---------- 영어 열린 최고 레벨 수동 설정 (1~3) ----------
create or replace function public.admin_set_english_max(p_child_id uuid, p_level integer)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'not_admin';
  end if;
  if p_level < 1 or p_level > 3 then
    raise exception 'invalid_level';
  end if;
  update public.children set english_max_level = p_level where id = p_child_id;
end;
$$;

-- ---------- 한 아이의 모든 데이터 초기화 ----------
-- 지우는 것: 미션·문제·답·보상, 영어 퀴즈·단어 기록, 숲 도감, 공부 시간 기록, 진도, 코인, 캐릭터 상태
-- 남기는 것: 계정, 아이 이름·학년, 아이 행 자체
create or replace function public.admin_reset_child(p_child_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'not_admin';
  end if;
  if not exists (select 1 from public.children where id = p_child_id) then
    raise exception 'child_not_found';
  end if;

  -- 미션을 지우면 문제·답·보상 기록도 함께 지워집니다.
  delete from public.daily_missions where child_id = p_child_id;
  -- 퀴즈 세션을 지우면 문제(item)도 함께 지워집니다.
  delete from public.english_quiz_sessions where child_id = p_child_id;
  delete from public.english_progress where child_id = p_child_id;
  delete from public.child_collection where child_id = p_child_id;
  delete from public.study_logs where child_id = p_child_id;

  update public.children set
    study_progress = default,
    total_xp = 0,
    char_xp = 0,
    coins = 0,
    streak_days = 0,
    last_study_date = null,
    character_id = 'honeybee',
    pending_new_character = false,
    next_grade_approved = false,
    english_max_level = 1,
    practice_mode = default,
    practice_bands = default
  where id = p_child_id;
end;
$$;

grant execute on function public.admin_list_children() to authenticated;
grant execute on function public.admin_set_math_levels(uuid, jsonb) to authenticated;
grant execute on function public.admin_set_english_max(uuid, integer) to authenticated;
grant execute on function public.admin_reset_child(uuid) to authenticated;
