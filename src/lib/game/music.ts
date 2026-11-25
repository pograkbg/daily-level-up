/**
 * 배경음악 설정 (레벨별)
 *
 * - 연산별 학습 레벨의 평균으로 하·중·상 중 하나를 고릅니다.
 * - 파일이 없는 단계(null)는 음악 없이 진행합니다.
 * - 음악 파일은 public/audio 에 둡니다. 출처와 라이선스는 docs/MUSIC_CREDITS.md 에 적습니다.
 */

import { OPERATORS, type Band, type Progress } from "@/lib/game/learning-levels";

export const BGM_BY_BAND: Record<Band, string | null> = {
  0: "/audio/bgm-easy.ogg", // 하: Flowerbed Fields [Loop] (CC0)
  1: "/audio/bgm-mid.ogg", // 중: 4 Chiptunes (Adventure) 1. Stage 1 (CC0)
  2: "/audio/bgm-hard.ogg", // 상: Overworld Theme (CC0)
};

/** 네 연산의 평균 레벨로 음악 단계를 고릅니다. (1~5 하, 6~10 중, 11~15 상) */
export function bandForProgress(progress: Progress): Band {
  const avg = OPERATORS.reduce((sum, op) => sum + progress[op].level, 0) / OPERATORS.length;
  if (avg <= 5) return 0;
  if (avg <= 10) return 1;
  return 2;
}
