/**
 * 학기 진도 계산 (순수 함수).
 * - 학년도는 3월에 시작합니다. 1학기는 3월~8월, 2학기는 9월~2월입니다.
 * - 학기 목표는 900문제입니다. 지금까지 지난 기간의 비율만큼 풀었어야 "기준 진도"가 됩니다.
 * - 모의고사는 기준 진도 이상 풀고 정답률 90% 이상일 때 열립니다.
 * - 모의고사는 50문제 중 90점(45문제 이상 정답) 이상이면 통과합니다.
 */

import { schoolYear } from "@/lib/game/grade";

export const SEMESTER_TARGET = 900;
export const MOCK_QUESTIONS = 50;
export const MOCK_PASS_SCORE = 90;
export const MOCK_MIN_ACCURACY = 0.9;

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

/** 한국 시간 자정(월 1일)의 시각 */
function kstMidnight(year: number, month: number): Date {
  return new Date(Date.UTC(year, month - 1, 1) - KST_OFFSET_MS);
}

export interface SemesterInfo {
  /** 학년도 (3월에 바뀜) */
  schoolYear: number;
  /** 1 = 3~8월, 2 = 9~2월 */
  semester: 1 | 2;
  start: Date;
  end: Date;
  /** 지난 기간 비율 (0~1) */
  ratio: number;
}

/** 지금 날짜가 속한 학기와 지난 기간 비율 */
export function semesterAt(now: Date = new Date()): SemesterInfo {
  const year = schoolYear(now);
  const firstStart = kstMidnight(year, 3);
  const firstEnd = kstMidnight(year, 9);
  const secondEnd = kstMidnight(year + 1, 3);

  const isFirst = now.getTime() < firstEnd.getTime();
  const start = isFirst ? firstStart : firstEnd;
  const end = isFirst ? firstEnd : secondEnd;
  const span = end.getTime() - start.getTime();
  const elapsed = now.getTime() - start.getTime();
  const ratio = Math.min(1, Math.max(0, elapsed / span));

  return { schoolYear: year, semester: isFirst ? 1 : 2, start, end, ratio };
}

/** 지금 시점까지 풀었어야 하는 문제 수 (기준 진도) */
export function requiredByNow(now: Date = new Date()): number {
  return Math.floor(SEMESTER_TARGET * semesterAt(now).ratio);
}

/** 모의고사가 열리는지: 기준 진도 이상 풀고 정답률 90% 이상 */
export function mockUnlocked(solved: number, correct: number, now: Date = new Date()): boolean {
  if (solved <= 0) return false;
  if (solved < requiredByNow(now)) return false;
  return correct / solved >= MOCK_MIN_ACCURACY;
}

/** 모의고사 통과 여부 (50문제 중 45문제 이상 = 90점) */
export function mockPassed(correct: number): boolean {
  const score = Math.round((correct / MOCK_QUESTIONS) * 100);
  return score >= MOCK_PASS_SCORE;
}
