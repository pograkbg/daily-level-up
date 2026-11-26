-- =====================================================================
-- 0025: 학년 자동 전환 + 유아(0학년) 추가
-- - grade_year: 저장된 학년(grade)이 적용된 학년도. 앱이 지금 날짜로 학년을 계산합니다.
-- - 기존 아이는 지금 학년도로 맞춰 두므로, 학년이 바로 바뀌지 않고 다음 3월부터 올라갑니다.
-- - grade 는 0(유아)~6 을 허용합니다.
-- 0024 를 먼저 실행한 뒤, SQL Editor 에 붙여넣고 Run 하세요.
-- =====================================================================

alter table public.children add column if not exists grade_year smallint;

-- 지금 학년도 (한국 시간, 3월부터 새 학년도)
update public.children
set grade_year = (
  extract(year from (now() at time zone 'Asia/Seoul'))
  - case when extract(month from (now() at time zone 'Asia/Seoul')) < 3 then 1 else 0 end
)::smallint
where grade_year is null;

alter table public.children alter column grade_year set not null;

-- 유아(0)를 허용하도록 학년 범위를 넓힙니다.
alter table public.children drop constraint if exists children_grade_check;
alter table public.children add constraint children_grade_check check (grade between 0 and 6);
