/**
 * 유아·1학년 문제 생성 (순수 함수, 화면과 DB와 무관).
 * - 1학년 수학: 덧셈·뺄셈(받아올림·내림 없음, 0~100), 다음 수 찾기(0~100).
 * - 보기는 4개이고, 정답 하나와 가까운 오답 세 개로 만듭니다.
 */

export type EarlyMathKind = "add" | "sub" | "next";

export interface EarlyMathQuestion {
  kind: EarlyMathKind;
  prompt: string;
  choices: number[];
  answer: number;
}

/** 0 이상 100 이하의 정수인지 */
function inRange(n: number): boolean {
  return Number.isInteger(n) && n >= 0 && n <= 100;
}

/** 정답 주변에서 서로 다른 오답 세 개를 고릅니다 (0~100 범위 안). */
export function distractorsAround(answer: number, rand: () => number): number[] {
  const picked = new Set<number>([answer]);
  let guard = 0;
  while (picked.size < 4 && guard < 200) {
    guard += 1;
    const offset = 1 + Math.floor(rand() * 5); // 1~5 떨어진 수
    const sign = rand() < 0.5 ? -1 : 1;
    const candidate = answer + sign * offset;
    if (inRange(candidate)) picked.add(candidate);
  }
  return [...picked];
}

/** 보기 순서를 섞습니다 (정답 위치가 늘 같지 않도록). */
export function shuffle<T>(items: T[], rand: () => number): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/** 받아올림 없는 덧셈: 일의 자리 합이 9 이하, 십의 자리 합이 9 이하 */
function makeAdd(rand: () => number): EarlyMathQuestion {
  for (;;) {
    const a = Math.floor(rand() * 90) + 1; // 1~90
    const b = Math.floor(rand() * 10) + 1; // 1~10
    const onesOk = (a % 10) + (b % 10) <= 9;
    const sum = a + b;
    if (onesOk && inRange(sum) && sum <= 100) {
      return finish("add", `${a} + ${b} = ?`, sum, rand);
    }
  }
}

/** 받아올림 없는 뺄셈: 일의 자리끼리, 십의 자리끼리 뺄 수 있음 (내림 없음) */
function makeSub(rand: () => number): EarlyMathQuestion {
  for (;;) {
    const a = Math.floor(rand() * 90) + 10; // 10~99
    const b = Math.floor(rand() * 10) + 1; // 1~10
    const onesOk = a % 10 >= b % 10;
    const diff = a - b;
    if (onesOk && inRange(diff) && diff >= 0) {
      return finish("sub", `${a} - ${b} = ?`, diff, rand);
    }
  }
}

/** 다음 수 찾기: 0~99 중 하나를 골라 바로 다음 수를 묻습니다. */
function makeNext(rand: () => number): EarlyMathQuestion {
  const n = Math.floor(rand() * 99); // 0~98
  return finish("next", `${n} 다음 수는?`, n + 1, rand);
}

function finish(kind: EarlyMathKind, prompt: string, answer: number, rand: () => number): EarlyMathQuestion {
  const choices = shuffle(distractorsAround(answer, rand), rand);
  return { kind, prompt, choices, answer };
}

/**
 * 1학년 수학 문제 묶음 (기본 24문제).
 * 덧셈·뺄셈과 다음 수 찾기를 무작위로 섞습니다. 같은 문제가 반복되지 않도록 문장으로 한 번 더 거릅니다.
 */
export function buildGrade1MathSet(count: number, rand: () => number = Math.random): EarlyMathQuestion[] {
  const seen = new Set<string>();
  const out: EarlyMathQuestion[] = [];
  let guard = 0;
  while (out.length < count && guard < count * 50) {
    guard += 1;
    const pick = rand();
    const q = pick < 0.4 ? makeAdd(rand) : pick < 0.8 ? makeSub(rand) : makeNext(rand);
    if (seen.has(q.prompt)) continue;
    seen.add(q.prompt);
    out.push(q);
  }
  return out;
}
