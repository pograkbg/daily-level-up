import Link from "next/link";
import { redirect } from "next/navigation";
import { EarlyQuiz } from "@/components/early/EarlyQuiz";
import { hasChildProfile } from "@/lib/data/child-repository";
import { loadEarlySet, type EarlySubject } from "@/lib/data/early-repository";
import { getHomeData } from "@/lib/data/home-repository";
import { GRADE_LABEL } from "@/lib/game/grade";

export const dynamic = "force-dynamic";

const SUBJECT_TITLE: Record<EarlySubject, string> = {
  math: "수학",
  english: "영어",
};

/** 유아·1학년 놀이 화면. 학년은 지금 날짜 기준으로 계산된 값을 씁니다. */
export default async function EarlyPage({ searchParams }: { searchParams: Promise<{ subject?: string }> }) {
  if (!(await hasChildProfile())) {
    redirect("/setup");
  }
  const { profile } = await getHomeData();
  const grade = profile.grade;

  if (grade > 1) {
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-4 px-4 py-8">
        <div className="rounded-[2rem] bg-white p-8 text-center shadow-xl">
          <p className="text-lg font-extrabold text-ink">이 놀이는 유아와 1학년을 위한 화면이에요.</p>
          <Link href="/" className="mt-4 inline-block font-bold text-primary-dark underline">
            홈으로 가기
          </Link>
        </div>
      </div>
    );
  }

  const g = grade as 0 | 1;
  const { subject } = await searchParams;
  const gradeTitle = GRADE_LABEL[g];

  if (subject !== "math" && subject !== "english") {
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-6 px-4 py-8">
        <div className="text-center">
          <p className="text-4xl" aria-hidden>
            🧸
          </p>
          <h1 className="mt-2 text-2xl font-extrabold text-ink">{gradeTitle} 놀이</h1>
          <p className="mt-1 font-bold text-ink-soft">오늘은 무엇을 해 볼까요?</p>
        </div>
        <Link
          href="/early?subject=math"
          className="flex min-h-24 items-center justify-center rounded-3xl bg-primary text-2xl font-extrabold text-white shadow-md"
        >
          🔢 수학
        </Link>
        <Link
          href="/early?subject=english"
          className="flex min-h-24 items-center justify-center rounded-3xl bg-butter text-2xl font-extrabold text-ink shadow-md"
        >
          🔤 영어
        </Link>
        <Link href="/" className="text-center font-bold text-primary-dark underline">
          ← 홈으로
        </Link>
      </div>
    );
  }

  const items = await loadEarlySet(g, subject);
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col gap-5 px-4 py-6 sm:px-6 sm:py-8">
      <EarlyQuiz title={`${gradeTitle} ${SUBJECT_TITLE[subject]}`} subject={subject} items={items} grade={g} />
    </div>
  );
}
