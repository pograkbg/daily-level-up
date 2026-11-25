/**
 * 레벨·성장 단계 계산 (순수 비즈니스 로직, UI와 무관)
 *
 * - 레벨 N에서 N+1로 올라가는 데 필요한 경험치 = 100 * N
 *   (1→2: 100, 2→3: 200, 3→4: 300 ...)
 */

import type { GrowthStage } from "@/types/game";

const XP_BASE = 100;

/** 현재 레벨에서 다음 레벨까지 필요한 경험치 */
export function xpNeededForLevel(level: number): number {
  return XP_BASE * level;
}

export interface LevelInfo {
  level: number; // 현재 레벨
  xpIntoLevel: number; // 이번 레벨에서 쌓은 경험치
  xpForNextLevel: number; // 이번 레벨을 끝내는 데 필요한 경험치
  progressPercent: number; // 0~100 (진행 바용)
}

/** 누적 경험치(totalXp)로 레벨 정보를 계산합니다. */
export function getLevelInfo(totalXp: number): LevelInfo {
  let level = 1;
  let remaining = Math.max(0, Math.floor(totalXp));

  // 필요한 경험치를 하나씩 빼가며 레벨을 올립니다.
  while (remaining >= xpNeededForLevel(level)) {
    remaining -= xpNeededForLevel(level);
    level += 1;
  }

  const xpForNextLevel = xpNeededForLevel(level);
  return {
    level,
    xpIntoLevel: remaining,
    xpForNextLevel,
    progressPercent: Math.round((remaining / xpForNextLevel) * 100),
  };
}

/** 레벨에 따른 곤충 성장 단계 */
export function getGrowthStage(level: number): GrowthStage {
  if (level >= 9) return "adult"; // 성충
  if (level >= 6) return "pupa"; // 번데기
  if (level >= 3) return "larva"; // 애벌레
  return "egg"; // 알
}

export const GROWTH_STAGE_LABEL: Record<GrowthStage, string> = {
  egg: "알",
  larva: "애벌레",
  pupa: "번데기",
  adult: "성충",
};
