import Link from "next/link";
import { redirect } from "next/navigation";
import { EarlyQuiz } from "@/components/early/EarlyQuiz";
import { hasChildProfile } from "@/lib/data/child-repository";
import { getGrade2EnglishProgress } from "@/lib/data/english-semester-repository";
import { getHomeData } from "@/lib/data/home-repository";
import { loadGrade2English, MOCK_ENGLISH_QUESTIONS } from "@/lib/data/grade2-english-repository";
import { MOCK_PASS_SCORE, semesterAt } from "@/lib/game/semester";

export const dynamic = "force-dynamic";

/** 영어 모의고사: 이번 학기 단어에서 랜덤 50문제. 열린 경우에만 풉니다. */
export default async function EnglishMockPage() {
  if (!(await hasChildProfile())) {
    redirect("/setup");
  }
  const { profile } = await getHomeData();
  if (profile.grade !== 2) {
    redirect("/");
  }

  const progress = await getGrade2EnglishProgress();
  const semester = semesterAt().semester;

  if (!progress.mockOpen) {
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-4 px-4 py-8">
        <div className="rounded-[2rem] bg-white p-6 text-center shadow-xl">
          <p className="text-4xl" aria-hidden>
            🔒
          </p>
          <p className="mt-2 text-lg font-extrabold text-ink">아직 모의고사가 열리지 않았어요</p>
          <p className="mt-2 text-sm font-bold text-ink-soft">
            정답 {progress.correct}개 (필요 {progress.required}개 이상) · 정답률 90% 이상이면 열려요.
          </p>
        </div>
        <Link href="/" className="text-center font-bold text-primary-dark underline">
          홈으로 가기
        </Link>
      </div>
    );
  }

  const items = await loadGrade2English(semester, MOCK_ENGLISH_QUESTIONS);
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col gap-5 px-4 py-6 sm:px-6 sm:py-8">
      <EarlyQuiz
        title={`2학년 ${semester}학기 영어 모의고사`}
        subject="english"
        items={items}
        grade={2}
        exitHref="/"
        passScore={Math.ceil((items.length * MOCK_PASS_SCORE) / 100)}
      />
    </div>
  );
}
