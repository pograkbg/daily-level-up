-- =====================================================================
-- 0019: 틀린 문제 다시 보기 (수학·영어)
-- 0018 을 먼저 실행한 뒤, SQL Editor 에 붙여넣고 Run 하세요.
-- 아이 본인의 기록만 읽을 수 있습니다 (assert_child_owner).
-- =====================================================================

-- ---------- 수학: 틀린 문제 목록 (최근 것부터) ----------
create or replace function public.get_wrong_math(p_child_id uuid, p_limit integer default 30)
returns table (
  mission_date date,
  idx smallint,
  left_operand integer,
  right_operand integer,
  operator text,
  correct_answer integer,
  my_answer integer,
  answered_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.assert_child_owner(p_child_id);

  return query
    select m.mission_date, p.idx, p.left_operand, p.right_operand, p.operator,
           p.answer, a.input, a.answered_at
    from public.mission_answers a
    join public.daily_missions m on m.id = a.mission_id
    join public.mission_problems p on p.mission_id = a.mission_id and p.idx = a.idx
    where m.child_id = p_child_id
      and a.is_correct = false
    order by a.answered_at desc
    limit greatest(p_limit, 0);
end;
$$;

-- ---------- 영어: 틀린 퀴즈 목록 (최근 것부터) ----------
create or replace function public.get_wrong_english(p_child_id uuid, p_limit integer default 30)
returns table (
  item_id uuid,
  word text,
  correct_meaning text,
  my_meaning text,
  example_en text,
  example_ko text,
  answered_on timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.assert_child_owner(p_child_id);

  return query
    select i.id, w.word::text, w.meaning_ko::text, cw.meaning_ko::text,
           w.example_en::text, w.example_ko::text, s.created_at
    from public.english_quiz_items i
    join public.english_quiz_sessions s on s.id = i.session_id
    join public.english_words w on w.id = i.word_id
    left join public.english_words cw on cw.id = i.answered_choice
    where s.child_id = p_child_id
      and i.answered_choice is not null
      and i.correct = false
    order by s.created_at desc, i.idx
    limit greatest(p_limit, 0);
end;
$$;

grant execute on function public.get_wrong_math(uuid, integer) to authenticated;
grant execute on function public.get_wrong_english(uuid, integer) to authenticated;
