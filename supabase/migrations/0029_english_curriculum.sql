-- =====================================================================
-- 0029: 영어 단어를 학년·학기에 배정 (레벨 기준, 번호 순서로 학기 나눔)
-- - 레벨 1 (266개) → 3학년 1·2학기
-- - 레벨 2 (265개) → 4학년 1·2학기
-- - 레벨 3 (265개) → 5학년 1·2학기, 6학년 1·2학기
-- 같은 레벨 안에서는 id 순서대로 앞쪽 절반이 1학기, 뒤쪽 절반이 2학기입니다.
-- 0028 을 먼저 실행한 뒤, SQL Editor 에 붙여넣고 Run 하세요. 한 번만 실행합니다.
-- =====================================================================

alter table public.english_words
  add column if not exists curriculum_grade smallint,
  add column if not exists curriculum_semester smallint;

with r as (
  select id, level,
         row_number() over (partition by level order by id) - 1 as idx,
         count(*) over (partition by level) as total
  from public.english_words
),
c as (
  select id, level, idx, total,
         case
           when level = 1 then 3
           when level = 2 then 4
           when floor(idx * 4.0 / total) < 2 then 5
           else 6
         end as g,
         case
           when level = 3 then (floor(idx * 4.0 / total)::int % 2) + 1
           when idx < total / 2 then 1
           else 2
         end as s
  from r
)
update public.english_words w
set curriculum_grade = c.g,
    curriculum_semester = c.s
from c
where w.id = c.id;

alter table public.english_words
  drop constraint if exists english_words_curriculum_grade_check;
alter table public.english_words
  add constraint english_words_curriculum_grade_check
  check (curriculum_grade is null or curriculum_grade between 3 and 6);

alter table public.english_words
  drop constraint if exists english_words_curriculum_semester_check;
alter table public.english_words
  add constraint english_words_curriculum_semester_check
  check (curriculum_semester is null or curriculum_semester in (1, 2));
