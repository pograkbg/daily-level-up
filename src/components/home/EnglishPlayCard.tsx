import Link from "next/link";
import { buttonClassName } from "@/components/ui/Button";
import { SubjectBox, type StepProps } from "@/components/home/SubjectBox";
import type { EnglishSemesterProgress } from "@/lib/data/english-semester-repository";

interface EnglishPlayCardProps {
  grade: number;
  englishProgress: EnglishSemesterProgress;
}

/** 영어 박스 (2학년 이상). 1 발음 연습 · 2 단어 맞추기 */
export function EnglishPlayCard({ grade, englishProgress }: EnglishPlayCardProps) {
  const percent = englishProgress.target > 0 ? Math.min(100, Math.round((englishProgress.correct / englishProgress.target) * 100)) : 0;

  // 1 발음 연습: 아직 화면을 만들기 전이라 준비 중으로 둡니다.
  const step1: StepProps = {
    no: 1,
    title: "발음 연습",
    meta: "듣기 중심",
    percent: 0,
    barLabel: "발음 연습 준비 중",
    barColor: "bg-xp",
    note: "단어를 듣고 따라 읽는 연습이 곧 열려요",
    action: (
      <span className={`${buttonClassName()} pointer-events-none opacity-50`} aria-disabled="true">
        🔊 발음 연습 (준비 중)
      </span>
    ),
  };

  const step2: StepProps = {
    no: 2,
    title: "단어 맞추기",
    meta: `${englishProgress.correct} / ${englishProgress.target}`,
    percent,
    barLabel: `영어 정답 진도 ${percent}%`,
    barColor: "bg-primary",
    note: `단어 ${englishProgress.words}개 × 5번 정답이 목표예요 · ${englishProgress.mockOpen ? "🎯 모의고사 열림" : "모의고사는 진도가 채워지면 열려요"}`,
    action: (
      <div className="grid grid-cols-2 gap-2">
        <Link href="/english2" className={buttonClassName({ variant: "secondary" })}>
          🔤 단어 맞추기
        </Link>
        {englishProgress.mockOpen ? (
          <Link href="/english2/mock" className={buttonClassName()}>
            🎯 모의고사
          </Link>
        ) : (
          <span className={`${buttonClassName({ variant: "secondary" })} pointer-events-none opacity-50`} aria-disabled="true">
            🔒 모의고사
          </span>
        )}
      </div>
    ),
  };

  return (
    <SubjectBox
      badge="🔤 영어 플레이"
      title="영어 미션"
      caption={`${grade}학년 영어 · 한 번에 20문제`}
      count={`${englishProgress.grade}학년 ${englishProgress.semester}학기`}
      step1={step1}
      step2={step2}
    />
  );
}
