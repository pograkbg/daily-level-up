# 디버깅 FAQ (Supabase 모드 · 개발 서버)

## 1. 개발 서버 재시작 방법

### 프로젝트 경로
```bash
C:\Users\user\OneDrive\바탕 화면\vibe_coding1\daily-level-up
```

### 재시작 순서
1. 서버가 떠 있는 창에서 **Ctrl+C** 를 누릅니다. (서버 종료)
2. 새 PowerShell 창을 엽니다.
3. 아래 두 줄을 실행합니다.
```bash
cd "C:\Users\user\OneDrive\바탕 화면\vibe_coding1\daily-level-up"
npm run dev
```
4. 터미널에 나온 `- Local: http://localhost:XXXX` 주소를 브라우저에 엽니다. (안 바뀌면 **Ctrl+Shift+R**)

> 3000번이 이미 쓰이고 있으면 Next.js가 **3001**처럼 다른 번호를 씁니다. 항상 터미널에 찍힌 주소를 기준으로 하세요.
> Supabase의 **Site URL** 과 Redirect URL 도 그 주소와 같은 포트여야 재설정 메일이 제대로 돌아옵니다.
> `.env.local` 을 고친 뒤에는 **반드시 재시작**해야 적용됩니다.

### "포트가 이미 사용 중" 오류가 나면
이전 서버가 남아 있는 것입니다. 아래로 3000~3010 번 포트 중 떠 있는 서버를 모두 찾습니다.
```bash
Get-NetTCPConnection -State Listen | Where-Object { $_.LocalPort -ge 3000 -and $_.LocalPort -le 3010 } | Select-Object LocalPort, OwningProcess
Stop-Process -Id 여기에_나온_번호 -Force
```
서버를 하나만 남기고 나머지는 꺼 두면 혼동이 없습니다.

## 2. 설정 파일 확인 (`.env.local`)

위치: `daily-level-up\.env.local`

```bash
DATA_SOURCE=supabase
NEXT_PUBLIC_SUPABASE_URL=https://프로젝트주소.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
```

- `DATA_SOURCE=mock` 이면 로그인 없이 가짜 데이터로 동작합니다.
- `=` 양쪽에 공백, 따옴표, 줄 끝 공백을 넣지 마세요.
- 키 값(`secret`, `service_role`)은 넣지 마세요.

## 3. 자주 나는 문제

**Q. `npm` 이 인식되지 않아요.**
A. 터미널을 닫고 새로 엽니다. 그래도 안 되면 PC를 재시작한 뒤 `node -v` 로 확인하세요.

**Q. 로그인 화면이 안 나오고 홈이 바로 나와요.**
A. `DATA_SOURCE` 가 `mock` 입니다. `supabase` 로 고치고 재시작하세요.

**Q. "이메일 또는 비밀번호가 맞지 않아요" 가 나와요.**
A. 계정이 없거나 비밀번호가 다른 경우입니다.
- Supabase → **Authentication → Users** 에서 이메일이 있는지 확인
- 없으면 회원가입, 있으면 비밀번호 재설정

**Q. "이메일 확인이 아직 끝나지 않았어요" 가 나와요.**
A. **Authentication → Sign In / Providers → Email** 에서 **Confirm email** 을 끄고 저장하세요. 이미 가입한 계정은 재설정 메일 링크를 한 번 누르면 확인됩니다.

**Q. 가입할 때 `@` 가 없다고 나와요.**
A. 한글 입력 상태에서 친 `＠` 는 다른 문자입니다. 영문(A) 상태로 입력하거나 메모장에서 복사해 붙여넣으세요.

**Q. 재설정 메일 링크를 눌렀는데 비밀번호 화면이 안 나와요.**
A. **Authentication → URL Configuration** 에서 확인하세요.
- Site URL: `http://localhost:3000`
- Redirect URLs: `http://localhost:3000/auth/callback`

**Q. 분기 선택, 하루 5회, 연속 학습이 동작하지 않아요.**
A. SQL 0002가 실행되지 않은 것입니다. `supabase/migrations/0002_quarters_attempts.sql` 을 SQL Editor에서 Run 하세요. 실행 후 서버를 재시작하세요.

**Q. 연속 학습이 계속 0일이에요.**
A. SQL 0002 실행 후, 보상을 받은 뒤에 갱신됩니다.

**Q. 개발 서버 창에 `.next` 관련 빨간 오류가 나요.**
A. 서버를 끄고 프로젝트의 `.next` 폴더를 지운 뒤 `npm run dev` 를 다시 실행하세요. `.next` 는 빌드 캐시라 지워도 자동으로 다시 만들어집니다.

**Q. 화면에 `。`, `？`, `¿` 같은 기호가 들어가요.**
A. 한글 입력 상태입니다. 영문(A) 상태로 바꾸세요.

## 4. 오류 메시지 보고 방법

문제가 생기면 아래 셋 중 해당되는 것을 보내 주세요. 비밀번호와 키 값은 빼고 보내 주세요.
- 화면의 빨간 문구
- 서버 창에 나온 `[auth]` 또는 `[supabase-mission]` 로 시작하는 줄
- 브라우저 F12 → Console의 빨간 줄
