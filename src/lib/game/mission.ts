/**
 * 미션 관련 순수 계산 로직 (UI와 무관)
 */

import type { DailyMission, MissionStatus } from "@/types/game";

/** 미션 진행률 0~100 */
export function getMissionProgressPercent(mission: DailyMission): number {
  if (mission.totalQuestions <= 0) return 0;
  const percent = (mission.solvedCount / mission.totalQuestions) * 100;
  return Math.min(100, Math.round(percent));
}

export const MISSION_STATUS_LABEL: Record<MissionStatus, string> = {
  ready: "도전 준비 완료",
  in_progress: "모험 진행 중",
  completed: "미션 완료!",
  rewarded: "보상 받기 완료",
};

/** 하루 목표 진행률 0~100 */
export function getDailyGoalPercent(studiedMinutes: number, goalMinutes: number): number {
  if (goalMinutes <= 0) return 0;
  return Math.min(100, Math.round((studiedMinutes / goalMinutes) * 100));
}
