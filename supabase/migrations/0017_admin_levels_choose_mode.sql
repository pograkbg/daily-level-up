-- =====================================================================
-- 0017: 관리자가 수학 레벨을 바꾸면 풀이 방식을 "지정"으로 바꿉니다.
-- 레벨 1~15 를 난이도(하 1~5, 중 6~10, 상 11~15)로 바꿔서 지정 난이도에 넣습니다.
-- 0016 을 먼저 실행한 뒤, SQL Editor 에 붙여넣고 Run 하세요.
-- =====================================================================

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
  v_bands jsonb := '{}'::jsonb;
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
    -- 레벨 1~5 = 하(0), 6~10 = 중(1), 11~15 = 상(2)
    v_bands := jsonb_set(v_bands, array[op], to_jsonb((lv - 1) / 5));
  end loop;

  -- 수동으로 레벨을 바꾸면 지정 모드로 바꾸고, 같은 난이도를 지정합니다.
  update public.children
  set study_progress = v_progress,
      practice_mode = 'choose',
      practice_bands = v_bands
  where id = p_child_id;
end;
$$;
