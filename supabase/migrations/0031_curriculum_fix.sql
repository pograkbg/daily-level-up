-- =====================================================================
-- 0031: 교육과정 단원 표 수정 (검토 결과 반영)
-- - 3학년 소수 추가, 4학년 1학기 나눗셈 추가
-- - 5학년 혼합계산·규칙과 대응·평균·어림하기 / 6학년 비·비례식 문제 종류 추가
-- - 6학년 2학기 분수 나눗셈 단원 이름을 구분 (중복 해소)
-- 0028 을 먼저 실행한 뒤, SQL Editor 에 붙여넣고 Run 하세요. 한 번만 실행합니다.
-- =====================================================================

-- 1) 새 문제 종류 허용
alter table public.curriculum_units drop constraint if exists curriculum_units_kind_check;
alter table public.curriculum_units add constraint curriculum_units_kind_check check (kind in (
  'add', 'sub', 'mul', 'div',
  'frac_add', 'frac_sub', 'frac_mul', 'frac_div',
  'dec_add', 'dec_sub', 'dec_mul', 'dec_div',
  'mixed', 'pattern', 'average', 'round', 'ratio', 'proportion'
));

-- 2) 새 문제 종류의 난이도 규칙
insert into public.difficulty_params (kind, difficulty, params) values
  ('mixed', 1, '{"a":[2,9],"b":[2,9],"c":[1,9]}'),
  ('mixed', 2, '{"a":[10,49],"b":[2,9],"c":[2,9]}'),
  ('mixed', 3, '{"a":[10,99],"b":[2,9],"c":[10,30]}'),
  ('mixed', 4, '{"a":[100,299],"b":[2,9],"c":[10,50]}'),
  ('mixed', 5, '{"a":[100,499],"b":[10,19],"c":[10,99]}'),
  ('pattern', 1, '{"start":[1,9],"step":[1,3],"len":4}'),
  ('pattern', 2, '{"start":[1,20],"step":[2,5],"len":4}'),
  ('pattern', 3, '{"start":[10,50],"step":[5,10],"len":4}'),
  ('pattern', 4, '{"start":[100,300],"step":[10,50],"len":4}'),
  ('pattern', 5, '{"start":[100,999],"step":[25,100],"len":4}'),
  ('average', 1, '{"a":[1,9]}'),
  ('average', 2, '{"a":[10,29]}'),
  ('average', 3, '{"a":[20,59]}'),
  ('average', 4, '{"a":[50,99]}'),
  ('average', 5, '{"a":[100,299]}'),
  ('round', 1, '{"a":[10,99],"unit":[10,10]}'),
  ('round', 2, '{"a":[100,999],"unit":[10,10]}'),
  ('round', 3, '{"a":[100,999],"unit":[100,100]}'),
  ('round', 4, '{"a":[1000,4999],"unit":[100,100]}'),
  ('round', 5, '{"a":[1000,9999],"unit":[1000,1000]}'),
  ('ratio', 1, '{"a":[1,9],"b":[2,9]}'),
  ('ratio', 2, '{"a":[1,19],"b":[2,19]}'),
  ('ratio', 3, '{"a":[1,30],"b":[2,30]}'),
  ('ratio', 4, '{"a":[10,60],"b":[10,60]}'),
  ('ratio', 5, '{"a":[10,99],"b":[10,99]}'),
  ('proportion', 1, '{"a":[2,5],"k":[2,4],"c":[2,9]}'),
  ('proportion', 2, '{"a":[2,9],"k":[2,6],"c":[2,12]}'),
  ('proportion', 3, '{"a":[3,12],"k":[2,8],"c":[3,15]}'),
  ('proportion', 4, '{"a":[4,20],"k":[2,9],"c":[5,30]}'),
  ('proportion', 5, '{"a":[5,30],"k":[2,12],"c":[10,50]}')
on conflict (kind, difficulty) do nothing;

-- 3) 단원 표 수정
-- 3학년 소수 추가 (3-1 소수, 3-2 소수)
insert into public.curriculum_units (grade, semester, ord, unit, field, kind) values
  (3, 1, 5, '소수의 덧셈과 뺄셈', '대수학', 'dec_add'),
  (3, 2, 4, '소수', '대수학', 'dec_add')
on conflict (grade, semester, ord) do nothing;

-- 4학년 1학기 나눗셈 추가
insert into public.curriculum_units (grade, semester, ord, unit, field, kind) values
  (4, 1, 4, '나눗셈', '대수학', 'div')
on conflict (grade, semester, ord) do nothing;

-- 5학년 1학기: 혼합계산(혼합), 규칙과 대응(규칙)
update public.curriculum_units set kind = 'mixed' where grade = 5 and semester = 1 and ord = 1;
insert into public.curriculum_units (grade, semester, ord, unit, field, kind) values
  (5, 1, 6, '규칙과 대응', '해석학', 'pattern')
on conflict (grade, semester, ord) do nothing;

-- 5학년 2학기: 어림하기(어림), 평균의 가능성(평균)
update public.curriculum_units set kind = 'round' where grade = 5 and semester = 2 and ord = 1;
insert into public.curriculum_units (grade, semester, ord, unit, field, kind) values
  (5, 2, 4, '평균', '대수학, 확률론', 'average')
on conflict (grade, semester, ord) do nothing;

-- 6학년 1학기: 비와 비율 (비율)
update public.curriculum_units set kind = 'ratio' where grade = 6 and semester = 1 and ord = 3;

-- 6학년 2학기: 분수 나눗셈 이름 구분, 비례식 (비례식)
update public.curriculum_units set unit = '분수의 나눗셈 활용' where grade = 6 and semester = 2 and ord = 1;
update public.curriculum_units set kind = 'proportion' where grade = 6 and semester = 2 and ord = 3;
