import type { EnglishSemesterProgress } from "@/lib/data/english-semester-repository";
import { ProgressBar } from "@/components/ui/ProgressBar";

/** 영어 학기 진도 카드 (단어 수 × 5번 정답이 목표). 수학 학기 진도 카드와 같은 모양입니다. */
export function EnglishProgressCard({ progress }: { progress: EnglishSemesterProgress }) {
  const percent = progress.target > 0 ? Math.min(100, Math.round((progress.correct / progress.target) * 100)) : 0;

  return (
    <div className="flex flex-col gap-3 rounded-[2rem] border-4 border-white bg-white/85 p-5 shadow-md">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-lg font-extrabold text-ink">
          {progress.grade}학년 {progress.semester}학기 영어
        </p>
        <span className="rounded-full bg-ink/5 px-3 py-1 text-sm font-bold text-ink-soft">단어 {progress.words}개</span>
      </div>
      <ProgressBar value={percent} label={`학기 영어 정답 ${progress.correct} / ${progress.target}`} colorClass="bg-primary" heightClass="h-4" />
      <div className="flex flex-wrap justify-between gap-2 text-sm font-bold text-ink-soft">
        <span>
          정답 {progress.correct} / {progress.target}
        </span>
        <span>단어 하나당 5번 정답이 목표예요</span>
      </div>
    </div>
  );
}
