-- 자동 생성 (형식 변경): 단어 번호를 직접 찾는 방식
-- 0018 마이그레이션 실행 후 SQL Editor 에 붙여넣고 Run 하세요.
insert into public.english_examples (word_id, tatoeba_en_id, tatoeba_ko_id, en, ko, owner, license) values
  ((select id from public.english_words where word = 'about'), 68365, 8549581, 'That mountain is about three thousand meters high.', '저 산은 높이가 약 3천 미터다.', 'CK', 'CC BY 2.0 FR'),
  ((select id from public.english_words where word = 'about'), 4959799, 4710385, 'How about you take off your coat?', '코트 벗지 그래?', 'Aria', 'CC BY 2.0 FR'),
  ((select id from public.english_words where word = 'about'), 497129, 13577808, 'She wrote a book about birds.', '그녀는 새에 관한 책을 썼다.', 'CK', 'CC BY 2.0 FR')
on conflict (word_id, tatoeba_en_id) do nothing;
