import Link from "next/link";
import { buttonClassName } from "@/components/ui/Button";
import { SubjectBox, type RowProps } from "@/components/home/SubjectBox";
import type { EnglishSemesterProgress } from "@/lib/data/english-semester-repository";
import { MOCK_MIN_ACCURACY } from "@/lib/game/semester";
import type { EnglishLevelSummary } from "@/types/english";

interface EnglishPlayCardProps {
  summary: EnglishLevelSummary[];
  dailyUsed: number;
  dailyMax: number;
  grade: number;
  englishProgress: EnglishSemesterProgress;
}

/** 영어 박스 (2학년 이상): 1 영어 퀴즈 · 2 단어 맞추기 · 3 모의고사 */
export function EnglishPlayCard({ summary, dailyUsed, dailyMax, englishProgress }: EnglishPlayCardProps) {
  const open = summary.filter((s) => s.unlocked);
  const current = open[open.length - 1] ?? summary[0];
  const quizDone = dailyUsed >= dailyMax;
  const quizPercent = dailyMax > 0 ? Math.min(100, Math.round((dailyUsed / dailyMax) * 100)) : 0;
  const wordPercent = englishProgress.target > 0 ? Math.min(100, Math.round((englishProgress.correct / englishProgress.target) * 100)) : 0;
  const accuracy = englishProgress.solved > 0 ? Math.round((englishProgress.correct / englishProgress.solved) * 100) : 0;

  const row1: RowProps = {
    no: 1,
    title: "영어 퀴즈",
    meta: "한 번에 20문제",
    percent: quizPercent,
    barLabel: `오늘 퀴즈 ${dailyUsed}회`,
    barColor: "bg-xp",
    note: quizDone ? "오늘 퀴즈는 끝났어요. 내일 다시 만나요!" : "한 번에 20문제",
    action: quizDone ? (
      <span className={`${buttonClassName({ size: "row" })} pointer-events-none opacity-50`} aria-disabled="true">
        ✏️ 영어 퀴즈 시작하기
      </span>
    ) : (
      <Link href={`/english/quiz?level=${current?.level ?? 1}`} className={buttonClassName({ size: "row" })}>
        ✏️ 영어 퀴즈 시작하기
      </Link>
    ),
  };

  const row2: RowProps = {
    no: 2,
    title: "단어 맞추기",
    meta: `${englishProgress.correct} / ${englishProgress.target}`,
    percent: wordPercent,
    barLabel: `영어 정답 진도 ${wordPercent}%`,
    barColor: "bg-primary",
    note: `단어 ${englishProgress.words}개 × 5번 정답이 목표예요`,
    action: (
      <Link href="/english2" className={buttonClassName({ variant: "secondary", size: "row" })}>
        🔤 영어 단어 맞추기
      </Link>
    ),
  };

  const row3: RowProps = {
    no: 3,
    title: "레벨업 모의고사",
    meta: englishProgress.mockOpen ? "열림" : "잠김",
    percent: accuracy,
    barLabel: `정답률 ${accuracy}% (${Math.round(MOCK_MIN_ACCURACY * 100)}% 이상 열림)`,
    barColor: "bg-xp",
    note: englishProgress.mockOpen ? "모의고사를 볼 수 있어요" : "진도와 정답률이 채워지면 열려요",
    action: englishProgress.mockOpen ? (
      <Link href="/english2/mock" className={buttonClassName({ size: "row" })}>
        🎯 레벨업 모의고사
      </Link>
    ) : (
      <span className={`${buttonClassName({ variant: "secondary", size: "row" })} pointer-events-none opacity-50`} aria-disabled="true">
        🔒 레벨업 모의고사
      </span>
    ),
  };

  return (
    <SubjectBox
      badge="🔤 영어 플레이"
      title="영어 미션"
      count={`오늘 ${dailyUsed} / ${dailyMax}회`}
      rows={[row1, row2, row3]}
    />
  );
}
