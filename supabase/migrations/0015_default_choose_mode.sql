-- =====================================================================
-- 0015: 수학 기본 풀이 방식을 "지정"으로 (네 연산 모두 "하" 난이도)
-- 0014 를 먼저 실행한 뒤, SQL Editor 에 붙여넣고 Run 하세요.
-- 새로 만든 아이와, 관리자 초기화를 한 아이에게는 이 기본값이 적용됩니다.
-- 이미 있는 아이의 풀이 방식은 바꾸지 않습니다 (홈 화면 "레벨 선택"에서 바꿀 수 있습니다).
-- =====================================================================

alter table public.children
  alter column practice_mode set default 'choose';

alter table public.children
  alter column practice_bands set default '{"+": 0, "-": 0, "×": 0, "÷": 0}'::jsonb;
