-- =====================================================================
-- 0008: 영어 레벨 잠금 (선택한 레벨까지만 열림)
-- 0007 을 먼저 실행한 뒤, 이 파일을 SQL Editor 에 붙여넣고 Run 하세요.
-- =====================================================================

alter table public.children
  add column if not exists english_max_level smallint not null default 1
    check (english_max_level between 1 and 5);

-- 보호자가 열 수 있는 가장 높은 영어 레벨을 정합니다.
create or replace function public.set_english_max_level(p_child_id uuid, p_level integer)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.assert_child_owner(p_child_id);
  if p_level < 1 or p_level > 5 then
    raise exception 'invalid_level';
  end if;
  update public.children set english_max_level = p_level where id = p_child_id;
end;
$$;

-- 퀴즈 시작: 잠긴 레벨이면 거절합니다.
create or replace function public.start_english_quiz(
  p_child_id uuid,
  p_level integer,
  p_count integer
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_session uuid;
  v_max integer;
  w record;
  v_choices integer[];
  v_idx integer := 0;
begin
  perform public.assert_child_owner(p_child_id);
  if p_level < 1 or p_level > 5 then
    raise exception 'invalid_level';
  end if;
  select english_max_level into v_max from public.children where id = p_child_id;
  if p_level > v_max then
    raise exception 'level_locked';
  end if;
  if p_count < 1 or p_count > 20 then
    raise exception 'invalid_count';
  end if;

  insert into public.english_quiz_sessions (child_id, level, total_questions)
  values (p_child_id, p_level, p_count)
  returning id into v_session;

  for w in
    select id from public.english_words
    where level = p_level
    order by random()
    limit p_count
  loop
    select array_agg(x order by random()) into v_choices
    from unnest(
      array[w.id] || array(
        select d.id from public.english_words d
        where d.level = p_level and d.id <> w.id
        order by random()
        limit 3
      )
    ) as x;

    insert into public.english_quiz_items (session_id, idx, word_id, choices)
    values (v_session, v_idx, w.id, v_choices);
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

grant execute on function public.set_english_max_level(uuid, integer) to authenticated;
grant execute on function public.start_english_quiz(uuid, integer, integer) to authenticated;
