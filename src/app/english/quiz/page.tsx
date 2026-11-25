import Link from "next/link";
import { redirect } from "next/navigation";
import { EnglishQuiz } from "@/components/english/EnglishQuiz";
import { FitToHeight } from "@/components/ui/FitToHeight";
import { Card } from "@/components/ui/Card";
import { buttonClassName } from "@/components/ui/Button";
import { hasChildProfile } from "@/lib/data/child-repository";
import { startEnglishQuiz } from "@/lib/data/english-repository";
import { fetchPronunciation } from "@/lib/data/english-pronunciation";

export const dynamic = "force-dynamic";

const QUIZ_QUESTIONS = 20;

/** 영어 퀴즈 화면: 레벨을 고르면 20문제를 만듭니다. wrong=1 이면 오답만 다시 풉니다. */
export default async function EnglishQuizPage({
  searchParams,
}: {
  searchParams: Promise<{ level?: string; wrong?: string }>;
}) {
  if (!(await hasChildProfile())) {
    redirect("/setup");
  }
  const { level: raw, wrong } = await searchParams;
  const level = Number(raw);
  const wrongOnly = wrong === "1";

  if (!Number.isInteger(level) || level < 1 || level > 5) {
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-4 px-4 py-8">
        <Card className="text-center">
          <p className="font-bold text-ink">레벨을 먼저 골라 주세요.</p>
          <Link href="/english" className={buttonClassName({ className: "mt-4" })}>
            레벨 선택으로
          </Link>
        </Card>
      </div>
    );
  }

  const started = await startEnglishQuiz(level, QUIZ_QUESTIONS, wrongOnly);

  // 발음 기호를 문제마다 미리 가져옵니다 (같은 단어는 서버에 잠시 저장되어 다시 부르지 않습니다).
  const result = started.ok
    ? {
        ok: true as const,
        data: {
          ...started.data,
          items: await Promise.all(
            started.data.items.map(async (item) => {
              const pron = await fetchPronunciation(item.word);
              return { ...item, ipa: pron?.ipa ?? null };
            }),
          ),
        },
      }
    : started;

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[960px] flex-col gap-5 px-4 py-6 sm:px-6 sm:py-8">
      {result.ok ? (
        <FitToHeight>
          <EnglishQuiz
            level={level}
            items={result.data.items}
            startIndex={result.data.startIndex ?? 0}
            startScore={result.data.score ?? 0}
          />
        </FitToHeight>
      ) : (
        <Card className="text-center">
          <p role="alert" className="font-bold text-red-500">
            {result.error}
          </p>
          <Link href="/english" className={buttonClassName({ variant: "secondary", className: "mt-4" })}>
            다시 고르기
          </Link>
        </Card>
      )}
    </div>
  );
}
