import Link from "next/link";
import { redirect } from "next/navigation";
import { EarlyQuiz } from "@/components/early/EarlyQuiz";
import { loadGrade2English } from "@/lib/data/grade2-english-repository";
import { hasChildProfile } from "@/lib/data/child-repository";
import { getHomeData } from "@/lib/data/home-repository";
import { getGrade2EnglishProgress } from "@/lib/data/english-semester-repository";
import { semesterAt } from "@/lib/game/semester";

export const dynamic = "force-dynamic";

/** 2학년 영어 단어 퀴즈 (현재 학기의 단어 20개) */
export default async function Grade2EnglishPage() {
  if (!(await hasChildProfile())) {
    redirect("/setup");
  }
  const { profile } = await getHomeData();
  if (profile.grade !== 2) {
    redirect("/");
  }

  const semester = semesterAt().semester;
  const items = await loadGrade2English(semester);
  const progress = await getGrade2EnglishProgress();
  const percent = progress.target > 0 ? Math.min(100, Math.round((progress.correct / progress.target) * 100)) : 0;

  if (items.length === 0) {
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-4 px-4 py-8">
        <p className="rounded-2xl bg-white p-6 text-center font-bold text-ink">아직 이 학기의 단어가 없어요.</p>
        <Link href="/" className="text-center font-bold text-primary-dark underline">
          홈으로 가기
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col gap-5 px-4 py-6 sm:px-6 sm:py-8">
      <div className="flex flex-col gap-2 rounded-2xl bg-white/80 px-5 py-4 shadow-sm">
        <div className="flex justify-between text-sm font-bold text-ink">
          <span>이번 학기 정답</span>
          <span>
            {progress.correct} / {progress.target}
          </span>
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-ink/10" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
          <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${percent}%` }} />
        </div>
        <p className="text-xs font-bold text-ink-soft">단어 {progress.words}개 × 5번 정답이 목표예요.</p>
      </div>
      <EarlyQuiz title={`2학년 ${semester}학기 영어 단어`} subject="english" items={items} grade={2} exitHref="/" />
    </div>
  );
}
