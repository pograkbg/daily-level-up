-- =====================================================================
-- 0020: 영어 퀴즈 보기에서 "뜻이 같은 단어"를 제외
-- 같은 뜻 단어(예: hat / cap 모두 "모자")가 보기로 같이 나오면 정답이 두 개가 되므로,
-- 정답과 뜻이 같은 단어는 오답 보기로 뽑지 않습니다.
-- 0019 를 먼저 실행한 뒤, SQL Editor 에 붙여넣고 Run 하세요.
-- =====================================================================

create or replace function public.start_english_quiz(
  p_child_id uuid,
  p_level integer,
  p_count integer,
  p_wrong_only boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_session uuid;
  v_max integer;
  v_pool integer;
  v_n integer;
  rw record;
  v_choices integer[];
  v_idx integer := 0;
begin
  perform public.assert_child_owner(p_child_id);
  if p_level < 1 or p_level > 3 then
    raise exception 'invalid_level';
  end if;
  select english_max_level into v_max from public.children where id = p_child_id;
  if p_level > v_max then
    raise exception 'level_locked';
  end if;
  if p_count < 1 or p_count > 20 then
    raise exception 'invalid_count';
  end if;

  -- 하루 최대 5회 (수학 회차와 같은 제한)
  if (
    select count(*) from public.english_quiz_sessions s
    where s.child_id = p_child_id
      and (s.created_at at time zone 'Asia/Seoul')::date = (now() at time zone 'Asia/Seoul')::date
  ) >= 5 then
    raise exception 'english_daily_limit';
  end if;

  select count(*) into v_pool
  from public.english_words w
  where w.level = p_level
    and (not p_wrong_only or exists (
      select 1 from public.english_progress p
      where p.child_id = p_child_id and p.word_id = w.id and p.attempt_count > p.correct_count
    ));
  if v_pool = 0 then
    raise exception 'no_wrong_words';
  end if;
  v_n := least(p_count, v_pool);

  insert into public.english_quiz_sessions (child_id, level, total_questions)
  values (p_child_id, p_level, v_n)
  returning id into v_session;

  for rw in
    select w.id, w.meaning_ko from public.english_words w
    where w.level = p_level
      and (not p_wrong_only or exists (
        select 1 from public.english_progress p
        where p.child_id = p_child_id and p.word_id = w.id and p.attempt_count > p.correct_count
      ))
    order by random()
    limit v_n
  loop
    -- 오답 보기: 같은 레벨, 정답과 다른 단어, 그리고 뜻이 같지 않은 단어만
    select array_agg(x order by random()) into v_choices
    from unnest(
      array[rw.id] || array(
        select d.id from public.english_words d
        where d.level = p_level
          and d.id <> rw.id
          -- 뜻을 쉼표·슬래시로 나눠서, 하나라도 겹치면 보기에서 뺍니다. 예: "남자" vs "남자,녀석"
          and not (
            array(select trim(x) from unnest(regexp_split_to_array(d.meaning_ko, '[,/·]')) as x)
            && array(select trim(y) from unnest(regexp_split_to_array(rw.meaning_ko, '[,/·]')) as y)
          )
        order by random()
        limit 3
      )
    ) as x;

    insert into public.english_quiz_items (session_id, idx, word_id, choices)
    values (v_session, v_idx, rw.id, v_choices);
    v_idx := v_idx + 1;
  end loop;

  return jsonb_build_object(
    'sessionId', v_session,
    'items', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'id', i.id,
        'idx', i.idx,
        'word', ew.word,
        'choices', (
          select jsonb_agg(jsonb_build_object('id', cw.id, 'meaning', cw.meaning_ko) order by array_position(i.choices, cw.id))
          from public.english_words cw
          where cw.id = any(i.choices)
        )
      ) order by i.idx), '[]'::jsonb)
      from public.english_quiz_items i
      join public.english_words ew on ew.id = i.word_id
      where i.session_id = v_session
    )
  );
end;
$$;
