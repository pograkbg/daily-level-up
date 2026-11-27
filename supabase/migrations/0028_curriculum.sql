-- =====================================================================
-- 0028: 학년·학기 교육과정 단원과 난이도 규칙
-- - curriculum_units: 1학년 1학기 ~ 6학년 2학기 단원 (도형·측정·시각·표·그래프는 제외)
-- - difficulty_params: 문제 종류(kind)별 난이도 1~5의 숫자 범위 규칙
-- - 문제는 저장하지 않고, 이 규칙으로 앱이 매번 새로 만듭니다.
-- 0027 까지 실행한 뒤, SQL Editor 에 붙여넣고 Run 하세요. 한 번만 실행합니다.
-- =====================================================================

create table if not exists public.curriculum_units (
  id smallserial primary key,
  grade smallint not null check (grade between 1 and 6),
  semester smallint not null check (semester in (1, 2)),
  ord smallint not null,
  unit text not null,
  field text not null,
  kind text not null check (kind in (
    'add', 'sub', 'mul', 'div',
    'frac_add', 'frac_sub', 'frac_mul', 'frac_div',
    'dec_add', 'dec_sub', 'dec_mul', 'dec_div'
  )),
  unique (grade, semester, ord)
);

create table if not exists public.difficulty_params (
  kind text not null,
  difficulty smallint not null check (difficulty between 1 and 5),
  params jsonb not null,
  primary key (kind, difficulty)
);

alter table public.curriculum_units enable row level security;
alter table public.difficulty_params enable row level security;

drop policy if exists curriculum_units_read on public.curriculum_units;
create policy curriculum_units_read on public.curriculum_units
  for select to authenticated using (true);

drop policy if exists difficulty_params_read on public.difficulty_params;
create policy difficulty_params_read on public.difficulty_params
  for select to authenticated using (true);

revoke all on public.curriculum_units from anon;
revoke all on public.difficulty_params from anon;
grant select on public.curriculum_units to authenticated;
grant select on public.difficulty_params to authenticated;

-- 단원 (학년, 학기, 순서, 단원명, 소속, 문제 종류)
insert into public.curriculum_units (grade, semester, ord, unit, field, kind) values
  (2, 1, 1, '세 자리수', '대수학', 'add'),
  (2, 1, 2, '덧셈과 뺄셈', '대수학', 'add'),
  (2, 1, 3, '곱셈', '대수학', 'mul'),
  (2, 2, 1, '네 자리수', '대수학', 'add'),
  (2, 2, 2, '곱셈구구', '대수학', 'mul'),
  (2, 2, 3, '규칙찾기', '대수학', 'add'),
  (3, 1, 1, '덧셈과 뺄셈', '대수학', 'add'),
  (3, 1, 2, '곱셈', '대수학', 'mul'),
  (3, 1, 3, '나눗셈', '대수학', 'div'),
  (3, 1, 4, '분수와 소수', '대수학', 'frac_add'),
  (3, 2, 1, '곱셈', '대수학', 'mul'),
  (3, 2, 2, '나눗셈', '대수학', 'div'),
  (3, 2, 3, '분수와 소수', '대수학', 'frac_sub'),
  (4, 1, 1, '큰 수', '정수론', 'add'),
  (4, 1, 2, '곱셈과 나눗셈', '대수학', 'mul'),
  (4, 1, 3, '규칙찾기', '대수학', 'add'),
  (4, 2, 1, '분수의 덧셈과 뺄셈', '대수학', 'frac_add'),
  (4, 2, 2, '분수의 뺄셈', '대수학', 'frac_sub'),
  (4, 2, 3, '소수의 덧셈과 뺄셈', '대수학', 'dec_add'),
  (4, 2, 4, '소수의 뺄셈', '대수학', 'dec_sub'),
  (5, 1, 1, '자연수의 혼합계산', '대수학', 'mul'),
  (5, 1, 2, '약수와 배수', '정수론', 'mul'),
  (5, 1, 3, '약분과 통분', '대수학', 'frac_add'),
  (5, 1, 4, '분수의 덧셈과 뺄셈', '대수학', 'frac_add'),
  (5, 1, 5, '분수의 뺄셈', '대수학', 'frac_sub'),
  (5, 2, 1, '수의 범위와 어림하기', '해석학', 'add'),
  (5, 2, 2, '분수의 곱셈', '대수학', 'frac_mul'),
  (5, 2, 3, '소수의 곱셈', '대수학', 'dec_mul'),
  (6, 1, 1, '분수의 나눗셈', '대수학', 'frac_div'),
  (6, 1, 2, '소수의 나눗셈', '대수학', 'dec_div'),
  (6, 1, 3, '비와 비율', '대수학', 'frac_div'),
  (6, 2, 1, '분수의 나눗셈', '대수학', 'frac_div'),
  (6, 2, 2, '소수의 나눗셈', '대수학', 'dec_div'),
  (6, 2, 3, '비례식과 비례배분', '대수학', 'frac_mul')
on conflict (grade, semester, ord) do nothing;

-- 난이도 1~5 숫자 범위 규칙
-- 정수: 자릿수가 늘고 받아올림·내림이 생김 / 분수: 분모가 다양해짐 / 소수: 소수 자릿수가 늘어남
insert into public.difficulty_params (kind, difficulty, params) values
  ('add', 1, '{"a":[10,49],"b":[1,9],"carry":false}'),
  ('add', 2, '{"a":[10,89],"b":[1,9],"carry":true}'),
  ('add', 3, '{"a":[100,499],"b":[10,99],"carry":false}'),
  ('add', 4, '{"a":[100,899],"b":[10,99],"carry":true}'),
  ('add', 5, '{"a":[1000,4999],"b":[100,999],"carry":true}'),
  ('sub', 1, '{"a":[20,49],"b":[1,9],"carry":false}'),
  ('sub', 2, '{"a":[20,89],"b":[1,9],"carry":true}'),
  ('sub', 3, '{"a":[100,499],"b":[10,99],"carry":false}'),
  ('sub', 4, '{"a":[100,899],"b":[10,99],"carry":true}'),
  ('sub', 5, '{"a":[1000,4999],"b":[100,999],"carry":true}'),
  ('mul', 1, '{"a":[2,9],"b":[2,9]}'),
  ('mul', 2, '{"a":[10,39],"b":[2,9]}'),
  ('mul', 3, '{"a":[10,99],"b":[10,19]}'),
  ('mul', 4, '{"a":[100,299],"b":[2,9]}'),
  ('mul', 5, '{"a":[100,499],"b":[10,29]}'),
  ('div', 1, '{"b":[2,9],"q":[2,9]}'),
  ('div', 2, '{"b":[2,9],"q":[10,30]}'),
  ('div', 3, '{"b":[2,9],"q":[100,300]}'),
  ('div', 4, '{"b":[10,19],"q":[2,20]}'),
  ('div', 5, '{"b":[10,29],"q":[100,300]}'),
  ('frac_add', 1, '{"den":[2,9],"same":true}'),
  ('frac_add', 2, '{"den":[2,9],"same":false}'),
  ('frac_add', 3, '{"den":[2,12],"same":false}'),
  ('frac_add', 4, '{"den":[2,12],"same":false,"mixed":true}'),
  ('frac_add', 5, '{"den":[3,20],"same":false,"mixed":true}'),
  ('frac_sub', 1, '{"den":[2,9],"same":true}'),
  ('frac_sub', 2, '{"den":[2,9],"same":false}'),
  ('frac_sub', 3, '{"den":[2,12],"same":false}'),
  ('frac_sub', 4, '{"den":[2,12],"same":false,"mixed":true}'),
  ('frac_sub', 5, '{"den":[3,20],"same":false,"mixed":true}'),
  ('frac_mul', 1, '{"den":[2,9],"int":[2,9]}'),
  ('frac_mul', 2, '{"den":[2,9],"den2":[2,9]}'),
  ('frac_mul', 3, '{"den":[2,12],"den2":[2,12]}'),
  ('frac_mul', 4, '{"den":[2,12],"den2":[2,12],"mixed":true}'),
  ('frac_mul', 5, '{"den":[3,20],"den2":[3,20],"mixed":true}'),
  ('frac_div', 1, '{"den":[2,9],"int":[2,9]}'),
  ('frac_div', 2, '{"den":[2,9],"den2":[2,9]}'),
  ('frac_div', 3, '{"den":[2,12],"den2":[2,12]}'),
  ('frac_div', 4, '{"den":[2,12],"den2":[2,12],"mixed":true}'),
  ('frac_div', 5, '{"den":[3,20],"den2":[3,20],"mixed":true}'),
  ('dec_add', 1, '{"dec":1,"a":[1,9]}'),
  ('dec_add', 2, '{"dec":1,"a":[1,99]}'),
  ('dec_add', 3, '{"dec":2,"a":[1,99]}'),
  ('dec_add', 4, '{"dec":2,"a":[1,999]}'),
  ('dec_add', 5, '{"dec":3,"a":[1,999]}'),
  ('dec_sub', 1, '{"dec":1,"a":[1,9]}'),
  ('dec_sub', 2, '{"dec":1,"a":[1,99]}'),
  ('dec_sub', 3, '{"dec":2,"a":[1,99]}'),
  ('dec_sub', 4, '{"dec":2,"a":[1,999]}'),
  ('dec_sub', 5, '{"dec":3,"a":[1,999]}'),
  ('dec_mul', 1, '{"dec":1,"a":[1,9],"b":[2,9]}'),
  ('dec_mul', 2, '{"dec":1,"a":[1,99],"b":[2,9]}'),
  ('dec_mul', 3, '{"dec":2,"a":[1,99],"b":[2,9]}'),
  ('dec_mul', 4, '{"dec":2,"a":[1,99],"b":[10,19]}'),
  ('dec_mul', 5, '{"dec":2,"a":[1,999],"b":[10,19]}'),
  ('dec_div', 1, '{"dec":1,"b":[2,9],"q":[1,9]}'),
  ('dec_div', 2, '{"dec":1,"b":[2,9],"q":[10,99]}'),
  ('dec_div', 3, '{"dec":2,"b":[2,9],"q":[10,99]}'),
  ('dec_div', 4, '{"dec":2,"b":[10,19],"q":[10,99]}'),
  ('dec_div', 5, '{"dec":2,"b":[10,19],"q":[100,999]}')
on conflict (kind, difficulty) do nothing;
