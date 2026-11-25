# Supabase 연결 안내 (3단계)

> 아래 과정은 **본인 계정**에서 직접 해야 합니다. 비밀번호와 키는 채팅이나 코드에 적지 마세요.

## 1. Supabase 프로젝트 만들기

1. <https://supabase.com> 에서 회원가입·로그인
2. **New project** 클릭
3. 이름: `daily-level-up` / Region: **Northeast Asia (Seoul)** 선택
4. 데이터베이스 비밀번호를 정하고 안전한 곳에 보관

## 2. 키 복사하기

**Project Settings → API** 화면에서 두 값을 복사합니다.

- `Project URL`
- `anon` `public` 키 (**service_role 키는 사용하지 마세요**)

## 3. `.env.local` 채우기

프로젝트 폴더의 `.env.local` 파일을 열고 아래처럼 입력합니다.

```bash
DATA_SOURCE=supabase
NEXT_PUBLIC_SUPABASE_URL=여기에_Project_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=여기에_anon_key
```

## 4. 테이블 만들기

1. Supabase 왼쪽 메뉴 **SQL Editor** 클릭
2. `supabase/migrations/0001_init.sql` 파일 내용을 전체 복사해 붙여넣기
3. **Run** 클릭 → `Success` 가 나오면 완료

## 5. 바꾼 뒤 다시 실행하기

환경변수를 바꿨으면 개발 서버를 껐다 켜세요.

```bash
npm run dev
```

## 6. 부모 계정으로 로그인하기

1. 브라우저에서 <http://localhost:3000> 을 열면 **로그인 화면**으로 이동합니다.
2. 이메일과 비밀번호(6자리 이상)를 입력합니다.
3. 처음이라면 **처음이라면 회원가입** 버튼을 누릅니다.
4. 가입 후 확인 메일이 오면 링크를 누르고 다시 로그인합니다.
   - Supabase 의 **Authentication → Providers → Email** 에서 "Confirm email" 을 끄면 메일 확인 없이 바로 들어갈 수 있습니다. (테스트할 때 편합니다.)
5. 로그인하면 **아이 프로필 만들기** 화면이 나옵니다. 이름, 학년, 곤충 친구를 고르고 "모험 시작하기"를 누릅니다.
6. 홈 화면 상단의 **로그아웃** 버튼으로 나갈 수 있습니다.

## 7. 비밀번호 재설정 주소 허용하기 (필수)

재설정 메일의 링크가 앱으로 돌아오려면 Supabase에 주소를 등록해야 합니다.

1. Supabase 왼쪽 메뉴 **Authentication → URL Configuration** 을 엽니다.
2. **Site URL** 을 `http://localhost:3000` 으로 설정합니다.
3. **Redirect URLs** 에 아래 주소를 추가하고 **Save** 를 누릅니다.
   ```bash
   http://localhost:3000/auth/callback
   ```
4. 비밀번호 재설정 흐름
   - 로그인 화면 → **비밀번호를 잊으셨나요?** → 이메일 입력 → **재설정 메일 보내기**
   - 메일의 링크 클릭 → 앱이 자동으로 로그인 → **새 비밀번호 정하기** 화면

> 메일은 Supabase 기본 발송 기능을 쓰므로 횟수 제한이 있고 스팸함으로 갈 수 있습니다.

## 주의 사항

- `DATA_SOURCE=supabase` 일 때만 로그인 화면이 실제로 동작합니다. `DATA_SOURCE=mock` 이면 로그인 없이 테스트 데이터로 바로 사용합니다.
- 비밀번호는 Supabase 가 안전하게 저장합니다. 앱 코드에는 저장되지 않습니다.
- 확인이 끝날 때까지는 `DATA_SOURCE=mock` 으로 두어도 됩니다.
- `.env.local` 파일은 깃에 올리지 마세요. (`.gitignore` 에 이미 포함되어 있습니다.)
