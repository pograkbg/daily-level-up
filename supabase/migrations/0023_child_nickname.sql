-- =====================================================================
-- 0023: 아이 이름 바꾸기 (보호자 본인의 아이만)
-- 0022 를 먼저 실행한 뒤, SQL Editor 에 붙여넣고 Run 하세요.
-- =====================================================================

create or replace function public.set_child_nickname(p_child_id uuid, p_nickname text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_name text := trim(coalesce(p_nickname, ''));
begin
  perform public.assert_child_owner(p_child_id);
  if char_length(v_name) < 1 or char_length(v_name) > 20 then
    raise exception 'invalid_nickname';
  end if;
  update public.children set nickname = v_name where id = p_child_id;
end;
$$;

grant execute on function public.set_child_nickname(uuid, text) to authenticated;
