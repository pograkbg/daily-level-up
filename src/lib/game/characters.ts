/**
 * 캐릭터 조립 (곤충 도감 + 성장 단계). mock/DB 어디서든 같이 씁니다.
 */

import { getGrowthStage, GROWTH_STAGE_LABEL } from "@/lib/game/level";
import { insectById, type InsectId } from "@/lib/game/insects";
import type { InsectCharacter } from "@/types/game";

export type { InsectId };

/** 성충이 되는 레벨 (이 레벨부터 새 친구를 고릅니다) */
export const ADULT_LEVEL = 9;

/** 레벨 1부터 ADULT_LEVEL 까지 필요한 누적 경험치 (100 × 1 + … + 100 × 8) */
export const ADULT_XP = 100 * ((ADULT_LEVEL - 1) * ADULT_LEVEL) / 2;

/** 캐릭터 레벨 표시용 정보 (성장 단계 포함) */
export function buildCharacter(id: InsectId, level: number): InsectCharacter {
  const info = insectById(id);
  const stage = getGrowthStage(level);
  return {
    id,
    name: info?.name ?? id,
    title: info?.name ?? id,
    description: info?.tagline ?? "",
    stage,
    stageLabel: GROWTH_STAGE_LABEL[stage],
    emoji: info?.icon ?? "🐛",
  };
}
