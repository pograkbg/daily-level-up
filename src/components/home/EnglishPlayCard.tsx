import Link from "next/link";
import { buttonClassName } from "@/components/ui/Button";
import { NoticeButton } from "@/components/ui/NoticeButton";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { englishLevelName } from "@/lib/game/english-quiz";
import { getDailyGoalPercent } from "@/lib/game/mission";
import type { EnglishLevelSummary } from "@/types/english";

interface EnglishPlayCardProps {
  summary: EnglishLevelSummary[];
  dailyUsed: number;
  dailyMax: number;
  studiedMinutes: number; // 오늘 수학+영어 학습 시간 (분)
  dailyGoalMinutes: number;
}

/** 영어 플레이 카드 (대시보드 오른쪽 칸). 수학 카드와 같은 높이 구조로 줄였습니다. */
export function EnglishPlayCard({ summary, dailyUsed, dailyMax, studiedMinutes, dailyGoalMinutes }: EnglishPlayCardProps) {
  const goalPercent = getDailyGoalPercent(studiedMinutes, dailyGoalMinutes);
  const open = summary.filter((s) => s.unlocked);
  const current = open[open.length - 1] ?? summary[0];
  const learned = open.reduce((sum, s) => sum + s.learned, 0);
  const total = open.reduce((sum, s) => sum + s.total, 0);
  const percent = total === 0 ? 0 : Math.round((learned / total) * 100);
  const done = dailyUsed >= dailyMax;

  return (
    <Card className="flex h-full flex-col justify-between gap-5">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <span className="w-fit rounded-full bg-sky px-3 py-1 text-sm font-bold text-primary-dark">🔤 영어 플레이</span>
          <span className="text-sm font-bold text-ink-soft">오늘 {dailyUsed} / {dailyMax}회</span>
        </div>
        <h2 className="text-2xl font-extrabold leading-snug text-ink">영어 미션</h2>
        <p className="text-sm font-bold text-ink-soft">
          English Quest · {englishLevelName(current?.level ?? 1)} · 한 번에 20문제
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex justify-between text-sm font-bold text-ink">
          <span>열린 레벨 익힌 단어</span>
          <span>
            {learned} / {total}개
          </span>
        </div>
        <ProgressBar value={percent} label={`영어 진도 ${percent}%`} colorClass="bg-xp" heightClass="h-3" />
      </div>

      <div className="grid grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] gap-2">
        {done ? (
          <NoticeButton
            label="✏️ 영어 퀴즈 시작하기"
            title="오늘 퀴즈는 끝났어요"
            message={`오늘 퀴즈를 ${dailyMax}회 모두 풀었어요. 내일 다시 만나요!`}
          />
        ) : (
          <Link href={`/english/quiz?level=${current?.level ?? 1}`} className={buttonClassName()}>
            ✏️ 영어 퀴즈 시작하기
          </Link>
        )}
        <Link href="/english" className={buttonClassName({ variant: "secondary" })}>
          📚 레벨 선택
        </Link>
      </div>

      <div className="flex items-center gap-3 rounded-2xl bg-mint/60 px-3 py-2">
        <span className="shrink-0 text-sm font-bold text-ink">
          학습 목표 {studiedMinutes}/{dailyGoalMinutes}분
        </span>
        <ProgressBar value={goalPercent} label={`하루 목표 진행률 ${goalPercent}%`} colorClass="bg-xp" heightClass="h-2.5" />
      </div>
    </Card>
  );
}
