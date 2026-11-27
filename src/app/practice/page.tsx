import Link from "next/link";
import { redirect } from "next/navigation";
import { EarlyQuiz } from "@/components/early/EarlyQuiz";
import { hasChildProfile } from "@/lib/data/child-repository";
import { getDifficultyParams, getUnit, listUnits } from "@/lib/data/curriculum-repository";
import { getHomeData } from "@/lib/data/home-repository";
import type { EarlyItem } from "@/lib/data/early-repository";
import { buildCurriculumSet } from "@/lib/game/curriculum";

export const dynamic = "force-dynamic";

/** 연습에 쓰는 난이도 (지금은 3으로 고정, 나중에 진도에 맞춥니다) */
const PRACTICE_DIFFICULTY = 3;
const PRACTICE_COUNT = 10;

/** 오늘의 단원 연습: 단원을 고르고 DB 규칙으로 만든 문제 10개를 풉니다. */
export default async function PracticePage({ searchParams }: { searchParams: Promise<{ unit?: string }> }) {
  if (!(await hasChildProfile())) {
    redirect("/setup");
  }
  const { profile } = await getHomeData();
  if (profile.grade < 1) {
    redirect("/early");
  }

  const { unit: unitParam } = await searchParams;
  const units = await listUnits(profile.grade);

  if (!unitParam) {
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col gap-5 px-4 py-6 sm:px-6 sm:py-8">
        <nav className="flex items-center justify-between gap-3">
          <Link href="/" className="flex min-h-12 items-center rounded-full bg-white px-5 font-bold text-ink shadow-md">
            ← 홈으로
          </Link>
        </nav>
        <h1 className="text-2xl font-extrabold text-ink">{profile.grade}학년 단원 연습</h1>
        <p className="font-bold text-ink-soft">단원을 고르면 문제 10개를 풀어요.</p>
        <ul className="flex flex-col gap-3">
          {units.map((u) => (
            <li key={u.id}>
              <Link
                href={`/practice?unit=${u.id}`}
                className="flex items-center justify-between gap-3 rounded-2xl bg-white px-5 py-4 font-bold text-ink shadow-md"
              >
                <span>
                  <span className="text-sm text-ink-soft">{u.semester}학기</span>
                  <span className="block text-lg">{u.unit}</span>
                </span>
                <span className="text-sm text-ink-soft">{u.field}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  const unit = await getUnit(Number(unitParam));
  if (!unit || unit.grade !== profile.grade) {
    redirect("/practice");
  }

  const params = await getDifficultyParams(unit.kind, PRACTICE_DIFFICULTY);
  if (!params) {
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-4 px-4 py-8">
        <p className="rounded-2xl bg-white p-6 text-center font-bold text-ink">이 단원의 문제 규칙을 찾지 못했어요.</p>
        <Link href="/practice" className="text-center font-bold text-primary-dark underline">
          다른 단원 고르기
        </Link>
      </div>
    );
  }

  const set = buildCurriculumSet(unit.kind, params, PRACTICE_COUNT);
  const items: EarlyItem[] = set.map((p, i) => ({
    key: `${i}-${p.prompt}`,
    problemId: null,
    kind: unit.kind,
    prompt: p.prompt,
    choices: p.choices,
    answer: p.answer,
  }));

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col gap-5 px-4 py-6 sm:px-6 sm:py-8">
      <EarlyQuiz title={`${unit.grade}학년 ${unit.semester}학기 · ${unit.unit}`} subject="math" items={items} grade={profile.grade} exitHref="/" />
    </div>
  );
}
