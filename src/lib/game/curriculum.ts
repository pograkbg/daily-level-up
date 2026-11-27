/**
 * 교육과정 문제 생성기 (순수 함수).
 * 단원의 문제 종류(kind)와 난이도 규칙(params)을 받아 문제 하나를 만듭니다.
 * - 정수: 덧셈·뺄셈·곱셈·나눗셈 (받아올림·내림 조건 포함)
 * - 분수: 같은 분모·다른 분모 덧셈·뺄셈, 곱셈·나눗셈 (답은 약분한 분수)
 * - 소수: 소수 자릿수에 맞춘 덧셈·뺄셈·곱셈·나눗셈
 * 정답은 생성할 때 계산하므로 항상 맞습니다. 보기는 정답 근처의 오답 세 개입니다.
 */

export type CurriculumKind =
  | "add" | "sub" | "mul" | "div"
  | "frac_add" | "frac_sub" | "frac_mul" | "frac_div"
  | "dec_add" | "dec_sub" | "dec_mul" | "dec_div";

export type Range = [number, number];

export interface CurriculumParams {
  a?: Range;
  b?: Range;
  q?: Range;
  carry?: boolean;
  den?: Range;
  den2?: Range;
  int?: Range;
  same?: boolean;
  dec?: number;
}

export interface CurriculumProblem {
  prompt: string;
  answer: string;
  choices: string[];
}

type Rand = () => number;

function randInt(lo: number, hi: number, rand: Rand): number {
  return lo + Math.floor(rand() * (hi - lo + 1));
}

function gcd(a: number, b: number): number {
  return b === 0 ? Math.abs(a) : gcd(b, a % b);
}

interface Frac {
  n: number;
  d: number;
}

function reduce(f: Frac): Frac {
  const g = gcd(f.n, f.d) || 1;
  return { n: f.n / g, d: f.d / g };
}

function fracText(f: Frac): string {
  if (f.n === 0) return "0";
  return f.d === 1 ? `${f.n}` : `${f.n}/${f.d}`;
}

function shuffle<T>(items: T[], rand: Rand): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/** 정수 두 수를 더할 때 자리올림이 있는지 */
function hasCarry(a: number, b: number): boolean {
  let x = a;
  let y = b;
  while (x > 0 || y > 0) {
    if (x % 10 + (y % 10) >= 10) return true;
    x = Math.floor(x / 10);
    y = Math.floor(y / 10);
  }
  return false;
}

/** 정수 뺄셈에서 자리내림이 있는지 */
function hasBorrow(a: number, b: number): boolean {
  let x = a;
  let y = b;
  while (y > 0) {
    if (x % 10 < y % 10) return true;
    x = Math.floor(x / 10);
    y = Math.floor(y / 10);
  }
  return false;
}

/** 소수 자릿수 dec 인 정수를 소수 문자열로 */
function decText(scaled: number, dec: number): string {
  return (scaled / 10 ** dec).toFixed(dec);
}

/** 분수 문자열 오답 후보에서 정답과 다른 것 세 개를 고릅니다 (0 이하 제외). */
function fractionDistractors(answer: string, candidates: (k: number) => string[]): string[] {
  const out = new Set<string>([answer]);
  for (let k = 1; k <= 20 && out.size < 4; k += 1) {
    for (const cand of candidates(k)) {
      if (cand.startsWith("-") || cand === "0") continue;
      out.add(cand);
      if (out.size >= 4) break;
    }
  }
  return [...out];
}

/** 정답 근처의 오답 세 개를 만듭니다. format(v)은 답의 표기 방식입니다. */
function distractors(answerValue: number, makeNear: (k: number) => number[], format: (v: number) => string): string[] {
  const answer = format(answerValue);
  const out = new Set<string>([answer]);
  for (let k = 1; k <= 20 && out.size < 4; k += 1) {
    for (const cand of makeNear(k)) {
      if (cand < 0 || !Number.isFinite(cand)) continue;
      out.add(format(cand));
      if (out.size >= 4) break;
    }
  }
  return [...out];
}

export function generateCurriculumProblem(kind: CurriculumKind, params: CurriculumParams, rand: Rand = Math.random): CurriculumProblem {
  const choicesRand = rand;

  if (kind === "add" || kind === "sub") {
    const aRange = params.a ?? [10, 49];
    const bRange = params.b ?? [1, 9];
    const wantCarry = params.carry ?? false;
    let a = 0;
    let b = 0;
    for (let tries = 0; tries < 500; tries += 1) {
      a = randInt(aRange[0], aRange[1], rand);
      b = randInt(bRange[0], bRange[1], rand);
      if (kind === "add") {
        if (a + b > 9999 || hasCarry(a, b) !== wantCarry) continue;
      } else {
        if (a < b || hasBorrow(a, b) !== wantCarry) continue;
      }
      break;
    }
    const value = kind === "add" ? a + b : a - b;
    const op = kind === "add" ? "+" : "−";
    return {
      prompt: `${a} ${op} ${b} = ?`,
      answer: `${value}`,
      choices: shuffle(distractors(value, (k) => [value + k, value - k], (v) => `${v}`), choicesRand),
    };
  }

  if (kind === "mul") {
    const a = randInt(params.a?.[0] ?? 2, params.a?.[1] ?? 9, rand);
    const b = randInt(params.b?.[0] ?? 2, params.b?.[1] ?? 9, rand);
    const value = a * b;
    return {
      prompt: `${a} × ${b} = ?`,
      answer: `${value}`,
      choices: shuffle(distractors(value, (k) => [value + k, value - k, value + 10 * k], (v) => `${v}`), choicesRand),
    };
  }

  if (kind === "div") {
    const b = randInt(params.b?.[0] ?? 2, params.b?.[1] ?? 9, rand);
    const q = randInt(params.q?.[0] ?? 2, params.q?.[1] ?? 9, rand);
    const a = b * q;
    return {
      prompt: `${a} ÷ ${b} = ?`,
      answer: `${q}`,
      choices: shuffle(distractors(q, (k) => [q + k, q - k], (v) => `${v}`), choicesRand),
    };
  }

  if (kind === "frac_add" || kind === "frac_sub") {
    const denRange = params.den ?? [2, 9];
    const d1 = randInt(denRange[0], denRange[1], rand);
    const d2 = params.same ? d1 : randInt(denRange[0], denRange[1], rand);
    const n1 = randInt(1, d1 - 1, rand);
    const n2 = randInt(1, d2 - 1, rand);
    const f1: Frac = { n: n1, d: d1 };
    const f2: Frac = { n: n2, d: d2 };
    let result: Frac;
    if (kind === "frac_add") {
      result = reduce({ n: n1 * d2 + n2 * d1, d: d1 * d2 });
    } else {
      const top = n1 * d2 - n2 * d1;
      if (top <= 0) return generateCurriculumProblem(kind, params, rand);
      result = reduce({ n: top, d: d1 * d2 });
    }
    const op = kind === "frac_add" ? "+" : "−";
    return {
      prompt: `${fracText(f1)} ${op} ${fracText(f2)} = ?`,
      answer: fracText(result),
      choices: shuffle(
        fractionDistractors(fracText(result), (k) => [
          fracText(reduce({ n: result.n + k, d: result.d })),
          fracText(reduce({ n: result.n - k, d: result.d })),
          fracText(reduce({ n: result.n, d: result.d + k })),
        ]),
        choicesRand,
      ),
    };
  }

  if (kind === "frac_mul" || kind === "frac_div") {
    const denRange = params.den ?? [2, 9];
    const d1 = randInt(denRange[0], denRange[1], rand);
    const n1 = randInt(1, d1 - 1, rand);
    const f1: Frac = { n: n1, d: d1 };
    let result: Frac;
    let second: string;
    if (params.int) {
      const k = randInt(params.int[0], params.int[1], rand);
      second = `${k}`;
      result = kind === "frac_mul" ? reduce({ n: n1 * k, d: d1 }) : reduce({ n: n1, d: d1 * k });
    } else {
      const den2 = params.den2 ?? [2, 9];
      const d2 = randInt(den2[0], den2[1], rand);
      const n2 = randInt(1, d2 - 1, rand);
      const f2: Frac = { n: n2, d: d2 };
      second = fracText(f2);
      result = kind === "frac_mul"
        ? reduce({ n: n1 * n2, d: d1 * d2 })
        : reduce({ n: n1 * d2, d: d1 * n2 });
    }
    const op = kind === "frac_mul" ? "×" : "÷";
    return {
      prompt: `${fracText(f1)} ${op} ${second} = ?`,
      answer: fracText(result),
      choices: shuffle(
        fractionDistractors(fracText(result), (k) => [
          fracText(reduce({ n: result.n + k, d: result.d })),
          fracText(reduce({ n: result.n - k, d: result.d })),
          fracText(reduce({ n: result.n, d: result.d + k })),
        ]),
        choicesRand,
      ),
    };
  }

  // 소수: 자릿수 dec 에 맞춰 정수로 계산한 뒤 소수로 표시합니다.
  const dec = params.dec ?? 1;

  if (kind === "dec_add" || kind === "dec_sub") {
    const range = params.a ?? [1, 99];
    const a = randInt(range[0], range[1], rand);
    const b = randInt(range[0], range[1], rand);
    if (kind === "dec_sub" && a < b) return generateCurriculumProblem(kind, params, rand);
    const result = kind === "dec_add" ? a + b : a - b;
    const op = kind === "dec_add" ? "+" : "−";
    return {
      prompt: `${decText(a, dec)} ${op} ${decText(b, dec)} = ?`,
      answer: decText(result, dec),
      choices: shuffle(distractors(result, (k) => [result + k, result - k], (v) => decText(v, dec)), choicesRand),
    };
  }

  if (kind === "dec_mul") {
    const range = params.a ?? [1, 99];
    const bRange = params.b ?? [2, 9];
    const a = randInt(range[0], range[1], rand);
    const b = randInt(bRange[0], bRange[1], rand);
    const result = a * b;
    return {
      prompt: `${decText(a, dec)} × ${b} = ?`,
      answer: decText(result, dec),
      choices: shuffle(distractors(result, (k) => [result + k, result - k], (v) => decText(v, dec)), choicesRand),
    };
  }

  // dec_div: 나누어떨어지도록 피제수를 정한 뒤 몫을 정답으로 둡니다.
  const bRange = params.b ?? [2, 9];
  const qRange = params.q ?? [10, 99];
  const b = randInt(bRange[0], bRange[1], rand);
  const q = randInt(qRange[0], qRange[1], rand);
  const dividend = b * q;
  return {
    prompt: `${decText(dividend, dec)} ÷ ${b} = ?`,
    answer: decText(q, dec),
    choices: shuffle(distractors(q, (k) => [q + k, q - k], (v) => decText(v, dec)), choicesRand),
  };
}

/** 단원 문제 묶음: 같은 문장이 반복되지 않게 합니다. */
export function buildCurriculumSet(
  kind: CurriculumKind,
  params: CurriculumParams,
  count: number,
  rand: Rand = Math.random,
): CurriculumProblem[] {
  const seen = new Set<string>();
  const out: CurriculumProblem[] = [];
  let guard = 0;
  while (out.length < count && guard < count * 40) {
    guard += 1;
    const p = generateCurriculumProblem(kind, params, rand);
    if (seen.has(p.prompt)) continue;
    seen.add(p.prompt);
    out.push(p);
  }
  return out;
}

export { gcd, reduce, fracText, decText, hasCarry, hasBorrow };
