-- =====================================================================
-- 0013: 관리자 (가입 승인 처리 화면용)
-- 0012 를 먼저 실행한 뒤, SQL Editor 에 붙여넣고 Run 하세요.
-- 관리자는 is_admin 값으로 정합니다. 처음 한 번만 아래 "관리자 지정" 줄을 직접 실행하세요.
-- =====================================================================

alter table public.account_approvals
  add column if not exists is_admin boolean not null default false;

-- 지금 로그인한 사람이 관리자인지
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select a.is_admin from public.account_approvals a where a.user_id = (select auth.uid())),
    false
  );
$$;

-- 전체 계정 목록 (관리자만)
create or replace function public.admin_list_accounts()
returns table (user_id uuid, email text, approved boolean, is_admin boolean, created_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'not_admin';
  end if;
  return query
    select a.user_id, u.email::text, a.approved, a.is_admin, a.created_at
    from public.account_approvals a
    join auth.users u on u.id = a.user_id
    order by a.approved asc, a.created_at desc;
end;
$$;

-- 승인 또는 승인 취소 (관리자만)
create or replace function public.admin_set_approval(p_user_id uuid, p_approved boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'not_admin';
  end if;
  if p_user_id = (select auth.uid()) and p_approved = false then
    raise exception 'cannot_unapprove_self';
  end if;
  update public.account_approvals set approved = p_approved where user_id = p_user_id;
end;
$$;

grant execute on function public.is_admin() to authenticated;
grant execute on function public.admin_list_accounts() to authenticated;
grant execute on function public.admin_set_approval(uuid, boolean) to authenticated;

-- ---------- 관리자 지정 (처음 한 번, 본인 이메일로 바꿔서 실행) ----------
-- update public.account_approvals
-- set is_admin = true, approved = true
-- where user_id = (select id from auth.users where email = '본인이메일@example.com');
