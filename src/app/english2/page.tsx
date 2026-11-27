import Link from "next/link";
import { redirect } from "next/navigation";
import { EarlyQuiz } from "@/components/early/EarlyQuiz";
import { loadGrade2English } from "@/lib/data/grade2-english-repository";
import { hasChildProfile } from "@/lib/data/child-repository";
import { getHomeData } from "@/lib/data/home-repository";
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
      <EarlyQuiz title={`2학년 ${semester}학기 영어 단어`} subject="english" items={items} grade={2} />
    </div>
  );
}
