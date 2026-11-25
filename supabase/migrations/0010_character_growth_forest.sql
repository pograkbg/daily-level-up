-- =====================================================================
-- 0010: 캐릭터 성장 (성충 → 새 친구 고르기) · 배움의 숲(도감)
-- 0009 까지 실행한 뒤, 이 파일을 SQL Editor 에 붙여넣고 Run 하세요.
-- 성충 기준: 캐릭터 경험치 3,600 (레벨 9)
-- =====================================================================

-- ---------- 컬럼 ----------

alter table public.children
  add column if not exists char_xp integer not null default 0 check (char_xp >= 0),
  add column if not exists pending_new_character boolean not null default false;

alter table public.children drop constraint if exists children_character_id_check;
alter table public.children
  add constraint children_character_id_check
  check (character_id in ('honeybee', 'mantis', 'grasshopper', 'cicada', 'ladybug', 'butterfly', 'dragonfly', 'ant'));

-- 배움의 숲: 성충이 된 친구 기록
create table if not exists public.child_collection (
  child_id uuid not null references public.children (id) on delete cascade,
  insect_id text not null,
  grown_at timestamptz not null default now(),
  primary key (child_id, insect_id)
);

alter table public.child_collection enable row level security;

drop policy if exists collection_owner_select on public.child_collection;
create policy collection_owner_select on public.child_collection
  for select to authenticated
  using (exists (
    select 1 from public.children c
    where c.id = child_collection.child_id and c.parent_id = (select auth.uid())
  ));

-- ---------- 캐릭터 경험치 올리기 (성충이면 기록하고 새 친구 선택 대기) ----------

create or replace function public.grow_character(p_child_id uuid, p_gain integer)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  c public.children%rowtype;
begin
  select * into c from public.children where id = p_child_id for update;
  -- 성충이 되어 새 친구를 고르기 전에는 더 자라지 않습니다.
  if c.pending_new_character then
    return;
  end if;

  if c.char_xp + p_gain >= 3600 then
    update public.children
    set char_xp = 3600, pending_new_character = true
    where id = p_child_id;
    insert into public.child_collection (child_id, insect_id)
    values (p_child_id, c.character_id)
    on conflict (child_id, insect_id) do nothing;
  else
    update public.children set char_xp = c.char_xp + p_gain where id = p_child_id;
  end if;
end;
$$;

-- ---------- 새 친구 고르기 (성충 후) ----------

create or replace function public.choose_new_character(p_child_id uuid, p_insect text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  c public.children%rowtype;
begin
  perform public.assert_child_owner(p_child_id);
  select * into c from public.children where id = p_child_id for update;
  if not c.pending_new_character then
    raise exception 'not_pending';
  end if;
  if p_insect not in ('honeybee', 'mantis', 'grasshopper', 'cicada', 'ladybug', 'butterfly', 'dragonfly', 'ant') then
    raise exception 'invalid_insect';
  end if;
  if exists (select 1 from public.child_collection where child_id = p_child_id and insect_id = p_insect) then
    raise exception 'already_grown';
  end if;

  update public.children
  set character_id = p_insect, char_xp = 0, pending_new_character = false
  where id = p_child_id;
end;
$$;

-- ---------- 보상 받기: 누적 경험치 + 캐릭터 성장 + 연속 학습 ----------

create or replace function public.claim_reward(p_mission_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  m public.daily_missions%rowtype;
  c public.children%rowtype;
  new_streak integer;
begin
  select * into m from public.daily_missions where id = p_mission_id for update;
  if not found then
    raise exception 'mission_not_found';
  end if;
  perform public.assert_child_owner(m.child_id);

  if m.status = 'rewarded' then
    return jsonb_build_object(
      'reward', jsonb_build_object('xp', 0, 'coins', 0, 'alreadyClaimed', true),
      'view', public.build_mission_view(m.id)
    );
  end if;

  if m.status <> 'completed' then
    raise exception 'not_completed';
  end if;

  insert into public.mission_rewards (mission_id, xp, coins)
  values (m.id, m.reward_xp, m.reward_coins);

  select * into c from public.children where id = m.child_id for update;

  if c.last_study_date = m.mission_date then
    new_streak := c.streak_days;
  elsif c.last_study_date = m.mission_date - 1 then
    new_streak := c.streak_days + 1;
  else
    new_streak := 1;
  end if;

  update public.children
  set total_xp = total_xp + m.reward_xp,
      coins = coins + m.reward_coins,
      streak_days = new_streak,
      last_study_date = m.mission_date
  where id = m.child_id;

  perform public.grow_character(m.child_id, m.reward_xp);

  update public.daily_missions set status = 'rewarded' where id = m.id;

  return jsonb_build_object(
    'reward', jsonb_build_object('xp', m.reward_xp, 'coins', m.reward_coins, 'alreadyClaimed', false),
    'view', public.build_mission_view(m.id)
  );
end;
$$;

-- ---------- 영어 정답: 누적 경험치 + 캐릭터 성장 (정답 1개 = 5) ----------

create or replace function public.answer_english_quiz(
  p_item_id uuid,
  p_choice integer
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  it public.english_quiz_items%rowtype;
  s public.english_quiz_sessions%rowtype;
  w public.english_words%rowtype;
  v_correct boolean;
begin
  select * into it from public.english_quiz_items where id = p_item_id for update;
  if not found then
    raise exception 'item_not_found';
  end if;
  select * into s from public.english_quiz_sessions where id = it.session_id;
  perform public.assert_child_owner(s.child_id);

  if it.answered_choice is not null then
    raise exception 'already_answered';
  end if;
  if not (p_choice = any(it.choices)) then
    raise exception 'invalid_choice';
  end if;

  select * into w from public.english_words where id = it.word_id;
  v_correct := (p_choice = it.word_id);

  update public.english_quiz_items
  set answered_choice = p_choice, correct = v_correct
  where id = it.id;

  insert into public.english_progress (child_id, word_id, correct_count, attempt_count, last_seen_at)
  values (s.child_id, it.word_id, case when v_correct then 1 else 0 end, 1, now())
  on conflict (child_id, word_id) do update
  set attempt_count = public.english_progress.attempt_count + 1,
      correct_count = public.english_progress.correct_count + (case when v_correct then 1 else 0 end),
      last_seen_at = now();

  if v_correct then
    update public.children set total_xp = total_xp + 5 where id = s.child_id;
    perform public.grow_character(s.child_id, 5);
  end if;

  return jsonb_build_object(
    'correct', v_correct,
    'correctWordId', w.id,
    'correctMeaning', w.meaning_ko,
    'example', w.example_en,
    'exampleKo', w.example_ko
  );
end;
$$;

-- ---------- 실행 권한 ----------

revoke execute on function public.grow_character(uuid, integer) from public, anon, authenticated;
grant execute on function public.choose_new_character(uuid, text) to authenticated;
grant execute on function public.claim_reward(uuid) to authenticated;
grant execute on function public.answer_english_quiz(uuid, integer) to authenticated;
