/**
 * 미션 설정값 (mock/DB 공통)
 */

export const MISSION_TITLE = "수학 미션";
export const MISSION_TOTAL_QUESTIONS = 20;
export const MISSION_REWARD_XP = 50;
export const MISSION_REWARD_COINS = 20;
export const DAILY_GOAL_MINUTES = 30;

/** 하루에 도전할 수 있는 최대 회차 (설정값) */
export const MAX_MISSIONS_PER_DAY = 5;

/** 답 입력 최대 자리 수 (세 자리 수 문제 때문에 3) */
export const ANSWER_MAX_DIGITS = 3;

/** 한국 시간 기준 오늘 날짜 (YYYY-MM-DD) */
export function todayInSeoul(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Seoul" }).format(now);
}
