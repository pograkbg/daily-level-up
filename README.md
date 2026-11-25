# Daily Level Up

곤충 친구와 함께 모험하는 판타지 RPG 수학 학습 앱 (초등 2학년 ~ 6학년).
하루 30분, 수학 미션 10문제를 풀면 경험치와 코인을 받습니다.

## 기술 스택

- Next.js (App Router) + TypeScript
- Tailwind CSS
- Supabase (2단계부터 연결)

## 폴더 구조

```text
daily-level-up/
├─ src/
│  ├─ app/                  # 화면 주소(라우트). page.tsx = 홈 화면
│  ├─ components/
│  │  ├─ ui/                # 버튼, 카드, 진행 바 등 재사용 부품
│  │  └─ home/              # 홈 화면 전용 조각 (캐릭터 카드, 미션 카드 ...)
│  ├─ lib/
│  │  ├─ game/              # 레벨·성장·미션 계산 (화면과 무관한 규칙)
│  │  └─ data/              # 데이터 출처: mock(가짜) / supabase(실제 DB)
│  └─ types/game.ts         # 공통 타입 정의
├─ .env.example             # 환경변수 견본 (복사해서 .env.local 로 사용)
└─ next.config.ts
```

## 실행 방법

1. Node.js LTS 설치 확인: `node -v` (v20 이상이면 OK)
2. 프로젝트 폴더로 이동 후 패키지 설치

```bash
cd "C:\Users\user\OneDrive\바탕 화면\vibe_coding1\daily-level-up"
npm install
```

3. 환경변수 파일 만들기 (Windows 탐색기에서 `.env.example` 복사 → 이름을 `.env.local` 로 변경)

```bash
copy .env.example .env.local
```

4. 개발 서버 실행

```bash
npm run dev
```

5. 브라우저에서 <http://localhost:3000> 열기

## 자주 쓰는 명령어

| 명령어 | 설명 |
| --- | --- |
| `npm run dev` | 개발 서버 실행 (수정하면 자동 새로고침) |
| `npm run build` | 배포용 빌드 + 타입/오류 검사 |
| `npm run lint` | 코드 스타일 검사 |

## 데이터 출처 바꾸기

`.env.local` 의 `DATA_SOURCE` 값으로 결정합니다.

- `DATA_SOURCE=mock` : 테스트용 가짜 데이터 (`src/lib/data/mock-data.ts`)
- `DATA_SOURCE=supabase` : 실제 DB (2단계에서 구현 예정)

## 보안 원칙

- 비밀 키는 코드에 직접 쓰지 않고 `.env.local` 에만 둡니다. (`.gitignore` 에 포함되어 깃에 올라가지 않음)
- 정답 검증과 보상 지급은 서버에서 처리합니다. (2단계)
- Supabase 테이블에는 RLS(행 단위 보안)를 적용합니다. (2단계)
