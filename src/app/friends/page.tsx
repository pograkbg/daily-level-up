import Link from "next/link";
import { redirect } from "next/navigation";
import { listFriendRanking } from "@/lib/data/friend-repository";
import { insectById } from "@/lib/game/insects";
import { GROWTH_STAGE_LABEL, getGrowthStage, getLevelInfo } from "@/lib/game/level";
import { InsectGlyph } from "@/components/ui/InsectGlyph";

export const dynamic = "force-dynamic";

type SortKey = "level" | "time";

function formatStudy(ms: number): string {
  const minutes = Math.floor(ms / 60000);
  if (minutes < 60) return `${minutes}분`;
  return `${Math.floor(minutes / 60)}시간 ${minutes % 60}분`;
}

/** 친구 랭킹: 정렬 기준만 고르면 목록이 다시 정렬됩니다. */
export default async function FriendsPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string }>;
}) {
  const params = await searchParams;
  const sort: SortKey = params.sort === "time" ? "time" : "level";
  const result = await listFriendRanking();

  if (!result.ok) {
    return (
      <Shell>
        <p className="font-bold text-red-500">{result.error}</p>
      </Shell>
    );
  }
  if (result.data.length === 0 && process.env.DATA_SOURCE === "supabase") {
    redirect("/");
  }

  const rows = [...result.data].sort((a, b) =>
    sort === "time" ? b.totalStudyMs - a.totalStudyMs : b.charXp - a.charXp,
  );

  return (
    <Shell>
      <div className="flex flex-wrap gap-2">
        <SortLink href="/friends?sort=level" active={sort === "level"} label="레벨순" />
        <SortLink href="/friends?sort=time" active={sort === "time"} label="공부 시간순" />
      </div>

      {rows.length === 0 ? (
        <p className="text-base font-bold text-ink-soft">아직 함께하는 친구가 없어요.</p>
      ) : (
        <ol className="flex flex-col gap-2">
          {rows.map((r, i) => (
            <li
              key={r.childId}
              className="flex items-center gap-3 rounded-2xl border-2 border-white bg-white px-4 py-3 shadow-sm"
            >
              <span className="w-8 text-center text-lg font-extrabold text-ink-soft">{i + 1}</span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-base font-extrabold text-ink">{r.nickname}</span>
                <span className="truncate text-xs font-bold text-ink-soft">{r.accountMask}</span>
              </span>
              <span className="flex w-28 items-center justify-center gap-2">
                <InsectGlyph icon={insectById(r.characterId)?.icon ?? "🐛"} className="h-9 w-9 text-2xl" />
                <span className="truncate text-sm font-bold text-ink">
                  {insectById(r.characterId)?.name ?? r.characterId}
                </span>
              </span>
              <span className="w-20 text-center text-sm font-bold text-ink">
                {GROWTH_STAGE_LABEL[getGrowthStage(getLevelInfo(r.charXp).level)]}
              </span>
              <span className="w-14 text-center text-sm font-extrabold text-primary-dark">
                Lv.{getLevelInfo(r.charXp).level}
              </span>
              <span className="w-24 text-right text-sm font-bold text-ink-soft">{formatStudy(r.totalStudyMs)}</span>
            </li>
          ))}
        </ol>
      )}
    </Shell>
  );
}

function SortLink({ href, active, label }: { href: string; active: boolean; label: string }) {
  return (
    <Link
      href={href}
      className={`flex min-h-12 items-center rounded-2xl px-5 font-extrabold shadow-md ${
        active ? "bg-primary text-white" : "bg-white text-ink"
      }`}
    >
      {label}
    </Link>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col gap-5 px-4 py-6 sm:px-6">
      <nav>
        <Link
          href="/"
          className="flex min-h-12 items-center rounded-2xl bg-butter px-5 font-extrabold text-ink shadow-[0_4px_0_0_#e8d88a]"
        >
          ← 홈으로
        </Link>
      </nav>
      <h1 className="text-2xl font-extrabold text-ink">친구 랭킹</h1>
      {children}
    </div>
  );
}
