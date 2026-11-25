import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { getLevelInfo } from "@/lib/game/level";
import { insectById } from "@/lib/game/insects";
import { ADULT_LEVEL } from "@/lib/game/characters";
import type { InsectCharacter, PlayerProfile } from "@/types/game";

interface CharacterCardProps {
  profile: PlayerProfile;
  character: InsectCharacter;
}

/** 지금 키우는 친구: 캐릭터 레벨, 성장 단계, 경험치 진행, 생김새 특징 */
export function CharacterCard({ profile, character }: CharacterCardProps) {
  const levelInfo = getLevelInfo(profile.characterXp);
  const info = insectById(character.id);
  const remaining = levelInfo.xpForNextLevel - levelInfo.xpIntoLevel;

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <div
          aria-hidden
          className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-mint text-5xl shadow-inner"
        >
          {character.emoji}
        </div>
        <div className="flex min-w-0 flex-col gap-1">
          <span className="text-sm font-bold text-ink-soft">{profile.nickname}의 친구</span>
          <h2 className="text-2xl font-extrabold text-ink">{character.name}</h2>
          <span className="rounded-full bg-lavender px-3 py-0.5 text-xs font-bold text-ink">
            {character.stageLabel}
          </span>
        </div>
      </div>

      {info && (
        <ul className="flex flex-wrap gap-2 text-xs font-bold text-ink-soft">
          {info.features.map((f) => (
            <li key={f} className="rounded-full bg-white px-3 py-1 shadow-sm">
              {f}
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-col gap-2">
        <div className="flex items-end justify-between">
          <span className="text-lg font-extrabold text-ink">캐릭터 레벨 {levelInfo.level}</span>
          <span className="text-xs font-bold text-ink-soft">
            {levelInfo.level >= ADULT_LEVEL ? "성충 완료" : `다음 레벨까지 ${remaining} 경험치`}
          </span>
        </div>
        <ProgressBar value={levelInfo.progressPercent} label={`캐릭터 경험치 진행률 ${levelInfo.progressPercent}%`} colorClass="bg-xp" heightClass="h-2.5" />
      </div>

      <Link href="/forest" className="text-center text-sm font-bold text-primary-dark underline">
        🌳 배움의 숲 보기
      </Link>
    </Card>
  );
}
