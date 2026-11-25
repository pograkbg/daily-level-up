# 오늘의 미션 도장깨기 · API 적용 현황 및 추가 검토 보고서

- 대상: 오늘의 미션 도장깨기 (초등 2학년 가족용 학습 앱, 비상업 · 출처 표기 필수)
- 범위: 현재 코드에 **이미 적용된** 외부/내부 API, 그리고 **추가로 가능한** 개선안
- 기준: 저장소 소스(`src/`, `scripts/`) 직접 확인

---

## 1. 요약

| 구분 | API | 호출 위치 | 상태 |
|---|---|---|---|
| 데이터 | Supabase (Auth · PostgREST · RPC) | 서버 전용 (anon 키 + RLS) | 적용 |
| 외부 | freedictionaryapi.com v1 (발음기호 IPA) | 서버 (`english-pronunciation.ts`) | 적용 |
| 외부 | api.dictionaryapi.dev v2 (음성 파일 주소) | 서버 (`english-audio.ts`), 설정으로 켬 | 적용 (선택) |
| 외부 | Tatoeba API v1 (예문) | 개발자 PC 스크립트 (`scripts/build-examples.mjs`) 에서만 | 적용 (오프라인 수집) |
| 브라우저 | Web Speech API (`speechSynthesis`) | 브라우저 내장 | 적용 (기본 발음) |
| 브라우저 | Web Audio API (효과음) | 브라우저 내장, 네트워크 없음 | 적용 |

핵심 원칙: **앱 실행 중에는 Tatoeba를 호출하지 않고**, 발음기호·음성도 서버에서 짧게 캐시하며 호출합니다. 외부 API가 멈춰도 퀴즈는 기기 음성과 DB 예문으로 계속 동작합니다.

---

## 2. 이미 적용된 API 상세

### 2.1 Supabase (내부 백엔드)
- 용도: 로그인(이메일 계정), 학습 데이터, 미션 채점, 보상, 관리자 기능, 친구 랭킹, 예문 조회.
- 연결: `@supabase/ssr` 서버 클라이언트 (`src/lib/supabase/server.ts`). 브라우저에는 **anon(공개) 키만** 노출되며, 키는 `.env.local`의 `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`로 읽습니다. service_role 키는 쓰지 않습니다.
- 접근 제어: RLS 정책 + `security definer` PL/pgSQL 함수. 관리자 함수는 `is_admin()`으로 확인합니다.
- 주요 RPC: `submit_answer`, `answer_english_quiz`, `start_mission`, `build_mission_view`, `add_op_xp`, `resolve_level_up`, `admin_*` 계열, `friend_ranking`, `pick_examples`, `get_child_stats`, `get_english_stats`.
- 세션 갱신: `src/proxy.ts`가 요청마다 세션을 갱신하고, 미로그인 → `/login`, 정지 → `/suspended`, 승인 대기 → `/pending`으로 보냅니다.
- 전환 스위치: `DATA_SOURCE=mock`이면 Supabase 없이 메모리 데이터로 동작합니다.

### 2.2 freedictionaryapi.com v1 — 발음기호(IPA)
- 엔드포인트: `GET https://freedictionaryapi.com/api/v1/entries/en/{word}`
- 코드: `src/lib/data/english-pronunciation.ts` → `fetchPronunciation(word)`
- 쓰는 값: `entries[].pronunciations[]` 중 `type === "ipa"`인 `text` (예: `/bʌy/`).
- 안전 장치:
  - 단어 형식 검사 (`^[a-z]+(?:['-][a-z]+)*$`, 40자 이하)
  - 요청 제한 시간 5초 (`AbortSignal.timeout`)
  - 메모리 캐시 24시간 (단어당 1회)
  - 실패 시 `ipa: null`로 돌려주고 화면은 계속 진행
- 출처 표기: `CC BY-SA 4.0 (Wiktionary) · FreeDictionaryAPI.com`을 퀴즈 하단에 표시. 응답에 있는 라이선스 이름을 우선 사용하고, 없으면 기본 문구를 씁니다.
- 호출 제한: 코드 주석 기준 IP당 시간당 1,000회. 가족용 사용량에서는 여유가 큽니다.
- 호출 위치: `src/app/english/quiz/page.tsx:50` (퀴즈 화면 서버 렌더링), `src/app/english/actions.ts:74` (`getPronunciationAction`).

### 2.3 api.dictionaryapi.dev v2 — 음성 파일 주소 (선택 기능)
- 엔드포인트: `GET https://api.dictionaryapi.dev/api/v2/entries/en/{word}`
- 코드: `src/lib/data/english-audio.ts` → `findAudioUrl(word)`
- 쓰는 값: `phonetics[].audio` 중 첫 번째 주소. `//`로 시작하면 `https:`를 붙이고, **https 주소만 허용**합니다.
- 파일을 서버에 저장하지 않습니다. 주소만 찾아 브라우저가 바로 재생합니다.
- 켜고 끄기: `.env.local`의 `ENGLISH_AUDIO=dictionaryapi`일 때만 사용. 비어 있으면 기기 음성을 씁니다. (현재 `.env.local`에는 `dictionaryapi`가 설정되어 있습니다.)
- 캐시: 24시간 (실패도 캐시). 5초 제한.
- 주의: 이 API는 **음성 이용 조건을 명시하지 않습니다.** 화면에 출처와 주의 문구를 함께 둡니다. 가족용 비상업 전제입니다.

### 2.4 Tatoeba API v1 — 예문 (오프라인 수집)
- 엔드포인트: `https://api.tatoeba.org/v1/sentences?lang=eng&trans:lang=kor&showtrans:lang=kor&sort=random&limit=100`
- 코드: `scripts/build-examples.mjs` (개발자 PC에서 가끔 한 번씩 실행)
- 필터: CC BY 계열 라이선스, 영어 8단어 이하, 한국어 번역 25자 이하, 금칙어 제외, 승인된 문장만. 단어 목록(`data/english/elementary800_words.json`)에 들어 있는 단어가 포함된 문장만 모읍니다.
- 요청 사이 기본 1초 대기, 최대 요청 300회, 단어당 목표 10개.
- 결과: `scripts/output/`의 `insert.sql` → Supabase `english_examples` 테이블에 입력 (`0018_example_sentences.sql`). 설계 문서: `docs/EXAMPLE_SENTENCES_DESIGN.md`.
- 앱 런타임에서는 **DB의 `pick_examples` RPC로만 읽습니다.** 외부 호출은 없습니다.
- 출처 표기: `Tatoeba API CC BY 2.0 FR`을 퀴즈 하단에 표시하고, 문장마다 `owner`, `license`를 저장합니다.

### 2.5 브라우저 기본 기능 (네트워크 없음)
- 발음: `speechSynthesis` (en-US, 속도 0.8). 음성 파일 주소를 못 얻으면 이 방식으로 대체합니다.
- 효과음: `src/lib/sound.ts`의 WebAudio 오실레이터 (정답 C5-E5-G5 사인파, 오답 삼각파 392→311Hz). 음성 파일을 쓰지 않습니다.
- 발음 버튼 (`PronounceButton.tsx`): 단어별 음성 주소를 미리 받아 두고, 누르면 바로 재생합니다.

---

## 3. 데이터 흐름 (한눈에)

```
[개발자 PC, 가끔]  Tatoeba API ──▶ scripts/build-examples.mjs ──▶ insert.sql ──▶ Supabase english_examples
[앱 실행, 서버]    Supabase RPC (pick_examples, submit, ...) ◀── 화면
                   freedictionaryapi.com ──▶ IPA (24h 메모리 캐시)
                   dictionaryapi.dev     ──▶ 음성 주소 (24h 메모리 캐시, 선택)
[브라우저]         음성 주소 재생 또는 speechSynthesis / WebAudio 효과음
```

---

## 4. 추가로 가능한 개선안 (우선순위순)

### 4.1 발음기호를 DB에 미리 저장 (권장, 효과 큼)
- 현재: 발음기호를 **요청 때마다** 외부 API에서 받고, 캐시는 서버 메모리라 **서버를 재시작하면 사라집니다.**
- 개선: 800개 단어의 IPA를 한 번 수집해 `english_words`에 `ipa` 컬럼으로 저장. 앱은 DB만 읽습니다.
- 효과: 외부 의존 제거, 퀴즈 화면 로딩 속도 향상, 재시작 후에도 유지, 호출 제한 걱정 없음.
- 작업량: 작음 (수집 스크립트 1개 + 마이그레이션 1개).

### 4.2 음성 출처와 라이선스 정리 (권장)
- 현재 음성 파일은 dictionaryapi.dev 주소를 그대로 재생합니다. 이용 조건이 명시되어 있지 않습니다.
- 선택지:
  1. 현 상태 유지 (가족용 비상업 전제, 주의 문구 표시) — 지금 가장 간단함
  2. 음성을 직접 녹음하거나 라이선스가 명확한 TTS(예: 클라우드 TTS 유료 플랜)로 만들어 Supabase Storage에 보관
  3. 기기 음성만 사용 (`ENGLISH_AUDIO` 끄기) — 품질은 기기마다 다름
- 배포 범위를 넓히거나 상업화할 때는 반드시 2번 이상을 권장합니다.

### 4.3 퀴즈 화면의 발음 호출 묶기
- `quiz/page.tsx:50`에서 단어마다 `fetchPronunciation`을 부릅니다. 캐시가 있어 두 번째부터는 빠르지만, 처음 한 번은 문항 수만큼 외부 요청이 나갑니다.
- 개선: 4.1을 적용하면 자연스럽게 사라집니다. 그 전이라도 `Promise.all`로 묶으면 대기 시간을 줄일 수 있습니다.

### 4.4 Tatoeba 예문 보충 주기
- 현재는 수동 실행입니다. 예문이 부족한 단어는 `coverage.csv`로 확인할 수 있습니다.
- 개선: 부족한 단어만 골라 추가 수집하는 옵션 (`--only-missing`), 또는 Tatoeba 공개 데이터 덤프(CSV)를 받아 로컬에서 처리하면 API 호출 없이 대량 수집이 가능합니다.
- 주의: 예문 수집 시 라이선스(CC BY 2.0 FR) 표기와 작성자(`owner`) 저장을 계속 유지해야 합니다.

### 4.5 실패 관찰과 안내
- 외부 API 실패는 `console.error`로만 남습니다. 운영 중에는 실패 횟수를 세는 간단한 카운터나 로그 테이블이 있으면 원인 파악이 쉽습니다.
- 화면에는 이미 "발음 기호를 불러오지 못했어요" 류의 조용한 대체 표시를 하고 있으므로, 사용자 경험에는 영향이 없습니다.

### 4.6 보안 점검
- `.env.local`에는 Supabase 프로젝트 주소와 **공개(anon) 키**가 들어 있습니다. 공개 키는 설계상 브라우저에 노출되어도 되지만, **service_role 키는 어디에도 넣지 않습니다.**
- 현재 폴더는 git 저장소가 아니므로, 나중에 저장소를 만들 때 `.env.local`이 제외되도록 `.gitignore`를 확인하세요.
- RLS 정책이 적용된 상태에서만 데이터가 보이는지, 다른 계정으로 한 번 더 확인하는 것을 권장합니다.

### 4.7 미확인 항목
- 마이그레이션 `0017`, `0018`, `0020`, `0021`의 Supabase 실행 여부는 아직 확인되지 않았습니다. 특히 `0018`(예문 테이블, `pick_examples`)과 `0020`(친구 랭킹)이 없으면 해당 기능이 오류를 냅니다.
- 이 보고서 작성 중에는 외부 API를 실제로 호출해 응답을 확인하지 않았습니다. 응답 구조는 코드의 타입 정의를 기준으로 적었습니다.

---

## 5. 체크리스트

- [ ] 0017, 0018, 0020, 0021 마이그레이션 실행 여부 확인
- [ ] 발음기호 DB 저장 여부 결정 (4.1)
- [ ] 음성 출처 방침 결정 (4.2)
- [ ] 예문 풀 행 수 확인 (`english_examples` count)
- [ ] 외부 API 실제 응답 확인 (브라우저 퀴즈 1회)
- [ ] `.env.local` 제외 설정 (저장소를 만들 때)

---

## 6. 출처 표기 (앱 화면과 동일)

- 발음기호: FreeDictionaryAPI.com (Wiktionary, CC BY-SA 4.0)
- 음성: dictionaryapi.dev (이용 조건 미명시, 가족용 비상업 전제)
- 예문: Tatoeba API (CC BY 2.0 FR), 문장별 작성자 표시
- 단어 목록: 교육부 고시 제2022-33호 [별책 14]
