-- =====================================================================
-- 0016: 관리자가 직접 연 영어 레벨 (앞 레벨을 깨지 않아도 열림)
-- 0015 를 먼저 실행한 뒤, SQL Editor 에 붙여넣고 Run 하세요.
-- =====================================================================

alter table public.children
  add column if not exists english_manual_max integer not null default 0
  check (english_manual_max between 0 and 3);

-- 관리자가 영어 레벨을 고치면 열린 레벨과 "수동으로 연 레벨"을 함께 기록합니다.
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
  update public.children
  set english_max_level = p_level,
      english_manual_max = p_level
  where id = p_child_id;
end;
$$;

-- 초기화하면 수동으로 연 기록도 함께 지웁니다.
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

  delete from public.daily_missions where child_id = p_child_id;
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
    english_manual_max = 0,
    practice_mode = default,
    practice_bands = default
  where id = p_child_id;
end;
$$;
