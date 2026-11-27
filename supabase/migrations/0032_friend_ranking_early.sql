-- =====================================================================
-- 0032: 친구 랭킹에 놀이·단원 연습·단어 기록 시간 포함
-- 수학 미션, 영어 퀴즈 시간에 early_attempts(유아·1학년 놀이, 단원 연습, 2학년 단어) 시간을 더합니다.
-- 0031 을 먼저 실행한 뒤, SQL Editor 에 붙여넣고 Run 하세요. 한 번만 실행합니다.
-- =====================================================================

create or replace function public.friend_ranking()
returns table (
  child_id uuid,
  nickname text,
  character_id text,
  char_xp integer,
  total_study_ms bigint,
  account_mask text
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- 호출한 사람이 승인되고 중지되지 않은 계정일 때만 목록을 줍니다.
  if not exists (
    select 1 from public.account_approvals a
    where a.user_id = (select auth.uid()) and a.approved and not a.suspended
  ) then
    raise exception 'not_allowed';
  end if;

  return query
    select
      c.id,
      c.nickname::text,
      c.character_id::text,
      c.char_xp::integer,
      (
        coalesce((
          select sum(ans.elapsed_ms) from public.mission_answers ans
          join public.daily_missions m on m.id = ans.mission_id
          where m.child_id = c.id
        ), 0)
        + coalesce((
          select sum(i.elapsed_ms) from public.english_quiz_items i
          join public.english_quiz_sessions s on s.id = i.session_id
          where s.child_id = c.id
        ), 0)
        + coalesce((
          select sum(e.elapsed_ms) from public.early_attempts e
          where e.child_id = c.id
        ), 0)
      )::bigint,
      (left(split_part(u.email::text, '@', 1), 3) || '***')::text
    from public.children c
    join auth.users u on u.id = c.parent_id
    join public.account_approvals a on a.user_id = c.parent_id
    where a.approved and not a.suspended;
end;
$$;

grant execute on function public.friend_ranking() to authenticated;
