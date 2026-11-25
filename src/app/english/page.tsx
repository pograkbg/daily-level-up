import Link from "next/link";
import { redirect } from "next/navigation";
import { LevelUnlockButton } from "@/components/english/LevelUnlockButton";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { hasChildProfile } from "@/lib/data/child-repository";
import {
  getEnglishDailyStatus,
  getEnglishStats,
  getEnglishSummary,
} from "@/lib/data/english-repository";
import { englishLevelName } from "@/lib/game/english-quiz";

export const dynamic = "force-dynamic";

/** 영어 메인: 학습 기록, 오늘 횟수, 레벨 3단계 */
export default async function EnglishPage() {
  if (!(await hasChildProfile())) {
    redirect("/setup");
  }
  const [summary, stats, daily] = await Promise.all([
    getEnglishSummary(),
    getEnglishStats(),
    getEnglishDailyStatus(),
  ]);
  const accuracy = stats.total === 0 ? 0 : Math.round((stats.correct / stats.total) * 100);
  const dailyDone = daily.used >= daily.max;

  /** 레벨을 깼다 = 그 레벨의 단어를 모두 한 번 이상 맞힘 */
  const isCleared = (level: number) => {
    const s = summary.find((x) => x.level === level);
    return !!s && s.total > 0 && s.learned >= s.total;
  };
  /** 1레벨은 항상 열 수 있고, 그 밖의 레벨은 앞 레벨을 깨야 열 수 있습니다. */
  const canOpen = (level: number) => level === 1 || isCleared(level - 1);
  const levelButton = "flex min-h-14 w-full items-center justify-center rounded-2xl px-2 text-base font-extrabold shadow-md";

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-5xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
      <nav className="flex items-center justify-between gap-3">
        <Link href="/" className="flex min-h-12 items-center rounded-full bg-white px-5 font-bold text-ink shadow-md">
          ← 홈으로
        </Link>
        <p className="text-sm font-bold text-ink-soft">English Quest</p>
      </nav>

      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-extrabold text-ink sm:text-3xl">영어 학습</h1>
        <p className="text-sm font-bold text-ink-soft">
          오늘 퀴즈 {daily.used} / {daily.max}회 · 한 번에 20문제
        </p>
        {dailyDone && (
          <p className="text-sm font-bold text-primary-dark">오늘 퀴즈를 모두 풀었어요. 내일 다시 만나요!</p>
        )}
      </div>

      <Card className="grid grid-cols-2 gap-3 p-5 sm:grid-cols-4">
        <Stat label="푼 문제" value={`${stats.total}`} />
        <Stat label="맞힌 문제" value={`${stats.correct}`} />
        <Stat label="틀린 문제" value={`${stats.total - stats.correct}`} />
        <Stat label="정답률" value={`${accuracy}%`} />
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {summary.map((s) => {
          const percent = s.total === 0 ? 0 : Math.round((s.learned / s.total) * 100);
          const levelStats = stats.byLevel.find((b) => b.level === s.level);
          const levelAccuracy =
            levelStats && levelStats.total > 0 ? Math.round((levelStats.correct / levelStats.total) * 100) : 0;
          return (
            <Card key={s.level} className={`flex flex-col gap-4 p-5 ${s.unlocked ? "" : "opacity-70"}`}>
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-lg font-extrabold text-ink">
                  {s.unlocked ? "" : "🔒 "}
                  {englishLevelName(s.level)}
                </p>
                <p className="text-sm font-bold text-ink-soft">{s.learned} / {s.total}개 익힘</p>
              </div>
              <ProgressBar value={percent} label={`${englishLevelName(s.level)} 진도 ${percent}%`} colorClass="bg-xp" heightClass="h-3" />
              <p className="text-xs font-bold text-ink-soft">이 레벨 정답률 {levelAccuracy}%</p>

              {s.unlocked ? (
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    href={`/english/quiz?level=${s.level}`}
                    aria-disabled={dailyDone}
                    className={`${levelButton} bg-primary text-white ${dailyDone ? "pointer-events-none opacity-50" : ""}`}
                  >
                    ✏️ 퀴즈
                  </Link>
                  <Link href={`/english/notebook?level=${s.level}`} className={`${levelButton} bg-butter text-ink`}>
                    📒 오답노트
                  </Link>
                </div>
              ) : (
                <p className="rounded-2xl bg-ink/5 px-4 py-3 text-center text-sm font-bold text-ink-soft">
                  {canOpen(s.level)
                    ? "보호자가 열어 주면 시작할 수 있어요"
                    : `${englishLevelName(s.level - 1)}을 모두 깨면 열려요`}
                </p>
              )}
              <LevelUnlockButton level={s.level} unlocked={s.unlocked} canUnlock={canOpen(s.level)} />
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-2xl bg-white p-3 shadow-sm">
      <span className="text-xs font-bold text-ink-soft">{label}</span>
      <span className="text-xl font-extrabold text-ink">{value}</span>
    </div>
  );
}
