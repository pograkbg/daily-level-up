import Link from "next/link";
import { CharacterBand } from "@/components/home/CharacterBand";
import type { WrongEnglishItem, WrongMathItem } from "@/lib/data/wrong-answers-repository";
import { EnglishPlayCard } from "@/components/home/EnglishPlayCard";
import { GradeApproval } from "@/components/home/GradeApproval";
import { HomeHeader } from "@/components/home/HomeHeader";
import { MissionHero } from "@/components/home/MissionHero";
import { StatsCard } from "@/components/home/StatsCard";
import { NewFriendPicker } from "@/components/forest/NewFriendPicker";
import { isGradeCleared, OPERATOR_NAMES } from "@/lib/game/learning-levels";
import { LevelUpPrompt } from "@/components/home/LevelUpPrompt";
import type { HomeData } from "@/types/game";
import type { EnglishLevelSummary, EnglishStats } from "@/types/english";

interface HomeScreenProps {
  data: HomeData;
  isAdmin: boolean;
  wrong: { math: WrongMathItem[]; english: WrongEnglishItem[] };
  loginEmail?: string | null;
  english: { summary: EnglishLevelSummary[]; dailyUsed: number; dailyMax: number; stats: EnglishStats };
}

/**
 * 대시보드 홈
 * 1) 위: 요약 줄 (캐릭터 레벨, 누적 경험치, 보유 코인, 연속 학습, 숲·영어 이동)
 * 2) 가운데: 플레이 두 개를 같은 크기로 나란히 (수학 | 영어)
 * 3) 아래: 내 친구 · 학습 기록 · 연산별 현황 (보기 전용)
 */
export function HomeScreen({ data, english, isAdmin, loginEmail, wrong }: HomeScreenProps) {
  const { profile } = data;
  const gradeCleared = isGradeCleared(profile.progress);
  // 오늘 학습 시간 = 수학 풀이 시간 + 영어 풀이 시간 (실제로 잰 값)
  const studiedMinutes = Math.round((data.stats.today.ms + english.stats.todayMs) / 60000);

  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute -left-16 top-10 h-56 w-56 rounded-full bg-mint/60 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -right-20 top-40 h-72 w-72 rounded-full bg-peach/70 blur-3xl" />

      <main className="relative mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 pb-8 pt-6 sm:gap-5 sm:px-6 sm:pt-8 [@media(max-height:860px)]:gap-2 [@media(max-height:860px)]:pb-3 [@media(max-height:860px)]:pt-3">
        <HomeHeader profile={profile} isAdmin={isAdmin} loginEmail={loginEmail ?? null} />

        {profile.grade <= 1 && (
          <Link
            href="/early"
            className="flex min-h-20 items-center justify-center rounded-3xl bg-primary text-2xl font-extrabold text-white shadow-md transition active:translate-y-1"
          >
            🧸 오늘의 놀이 시작하기 ›
          </Link>
        )}

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

        <section className="grid flex-1 grid-cols-1 items-stretch gap-6 md:grid-cols-2" aria-label="플레이">
          <MissionHero
            mission={data.todayMission}
            attempts={data.attempts}
            practice={profile.practice}
            progress={profile.progress}
            stats={data.stats}
            dailyGoalMinutes={data.dailyGoalMinutes}
            studiedMinutes={studiedMinutes}
          />
          <EnglishPlayCard
            summary={english.summary}
            dailyUsed={english.dailyUsed}
            dailyMax={english.dailyMax}
            studiedMinutes={studiedMinutes}
            dailyGoalMinutes={data.dailyGoalMinutes}
          />
        </section>

        <section aria-label="기록">
          <StatsCard math={data.stats} english={english.stats} wrongMath={wrong.math} wrongEnglish={wrong.english} />
        </section>
      </main>
    </div>
  );
}
