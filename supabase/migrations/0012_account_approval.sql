-- =====================================================================
-- 0012: 계정 승인 (새 가입은 관리자가 승인해야 이용할 수 있습니다)
-- 0001 ~ 0011 을 먼저 실행한 뒤, SQL Editor 에 붙여넣고 Run 하세요.
-- =====================================================================

create table if not exists public.account_approvals (
  user_id uuid primary key references auth.users (id) on delete cascade,
  approved boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.account_approvals enable row level security;

-- 본인의 승인 상태만 읽을 수 있습니다. 바꾸는 것은 관리자(Supabase 대시보드)만 합니다.
drop policy if exists approvals_owner_select on public.account_approvals;
create policy approvals_owner_select on public.account_approvals
  for select to authenticated
  using (user_id = (select auth.uid()));

grant select on public.account_approvals to authenticated;

-- 지금까지 가입된 계정은 이미 쓰고 있으므로 승인 상태로 둡니다.
insert into public.account_approvals (user_id, approved)
select id, true from auth.users
on conflict (user_id) do nothing;

-- 앞으로 새로 가입한 계정은 "승인 대기"로 시작합니다.
create or replace function public.handle_new_account()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.account_approvals (user_id, approved)
  values (new.id, false)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_approval on auth.users;
create trigger on_auth_user_created_approval
  after insert on auth.users
  for each row execute function public.handle_new_account();
