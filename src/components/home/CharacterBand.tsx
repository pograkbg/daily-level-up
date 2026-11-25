import { Fragment } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { InsectGlyph } from "@/components/ui/InsectGlyph";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { GROWTH_STAGE_LABEL, getLevelInfo } from "@/lib/game/level";
import { ADULT_LEVEL } from "@/lib/game/characters";
import type { GrowthStage, InsectCharacter, PlayerProfile } from "@/types/game";

interface CharacterBandProps {
  profile: PlayerProfile;
  character: InsectCharacter;
}

/** 성장 단계 네 칸: 알 → 애벌레 → 번데기 → 성충 (레벨 1·3·6·9에서 바뀜) */
const STAGES: { stage: GrowthStage; emoji: string; from: number }[] = [
  { stage: "egg", emoji: "🥚", from: 1 },
  { stage: "larva", emoji: "🐛", from: 3 },
  { stage: "pupa", emoji: "🧶", from: 6 },
  { stage: "adult", emoji: "🦋", from: 9 },
];

/** 지금 단계까지 칸이 채워지고, 현재 단계는 테두리로 표시됩니다. */
function StageTrack({ level, stage }: { level: number; stage: GrowthStage }) {
  return (
    <div className="flex items-center gap-1 sm:gap-1.5">
      {STAGES.map((s, i) => {
        const reached = level >= s.from;
        const current = s.stage === stage;
        return (
          <Fragment key={s.stage}>
            {i > 0 && <span className={`mt-3 h-1.5 w-2 shrink-0 rounded-full sm:mt-4 sm:w-4 ${reached ? "bg-xp" : "bg-ink/10"}`} />}
            <span className="flex flex-col items-center gap-0.5">
              <span
                aria-hidden
                className={`flex h-7 w-7 items-center justify-center rounded-full text-sm sm:h-9 sm:w-9 sm:text-lg ${
                  reached ? "bg-mint" : "bg-ink/5 grayscale"
                } ${current ? "ring-4 ring-primary/50" : ""}`}
              >
                {s.emoji}
              </span>
              <span className={`whitespace-nowrap text-xs font-bold sm:text-base ${current ? "text-ink" : "text-ink-soft"}`}>
                {GROWTH_STAGE_LABEL[s.stage]}
              </span>
            </span>
          </Fragment>
        );
      })}
    </div>
  );
}

/**
 * 지금 키우는 친구 띠 (대시보드 맨 위). 두 칸 구조는 수학·영어 카드와 같습니다.
 * 왼쪽 절반: 캐릭터 · 이름 · 단계
 * 오른쪽 절반: 레벨과 경험치 막대(영어 카드의 넓은 버튼 칸) | 배움의 숲 버튼(영어 카드의 레벨 선택 칸)
 */
export function CharacterBand({ profile, character }: CharacterBandProps) {
  const levelInfo = getLevelInfo(profile.characterXp);

  return (
    <Card className="flex flex-col gap-2 py-1 md:grid md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,0.75fr)] md:items-center md:gap-6 md:py-3">
      <div className="flex min-w-0 items-center gap-4">
        <div
          aria-hidden
          className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-mint text-4xl shadow-inner sm:h-24 sm:w-24 sm:text-6xl"
        >
          <InsectGlyph icon={character.emoji} className="h-12 w-12 text-4xl sm:h-20 sm:w-20 sm:text-6xl" />
        </div>
        <div className="flex min-w-0 flex-col gap-1">
          <div className="flex min-w-0 items-baseline gap-2">
            <span className="shrink-0 text-sm font-bold text-ink-soft">{profile.nickname}의 친구</span>
            <span className="truncate text-xl font-extrabold text-ink">{character.name}</span>
          </div>
          <StageTrack level={levelInfo.level} stage={character.stage} />
        </div>
      </div>

      <div className="flex min-w-0 flex-col gap-1.5 md:-translate-x-[76px]">
          <div className="flex items-center justify-center text-sm font-bold text-ink">
            <span className="whitespace-nowrap rounded-full bg-peach px-3 py-0.5">
              {character.stageLabel} · 레벨 {levelInfo.level}
            </span>
          </div>
          <div className="relative">
            <ProgressBar
              value={levelInfo.progressPercent}
              label={`캐릭터 경험치 진행률 ${levelInfo.progressPercent}%`}
              colorClass="bg-xp"
              heightClass="h-6"
            />
            <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-base font-extrabold text-ink">
              {levelInfo.level >= ADULT_LEVEL
                ? "성충 완료"
                : `다음 레벨까지 ${levelInfo.xpForNextLevel - levelInfo.xpIntoLevel} 경험치`}
            </span>
          </div>
      </div>

      <Link
        href="/forest"
        className="flex min-h-24 w-full items-center justify-center gap-3 rounded-3xl bg-butter px-6 py-4 text-xl font-extrabold text-ink shadow-[0_6px_0_0_#e8d88a] transition duration-100 active:translate-y-1 sm:text-2xl"
      >
        🌳 배움의 숲 가기
      </Link>
    </Card>
  );
}
