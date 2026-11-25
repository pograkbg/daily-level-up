-- =====================================================================
-- 0024: 영어 퀴즈 이어 풀기
-- 오늘 같은 레벨(오답만 풀기 포함)의 아직 다 못 푼 퀴즈가 있으면 새로 만들지 않고 그대로 이어서 돌려줍니다.
-- 이어 푸는 동안에는 하루 5회 제한에 횟수가 더해지지 않습니다.
-- 0020 을 먼저 실행한 뒤, SQL Editor 에 붙여넣고 Run 하세요.
-- =====================================================================

-- 오답만 풀기 세션인지 기록 (이어 풀기에서 일반 퀴즈와 섞이지 않게)
alter table public.english_quiz_sessions
  add column if not exists wrong_only boolean not null default false;

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
  v_start integer;
  v_score integer;
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

  -- 1) 오늘 같은 조건의 미완료 세션이 있으면 이어서 풉니다 (새 횟수 차감 없음)
  select s.id into v_session
  from public.english_quiz_sessions s
  where s.child_id = p_child_id
    and s.level = p_level
    and s.wrong_only = p_wrong_only
    and (s.created_at at time zone 'Asia/Seoul')::date = (now() at time zone 'Asia/Seoul')::date
    and exists (
      select 1 from public.english_quiz_items i
      where i.session_id = s.id and i.answered_choice is null
    )
  order by s.created_at desc
  limit 1;

  if v_session is null then
    -- 2) 새 퀴즈: 하루 최대 5회 (수학 회차와 같은 제한)
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

    insert into public.english_quiz_sessions (child_id, level, total_questions, wrong_only)
    values (p_child_id, p_level, v_n, p_wrong_only)
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
  end if;

  -- 이미 푼 문제 수(앞에서부터 순서대로 풀므로 앞쪽이 푼 문제)와 맞힌 개수
  select count(*) filter (where i.answered_choice is not null),
         count(*) filter (where i.correct)
    into v_start, v_score
  from public.english_quiz_items i
  where i.session_id = v_session;

  return jsonb_build_object(
    'sessionId', v_session,
    'startIndex', v_start,
    'score', v_score,
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

revoke execute on function public.start_english_quiz(uuid, integer, integer, boolean) from public, anon;
grant execute on function public.start_english_quiz(uuid, integer, integer, boolean) to authenticated;
