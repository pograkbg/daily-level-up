/**
 * 영어 퀴즈 공통 규칙 (순수 함수)
 */

/** 영어 퀴즈는 하루 최대 5회 (수학 회차와 같은 제한) */
export const ENGLISH_DAILY_MAX = 5;

/** 배열을 무작위로 섞습니다 (Fisher-Yates). 목업 저장소에서 씁니다. */
export function shuffle<T>(items: T[], random: () => number = Math.random): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/** 레벨 번호 → 화면 이름 */
export function englishLevelName(level: number): string {
  const names: Record<number, string> = {
    1: "Lv.1 Starter",
    2: "Lv.2 Beginner",
    3: "Lv.3 Explorer",
    4: "Lv.4 Adventurer",
    5: "Lv.5 Master",
    6: "Lv.6 Challenge",
  };
  return names[level] ?? `Lv.${level}`;
}
