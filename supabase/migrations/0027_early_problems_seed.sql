-- =====================================================================
-- 0027: 유아·1학년 고정 문제 데이터 (early_problems)
-- - 0026 을 먼저 실행하세요. 이 파일은 한 번만 실행합니다 (두 번 실행하면 문제가 중복됩니다).
-- - 유아(grade 0): 숫자 세기(그림), 알파벳 맞추기, 영어 숫자 세기
-- - 1학년(grade 1): 색·동물 단어 (1학년 화면은 유아 문제 20%를 grade 0에서 함께 뽑습니다)
-- =====================================================================

-- 숫자 세기 (그림 개수를 보고 숫자 고르기)
insert into public.early_problems (grade, kind, prompt, choices, answer)
select 0, 'count_number', repeat('🍎', n), array[n::text, ((n % 10) + 1)::text, (((n + 1) % 10) + 1)::text, (((n + 2) % 10) + 1)::text], n::text
from generate_series(1, 10) as n;

-- 알파벳 맞추기 (대문자를 보고 소문자 고르기)
insert into public.early_problems (grade, kind, prompt, choices, answer)
select 0, 'alphabet_pick', upper(chr(97 + i)),
  array[chr(97 + i), chr(97 + ((i + 3) % 26)), chr(97 + ((i + 7) % 26)), chr(97 + ((i + 11) % 26))],
  chr(97 + i)
from generate_series(0, 25) as i;

-- 영어 숫자 세기 (그림 개수를 보고 영어 숫자 고르기)
with w(words) as (
  select array['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten']
)
insert into public.early_problems (grade, kind, prompt, choices, answer)
select 0, 'english_number', repeat('🍎', n),
  array[w.words[n], w.words[(n % 10) + 1], w.words[((n + 1) % 10) + 1], w.words[((n + 2) % 10) + 1]],
  w.words[n]
from generate_series(1, 10) as n, w;

-- 색 단어 (영어를 보고 뜻 고르기)
insert into public.early_problems (grade, kind, prompt, choices, answer) values
  (1, 'color_animal', 'red',    array['빨강','파랑','노랑','초록'], '빨강'),
  (1, 'color_animal', 'blue',   array['파랑','분홍','주황','검정'], '파랑'),
  (1, 'color_animal', 'yellow', array['노랑','하양','검정','초록'], '노랑'),
  (1, 'color_animal', 'green',  array['초록','주황','분홍','하양'], '초록'),
  (1, 'color_animal', 'pink',   array['분홍','빨강','파랑','노랑'], '분홍'),
  (1, 'color_animal', 'orange', array['주황','검정','하양','빨강'], '주황'),
  (1, 'color_animal', 'black',  array['검정','파랑','초록','주황'], '검정'),
  (1, 'color_animal', 'white',  array['하양','노랑','분홍','검정'], '하양');

-- 동물 단어 (영어를 보고 뜻 고르기)
insert into public.early_problems (grade, kind, prompt, choices, answer) values
  (1, 'color_animal', 'dog',    array['개','고양이','새','물고기'], '개'),
  (1, 'color_animal', 'cat',    array['고양이','토끼','오리','말'], '고양이'),
  (1, 'color_animal', 'bird',   array['새','개','소','물고기'], '새'),
  (1, 'color_animal', 'fish',   array['물고기','오리','토끼','새'], '물고기'),
  (1, 'color_animal', 'rabbit', array['토끼','소','말','고양이'], '토끼'),
  (1, 'color_animal', 'duck',   array['오리','물고기','새','개'], '오리'),
  (1, 'color_animal', 'cow',    array['소','말','토끼','오리'], '소'),
  (1, 'color_animal', 'horse',  array['말','소','고양이','개'], '말');
