-- =====================================================================
-- 0021: 레벨을 깨면 "올라갈까요?" 묻기
-- 0020 을 먼저 실행한 뒤, SQL Editor 에 붙여넣고 Run 하세요.
-- 경험치가 250을 채우면 바로 올리지 않고 ready 표시만 합니다.
-- 아이가 "올라가기"를 고르면 다음 레벨, "올라가지 않기"를 고르면 그 레벨에 머뭅니다.
-- =====================================================================

-- 정답 1개: 경험치 5 더하기. 250을 채우면 ready 표시 (단, 올라가지 않기를 고른 연산은 묻지 않음)
create or replace function public.add_op_xp(p_progress jsonb, p_op text, p_gain integer)
returns jsonb
language plpgsql
immutable
set search_path = ''
as $$
declare
  v_entry jsonb := coalesce(p_progress -> p_op, '{"level": 1, "xp": 0}'::jsonb);
  v_level integer := (v_entry ->> 'level')::integer;
  v_xp integer := least(250, (v_entry ->> 'xp')::integer + p_gain);
  v_hold boolean := coalesce((v_entry ->> 'hold')::boolean, false);
  v_ready boolean := coalesce((v_entry ->> 'ready')::boolean, false)
    or (v_xp >= 250 and v_level < 15 and not v_hold);
begin
  return jsonb_set(
    p_progress,
    array[p_op],
    v_entry || jsonb_build_object('level', v_level, 'xp', v_xp, 'ready', v_ready)
  );
end;
$$;

-- 아이의 선택 반영: accept = true 면 다음 레벨, false 면 올라가지 않고 머무름
create or replace function public.resolve_level_up(p_child_id uuid, p_op text, p_accept boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_progress jsonb;
  v_entry jsonb;
  v_level integer;
begin
  perform public.assert_child_owner(p_child_id);
  if p_op not in ('+', '-', '×', '÷') then
    raise exception 'invalid_operator';
  end if;

  select study_progress into v_progress from public.children where id = p_child_id for update;
  v_entry := coalesce(v_progress -> p_op, '{"level": 1, "xp": 0}'::jsonb);
  v_level := (v_entry ->> 'level')::integer;

  if p_accept then
    v_entry := jsonb_build_object('level', least(15, v_level + 1), 'xp', 0, 'ready', false, 'hold', false);
  else
    v_entry := jsonb_build_object('level', v_level, 'xp', 0, 'ready', false, 'hold', true);
  end if;

  update public.children
  set study_progress = jsonb_set(v_progress, array[p_op], v_entry)
  where id = p_child_id;
end;
$$;

grant execute on function public.resolve_level_up(uuid, text, boolean) to authenticated;
