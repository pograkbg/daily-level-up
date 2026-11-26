/**
 * 학년 계산 (학년 자동 전환).
 * - 학년은 0(유아)~6(6학년)입니다.
 * - 아이마다 "학년(grade)"과 그 학년이 적용된 "학년도(grade_year)"를 저장합니다.
 * - 지금 학년 = 저장된 학년 + (지금 학년도 - 저장된 학년도). 6학년을 넘지 않습니다.
 * - 학년도는 한국 학교처럼 3월부터 바뀝니다. (예: 2026년 3월 이후 = 2026학년도)
 */

export const MIN_GRADE = 0;
export const MAX_GRADE = 6;

export const GRADE_LABEL: Record<number, string> = {
  0: "유아",
  1: "1학년",
  2: "2학년",
  3: "3학년",
  4: "4학년",
  5: "5학년",
  6: "6학년",
};

/** 한국 시간 기준 학년도. 3월 이후면 그 해, 1~2월이면 전 해입니다. */
export function schoolYear(now: Date = new Date()): number {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(now);
  const year = Number(parts.find((p) => p.type === "year")?.value);
  const month = Number(parts.find((p) => p.type === "month")?.value);
  return month >= 3 ? year : year - 1;
}

/** 저장된 학년과 학년도로 지금 학년을 계산합니다. */
export function currentGrade(storedGrade: number, storedYear: number, now: Date = new Date()): number {
  const elapsed = schoolYear(now) - storedYear;
  const grade = storedGrade + Math.max(0, elapsed);
  return Math.min(MAX_GRADE, Math.max(MIN_GRADE, grade));
}
