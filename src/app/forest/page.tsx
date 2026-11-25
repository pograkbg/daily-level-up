import Link from "next/link";
import { redirect } from "next/navigation";
import { NewFriendPicker } from "@/components/forest/NewFriendPicker";
import { Card } from "@/components/ui/Card";
import { InsectGlyph } from "@/components/ui/InsectGlyph";
import { hasChildProfile } from "@/lib/data/child-repository";
import { getHomeData } from "@/lib/data/home-repository";
import { INSECTS, type InsectId } from "@/lib/game/insects";

export const dynamic = "force-dynamic";

/** 배움의 숲: 키운 친구들이 모여 있는 도감. 모든 카드가 같은 높이·같은 순서로 보입니다. */
export default async function ForestPage() {
  if (!(await hasChildProfile())) {
    redirect("/setup");
  }
  const data = await getHomeData();
  const { profile } = data;
  const grown = new Set<InsectId>(profile.collection);

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-extrabold text-ink">🌳 배움의 숲</h1>
          <p className="text-base font-bold text-ink-soft">
            {profile.nickname}의 숲 · 키운 친구 {profile.collection.length}명 / 전체 {INSECTS.length}명
          </p>
        </div>
        <Link
          href="/"
          className="flex min-h-12 items-center rounded-2xl bg-butter px-5 text-base font-extrabold text-ink shadow-[0_4px_0_0_#e8d88a] transition active:translate-y-1"
        >
          ← 홈으로
        </Link>
      </header>

      {profile.pendingNewCharacter && <NewFriendPicker collection={profile.collection} />}

      <section aria-label="친구 도감" className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {INSECTS.map((insect) => {
          const isCurrent = insect.id === profile.characterId && !profile.pendingNewCharacter;
          const isGrown = grown.has(insect.id);
          const unlocked = isCurrent || isGrown;
          const status = isCurrent ? "지금 키우는 중" : isGrown ? "성충 졸업" : "아직 만나지 않았어요";
          const statusClass = isCurrent ? "bg-primary text-white" : isGrown ? "bg-xp/40 text-ink" : "bg-ink/5 text-ink-soft";

          return (
            <Card
              key={insect.id}
              className={`flex h-full flex-col items-center gap-3 p-5 text-center ${
                isCurrent ? "border-primary" : ""
              } ${unlocked ? "" : "opacity-70"}`}
            >
              <span className={`rounded-full px-3 py-1 text-sm font-bold ${statusClass}`}>{status}</span>
              <div
                aria-hidden
                className={`flex h-24 w-24 items-center justify-center rounded-full text-6xl ${
                  unlocked ? "bg-mint" : "bg-ink/5 grayscale"
                }`}
              >
                <InsectGlyph icon={insect.icon} className="h-20 w-20 text-6xl" />
              </div>
              <p className="text-xl font-extrabold text-ink">{insect.name}</p>
              <p className="text-sm font-bold text-ink-soft">{insect.habitat}에 살아요</p>
              <ul className="flex flex-wrap justify-center gap-2">
                {insect.features.map((f) => (
                  <li key={f} className="rounded-full bg-white px-3 py-1 text-sm font-bold text-ink shadow-sm">
                    {f}
                  </li>
                ))}
              </ul>
            </Card>
          );
        })}
      </section>
    </div>
  );
}
