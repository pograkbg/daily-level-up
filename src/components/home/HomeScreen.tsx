import Link from "next/link";
import { SemesterProgressBody } from "@/components/home/SemesterCard";
import type { SemesterProgress } from "@/lib/data/semester-repository";
import type { EnglishSemesterProgress } from "@/lib/data/english-semester-repository";
import { CharacterBand } from "@/components/home/CharacterBand";
import type { WrongEnglishItem, WrongMathItem } from "@/lib/data/wrong-answers-repository";
import { EnglishPlayCard } from "@/components/home/EnglishPlayCard";
import { GradeApproval } from "@/components/home/GradeApproval";
import { HomeHeader } from "@/components/home/HomeHeader";
import { MissionHero } from "@/components/home/MissionHero";
import { StatsCard } from "@/components/home/StatsCard";
import { Card } from "@/components/ui/Card";
import { NewFriendPicker } from "@/components/forest/NewFriendPicker";
import { isGradeCleared, OPERATOR_NAMES } from "@/lib/game/learning-levels";
import { LevelUpPrompt } from "@/components/home/LevelUpPrompt";
import type { HomeData } from "@/types/game";
import type { EnglishLevelSummary, EnglishStats } from "@/types/english";

/** 홈의 한 묶음: 작은 제목과 내용 */
function HomeSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3" aria-label={title}>
      <h2 className="px-1 text-base font-extrabold text-ink-soft">{title}</h2>
      {children}
    </section>
  );
}

/** 미션 카드 안의 연습 버튼 (단원 연습, 영어 단어 맞추기 등). 모양을 모두 같게 맞춥니다. */
function ExtraPracticeLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="flex min-h-14 items-center justify-center rounded-2xl bg-white px-5 py-3 text-lg font-extrabold text-primary-dark shadow-sm transition active:translate-y-1"
    >
      {label} ›
    </Link>
  );
}

/** 유아·1학년 놀이 카드 (수학 / 영어). 누르면 /early 의 해당 과목 놀이로 갑니다. */
function EarlyPlayCard({
  subject,
  emoji,
  title,
  detail,
  tone,
}: {
  subject: "math" | "english";
  emoji: string;
  title: string;
  detail: string;
  tone: string;
}) {
  return (
    <Link
      href={`/early?subject=${subject}`}
      className={`flex min-h-28 items-center gap-4 rounded-[2rem] px-5 py-4 text-left shadow-md transition active:translate-y-1 ${tone}`}
    >
      <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/25 text-4xl" aria-hidden>
        {emoji}
      </span>
      <span className="flex min-w-0 flex-wrap items-baseline gap-x-2">
        <span className="text-xl font-extrabold sm:text-2xl">{title} ›</span>
        <span className="truncate text-sm font-bold opacity-80 sm:text-base">{detail}</span>
      </span>
    </Link>
  );
}

interface HomeScreenProps {
  data: HomeData;
  semester: SemesterProgress;
  englishProgress: EnglishSemesterProgress;
  isAdmin: boolean;
  wrong: { math: WrongMathItem[]; english: WrongEnglishItem[] };
  loginEmail?: string | null;
  english: { summary: EnglishLevelSummary[]; dailyUsed: number; dailyMax: number; stats: EnglishStats };
}

/**
 * 대시보드 홈
 * 1) 위: 요약 줄 (캐릭터 레벨, 누적 경험치, 보유 코인, 연속 학습, 숲·영어 이동)
 * 2) 가운데: 오늘의 미션 — 수학 박스 하나, 영어 박스 하나 (각 박스 안에 진도와 연습 버튼)
 * 3) 아래: 학습 기록 (2학년 이상)
 */
export function HomeScreen({ data, english, isAdmin, loginEmail, wrong, semester, englishProgress }: HomeScreenProps) {
  const { profile } = data;
  const gradeCleared = isGradeCleared(profile.progress);
  const isEarly = profile.grade <= 1;

  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute -left-16 top-10 h-56 w-56 rounded-full bg-mint/60 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -right-20 top-40 h-72 w-72 rounded-full bg-peach/70 blur-3xl" />

      <main className="relative mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 pb-8 pt-6 sm:gap-5 sm:px-6 sm:pt-8 [@media(max-height:860px)]:gap-2 [@media(max-height:860px)]:pb-3 [@media(max-height:860px)]:pt-3">
        <HomeHeader profile={profile} isAdmin={isAdmin} loginEmail={loginEmail ?? null} />

        {gradeCleared && <GradeApproval approved={profile.nextGradeApproved} gradeName={`${profile.grade}학년`} />}

        {profile.pendingNewCharacter && <NewFriendPicker collection={profile.collection} />}

        <LevelUpPrompt
          items={(["+", "-", "×", "÷"] as const)
            .filter((op) => profile.progress[op].ready === true)
            .map((op) => ({
              op,
              name: OPERATOR_NAMES[op],
              level: profile.progress[op].level,
            }))}
        />

        <CharacterBand profile={profile} character={data.character} />

        <HomeSection title={profile.grade >= 1 ? `${profile.grade}학년 ${semester.semester}학기` : "오늘의 미션"}>
          <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-2">
            {/* 수학 박스: 미션 카드 안에 학기 진도와 단원 연습 */}
            {isEarly ? (
              <Card className="flex flex-col gap-4">
                <EarlyPlayCard subject="math" emoji="🔢" title="수학 놀이" detail={profile.grade === 0 ? "숫자 세기" : "덧셈·뺄셈과 다음 수 찾기"} tone="bg-primary text-white" />
                {profile.grade === 1 && (
                  <div className="flex flex-col gap-4 border-t-2 border-ink/10 pt-4">
                    <SemesterProgressBody grade={profile.grade} progress={semester} />
                    <ExtraPracticeLink href="/practice" label="📘 오늘의 단원 연습" />
                  </div>
                )}
              </Card>
            ) : (
              <MissionHero
                mission={data.todayMission}
                attempts={data.attempts}
                grade={profile.grade}
                semester={semester}
              />
            )}

            {/* 영어 박스: 1 영어 퀴즈 · 2 단어 맞추기 · 3 모의고사 */}
            {isEarly ? (
              <Card className="flex flex-col gap-4">
                <EarlyPlayCard subject="english" emoji="🔤" title="영어 놀이" detail={profile.grade === 0 ? "알파벳 맞추기·영어 숫자" : "색과 동물 단어"} tone="bg-butter text-ink" />
              </Card>
            ) : (
              <EnglishPlayCard
                summary={english.summary}
                dailyUsed={english.dailyUsed}
                dailyMax={english.dailyMax}
                grade={profile.grade}
                englishProgress={englishProgress}
              />
            )}
          </div>
        </HomeSection>

        {/* 학습 기록(코칭)은 2학년부터 보여 줍니다. 유아·1학년은 숨깁니다. */}
        {profile.grade > 1 && (
          <section aria-label="기록">
            <StatsCard math={data.stats} english={english.stats} wrongMath={wrong.math} wrongEnglish={wrong.english} />
          </section>
        )}
      </main>
    </div>
  );
}
