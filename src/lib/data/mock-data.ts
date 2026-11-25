/**
 * [MOCK 데이터] 테스트용 초기값입니다.
 * DATA_SOURCE=mock 일 때 mock-store.ts 가 이 값으로 시작합니다.
 */

import { DAILY_GOAL_MINUTES } from "@/lib/game/mission-config";
import type { PlayerProfile } from "@/types/game";

/** 시작 시점의 테스트 아이 프로필 (누적 430 XP = 레벨 3, 3일 연속) */
export const MOCK_PROFILE: PlayerProfile = {
  id: "mock-child-1",
  nickname: "하린",
  grade: 2,
  characterId: "honeybee",
  totalXp: 430,
  characterXp: 430,
  pendingNewCharacter: false,
  collection: [],
  coins: 120,
  streakDays: 3,
  progress: {
    "+": { level: 1, xp: 0 },
    "-": { level: 1, xp: 0 },
    "×": { level: 1, xp: 0 },
    "÷": { level: 1, xp: 0 },
  },
  practice: { mode: "random", bands: { "+": null, "-": null, "×": null, "÷": null } },
  nextGradeApproved: false,
};

/** 어제까지 3일 연속 학습한 상태로 시작 (오늘 보상을 받으면 4일) */
export const MOCK_LAST_STUDY_OFFSET_DAYS = -1;

export const MOCK_DAILY_GOAL_MINUTES = DAILY_GOAL_MINUTES;
export const MOCK_STUDIED_MINUTES = 12;
