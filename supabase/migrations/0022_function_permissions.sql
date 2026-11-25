-- =====================================================================
-- 0022: DB 함수 실행 권한 정리 (보안)
-- 기본 설정은 모든 함수를 PUBLIC(로그인하지 않은 anon 포함)이 호출할 수 있습니다.
-- 이 파일은 public 스키마의 모든 함수에서 PUBLIC·anon 권한을 빼고,
-- 앱이 호출하는 함수만 로그인 사용자(authenticated)에게 다시 허용합니다.
-- 0021 까지 실행한 뒤, SQL Editor 에 붙여넣고 Run 하세요.
-- =====================================================================

-- 1) 모든 public 함수: PUBLIC·anon 실행 권한 제거
do $$
declare
  r record;
begin
  for r in
    select p.oid::regprocedure as fn
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
  loop
    execute format('revoke execute on function %s from public, anon', r.fn);
  end loop;
end
$$;

-- 2) 내부 전용 함수: 로그인 사용자도 직접 호출하지 못하게 (다른 함수 안에서는 정상 동작)
revoke execute on function public.assert_child_owner(uuid) from authenticated;
revoke execute on function public.add_op_xp(jsonb, text, integer) from authenticated;
revoke execute on function public.grow_character(uuid, integer) from authenticated;
revoke execute on function public.build_mission_view(uuid) from authenticated;
revoke execute on function public.handle_new_account() from authenticated;

-- 3) 앱이 호출하는 함수: 로그인 사용자에게만 허용
--    (이미 허용된 것도 다시 허용해도 같은 결과입니다)
grant execute on function public.is_admin() to authenticated;
grant execute on function public.admin_list_accounts() to authenticated;
grant execute on function public.admin_set_approval(uuid, boolean) to authenticated;
grant execute on function public.admin_list_children() to authenticated;
grant execute on function public.admin_set_math_levels(uuid, jsonb) to authenticated;
grant execute on function public.admin_set_english_max(uuid, integer) to authenticated;
grant execute on function public.admin_reset_child(uuid) to authenticated;
grant execute on function public.pick_examples(uuid, integer, integer) to authenticated;
grant execute on function public.get_wrong_math(uuid, integer) to authenticated;
grant execute on function public.get_wrong_english(uuid, integer) to authenticated;
grant execute on function public.get_child_stats(uuid, date) to authenticated;
grant execute on function public.get_english_stats(uuid, date) to authenticated;
grant execute on function public.get_english_wrong_words(uuid, integer) to authenticated;
grant execute on function public.start_english_quiz(uuid, integer, integer, boolean) to authenticated;
grant execute on function public.answer_english_quiz(uuid, integer, integer) to authenticated;
grant execute on function public.set_english_max_level(uuid, integer) to authenticated;
grant execute on function public.set_practice(uuid, text, jsonb) to authenticated;
grant execute on function public.approve_next_grade(uuid) to authenticated;
grant execute on function public.claim_reward(uuid) to authenticated;
grant execute on function public.submit_answer(uuid, integer, integer, integer) to authenticated;
grant execute on function public.start_mission(uuid, date, integer, text, text, integer, integer, jsonb) to authenticated;
grant execute on function public.choose_new_character(uuid, text) to authenticated;
