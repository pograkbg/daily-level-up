import type { SemesterProgress } from "@/lib/data/semester-repository";
import { ProgressBar } from "@/components/ui/ProgressBar";

/** 이번 학기 진도 카드. 기준 진도와 모의고사 열림 여부를 보여 줍니다. */
/** 학기 진도 내용만 (박스 없음). 미션 카드 안에 넣어서 씁니다. */
export function SemesterProgressBody({ grade, progress }: { grade: number; progress: SemesterProgress }) {
  const percent = Math.min(100, Math.round((progress.solved / progress.target) * 100));
  const requiredPercent = Math.min(100, Math.round((progress.required / progress.target) * 100));

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-lg font-extrabold text-ink">
          {grade}학년 {progress.semester}학기 진도
        </p>
        <span
          className={`rounded-full px-3 py-1 text-sm font-bold ${
            progress.mockOpen ? "bg-xp/40 text-ink" : "bg-ink/5 text-ink-soft"
          }`}
        >
          {progress.mockOpen ? "🎯 레벨 상승 모의고사 열림" : "모의고사는 진도가 채워지면 열려요"}
        </span>
      </div>
      <div className="relative">
        <ProgressBar value={percent} label={`학기 진도 ${progress.solved} / ${progress.target}문제`} colorClass="bg-primary" heightClass="h-4" />
        <span
          aria-hidden
          className="pointer-events-none absolute -top-1 bottom-[-4px] w-0.5 bg-ink"
          style={{ left: `${requiredPercent}%` }}
        />
      </div>
      <div className="flex flex-wrap justify-between gap-2 text-sm font-bold text-ink-soft">
        <span>
          푼 문제 {progress.solved} / {progress.target}
        </span>
        <span>
          지금까지 필요한 진도 {progress.required}문제 · 정답률 {progress.solved > 0 ? Math.round((progress.correct / progress.solved) * 100) : 0}%
        </span>
      </div>
    </div>
  );
}
