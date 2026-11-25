-- =====================================================================
-- 0019: 계정 중지 / 완전 삭제 (관리자 전용)
-- 0018 을 먼저 실행한 뒤, SQL Editor 에 붙여넣고 Run 하세요.
-- 1단계 중지: 로그인은 막고 데이터는 그대로 둡니다. 되돌릴 수 있습니다.
-- 2단계 완전 삭제: 중지된 계정만 지웁니다. 같은 이메일로 다시 가입할 수 있습니다.
-- =====================================================================

alter table public.account_approvals
  add column if not exists suspended boolean not null default false;

-- 계정 목록에 중지 여부를 함께 보여 줍니다. (반환 모양이 바뀌므로 먼저 지웁니다)
drop function if exists public.admin_list_accounts();

create or replace function public.admin_list_accounts()
returns table (user_id uuid, email text, approved boolean, is_admin boolean, suspended boolean, created_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'not_admin';
  end if;
  return query
    select a.user_id, u.email::text, a.approved, a.is_admin, a.suspended, a.created_at
    from public.account_approvals a
    join auth.users u on u.id = a.user_id
    order by a.suspended asc, a.approved asc, a.created_at desc;
end;
$$;

-- 중지 또는 중지 해제 (관리자만, 본인과 다른 관리자는 불가)
create or replace function public.admin_set_suspended(p_user_id uuid, p_suspended boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'not_admin';
  end if;
  if p_user_id = (select auth.uid()) then
    raise exception 'cannot_suspend_self';
  end if;
  if exists (select 1 from public.account_approvals where user_id = p_user_id and is_admin) then
    raise exception 'cannot_suspend_admin';
  end if;
  update public.account_approvals set suspended = p_suspended where user_id = p_user_id;
end;
$$;

-- 완전 삭제 (관리자만, 중지된 계정만). 아이 데이터와 계정을 모두 지웁니다.
create or replace function public.admin_delete_account(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'not_admin';
  end if;
  if p_user_id = (select auth.uid()) then
    raise exception 'cannot_delete_self';
  end if;
  if exists (select 1 from public.account_approvals where user_id = p_user_id and is_admin) then
    raise exception 'cannot_delete_admin';
  end if;
  if not exists (select 1 from public.account_approvals where user_id = p_user_id and suspended) then
    raise exception 'must_suspend_first';
  end if;

  -- 아이 데이터 (아이 행을 지우면 미션·퀴즈·도감 등 하위 기록도 함께 지워집니다)
  delete from public.children where parent_id = p_user_id;
  delete from public.account_approvals where user_id = p_user_id;
  -- 계정 자체 (같은 이메일로 다시 가입할 수 있게 됩니다)
  delete from auth.users where id = p_user_id;
end;
$$;

grant execute on function public.admin_list_accounts() to authenticated;
grant execute on function public.admin_set_suspended(uuid, boolean) to authenticated;
grant execute on function public.admin_delete_account(uuid) to authenticated;
