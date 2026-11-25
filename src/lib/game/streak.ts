/**
 * 연속 학습 일수 계산 (순수 함수, 날짜는 YYYY-MM-DD 한국 시간 기준 문자열)
 */

/** 날짜 문자열을 days 만큼 옮깁니다. */
export function shiftDate(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/**
 * 보상을 받은 날(date)에 연속 일수를 계산합니다.
 * - 같은 날 두 번째 보상: 변화 없음
 * - 바로 전날에도 학습: +1
 * - 그 밖(며칠 쉼, 처음): 1일로 시작
 */
export function nextStreak(lastStudyDate: string | null, date: string, currentStreak: number): number {
  if (!lastStudyDate) return 1;
  if (lastStudyDate === date) return currentStreak;
  if (shiftDate(lastStudyDate, 1) === date) return currentStreak + 1;
  return 1;
}
