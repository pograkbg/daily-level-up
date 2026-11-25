import Link from "next/link";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { buttonClassName } from "@/components/ui/Button";
import { hasChildProfile } from "@/lib/data/child-repository";
import { getEnglishWrongWords } from "@/lib/data/english-repository";
import { englishLevelName } from "@/lib/game/english-quiz";

export const dynamic = "force-dynamic";

/** 단계별 오답노트: 한 번이라도 틀린 단어와 뜻, 예문 */
export default async function NotebookPage({ searchParams }: { searchParams: Promise<{ level?: string }> }) {
  if (!(await hasChildProfile())) {
    redirect("/setup");
  }
  const { level: raw } = await searchParams;
  const level = Number(raw);
  if (!Number.isInteger(level) || level < 1 || level > 3) {
    redirect("/english");
  }

  const words = await getEnglishWrongWords(level);

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col gap-5 px-4 py-6 sm:px-6 sm:py-8">
      <nav className="flex items-center justify-between gap-3">
        <Link href="/english" className="flex min-h-12 items-center rounded-full bg-white px-5 font-bold text-ink shadow-md">
          ← 영어 학습
        </Link>
        <p className="text-sm font-bold text-ink-soft">{englishLevelName(level)} 오답노트</p>
      </nav>

      <div className="flex flex-col gap-3">
        <h1 className="text-2xl font-extrabold text-ink">오답노트 ({words.length}개)</h1>
        {words.length > 0 && (
          <Link href={`/english/quiz?level=${level}&wrong=1`} className={buttonClassName()}>
            🔁 오답만 다시 풀기
          </Link>
        )}
      </div>

      {words.length === 0 ? (
        <Card className="text-center">
          <p className="font-bold text-ink">아직 틀린 단어가 없어요. 퀴즈를 먼저 풀어 보세요!</p>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {words.map((w) => (
            <Card key={w.id} className="flex flex-col gap-2 p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="text-xl font-extrabold text-ink">{w.word}</p>
                <p className="text-sm font-bold text-red-500">틀린 횟수 {w.wrong}회</p>
              </div>
              <p className="text-base font-bold text-ink">{w.meaning}</p>
              <p className="text-sm text-ink">{w.example}</p>
              <p className="text-xs text-ink-soft">{w.exampleKo}</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
