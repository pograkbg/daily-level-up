/**
 * 초등 수학 문제 생성기 (서버 전용 정답표의 근거), 2학년 기준
 *
 * 한 회차(세션)는 40문제입니다.
 * - 지정 풀기: 덧셈 10 → 뺄셈 10 → 곱셈 10 → 나눗셈 10 (고른 난이도 순서대로)
 * - 랜덤 풀기: 열린 레벨 중에서 문제마다 무작위로 뽑음
 * - 같은 날 이미 나온 문제(연산 + 숫자 조합)는 다시 내지 않습니다.
 *
 * 레벨 구성 (연산마다 같은 틀)
 *  - 하 (레벨 1~5): 구구단 안에서 시작해서 조금씩 넓힙니다.
 *  - 중 (레벨 6~10): 앞 수를 30 이하 또는 5의 배수로 두고, 결과를 200 이하로 맞춥니다.
 *  - 상 (레벨 11~15): 결과를 300 이하로 맞춥니다. 숫자는 범위 안에서 무작위입니다.
 *
 * answer 값은 아이에게 절대 그대로 보내지 않습니다.
 */

import type { Band, PlanSlot } from "@/lib/game/learning-levels";

export type MathOperator = "+" | "-" | "×" | "÷";

export interface MathProblem {
  index: number; // 0 ~ total-1
  left: number;
  right: number;
  operator: MathOperator;
  answer: number; // 정답 (서버에만 존재)
}

type Draft = Omit<MathProblem, "index">;
type Rand = (min: number, max: number) => number;

/** 문자열 seed → 32비트 숫자 (FNV-1a 해시) */
export function hashSeed(seed: string): number {
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/** seed 기반 난수 생성기 (mulberry32) — 0 이상 1 미만 */
function createRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** 중복 판별용 문제 키 (연산 + 두 수) */
export function problemKey(p: { operator: string; left: number; right: number }): string {
  return `${p.operator}|${p.left}|${p.right}`;
}

/**
 * 한 회차의 문제 묶음 생성
 * @param seed 같은 값이면 같은 문제 (예: 아이id:날짜:회차)
 * @param levelPlan 문제마다 쓸 학습 레벨 번호 (길이 = 문제 수)
 * @param excluded 오늘 이미 나온 문제 키 (여기 있는 문제는 다시 내지 않음)
 */
export function generateSessionProblems(seed: string, plan: PlanSlot[], excluded: Set<string>): MathProblem[] {
  const random = createRandom(hashSeed(seed));
  const rint: Rand = (min, max) => min + Math.floor(random() * (max - min + 1));
  const used = new Set<string>(excluded);
  const result: MathProblem[] = [];

  plan.forEach((slot, index) => {
    let draft = makeDraft(slot.op, slot.band, slot.step, rint);
    // 1) 같은 단계에서 다시 뽑기
    for (let tries = 0; tries < 50 && used.has(problemKey(draft)); tries++) {
      draft = makeDraft(slot.op, slot.band, slot.step, rint);
    }
    // 2) 그래도 겹치면 같은 연산의 다른 난이도·단계에서 채우기 (좁은 단계는 문제 종류가 적기 때문)
    for (let tries = 0; tries < 200 && used.has(problemKey(draft)); tries++) {
      const band = rint(0, 2) as Band;
      const step = rint(1, 5);
      draft = makeDraft(slot.op, band, step, rint);
    }
    used.add(problemKey(draft));
    result.push({ index, ...draft });
  });

  return result;
}

function makeDraft(op: MathOperator, band: Band, step: number, rint: Rand): Draft {
  if (op === "+") return addition(band, step, rint);
  if (op === "-") return subtraction(band, step, rint);
  if (op === "×") return multiplication(band, step, rint);
  return division(band, step, rint);
}

/** 조건에 맞는 문제가 나올 때까지 다시 뽑습니다. 끝내 못 찾으면 기본 문제를 씁니다. */
function retry(gen: () => Draft | null, fallback: Draft): Draft {
  for (let i = 0; i < 300; i++) {
    const d = gen();
    if (d) return d;
  }
  return fallback;
}

function add(l: number, r: number): Draft {
  return { left: l, right: r, operator: "+", answer: l + r };
}
function sub(l: number, r: number): Draft {
  return { left: l, right: r, operator: "-", answer: l - r };
}
function mul(l: number, r: number): Draft {
  return { left: l, right: r, operator: "×", answer: l * r };
}
function div(l: number, r: number, q: number): Draft {
  return { left: l, right: r, operator: "÷", answer: q };
}

/* ---------- 더하기 ---------- */

function addition(band: Band, step: number, rint: Rand): Draft {
  if (band === 0) {
    // 하: 받아올림 없음. 앞자리는 1 ~ (단계 + 1)
    const t1 = rint(1, Math.min(6, step + 1));
    const t2 = rint(1, 9 - t1);
    const o1 = rint(0, 9);
    const o2 = rint(0, 9 - o1);
    return add(t1 * 10 + o1, t2 * 10 + o2);
  }
  if (band === 1) {
    if (step === 1) {
      // 한 자리 + 한 자리, 합 10 이상
      const a = rint(1, 9);
      return add(a, rint(10 - a, 9));
    }
    if (step === 2) {
      // 30 이하 + 한 자리, 받아올림
      const l = rint(1, 2) * 10 + rint(1, 9);
      return add(l, rint(10 - (l % 10), 9));
    }
    if (step === 3) {
      // 30 이하 + 두 자리, 받아올림
      const l = rint(1, 2) * 10 + rint(1, 9);
      return add(l, rint(1, 9) * 10 + rint(10 - (l % 10), 9));
    }
    if (step === 4) {
      // 5의 배수 + 두 자리, 받아올림
      return add(rint(1, 9) * 10 + 5, rint(1, 9) * 10 + rint(5, 9));
    }
    // 5의 배수 + 5의 배수, 합 100 미만
    const l = 5 * rint(2, 15);
    const maxR = Math.floor((99 - l) / 5);
    return add(l, 5 * rint(2, Math.max(2, maxR)));
  }
  // 상: 결과 300 이하
  if (step === 1) {
    return retry(() => {
      const l = rint(10, 99);
      const r = rint(10, 99);
      return l + r <= 150 ? add(l, r) : null;
    }, add(58, 47));
  }
  if (step === 2) return add(rint(100, 120), rint(10, 99));
  if (step === 3) {
    return retry(() => {
      const l = rint(100, 160);
      const r = rint(10, 99);
      return (l % 10) + (r % 10) >= 10 ? add(l, r) : null;
    }, add(105, 15));
  }
  if (step === 4) {
    const l = rint(100, 200);
    return add(l, rint(100, 300 - l));
  }
  return retry(() => {
    const l = rint(100, 200);
    const r = rint(100, 300 - l);
    return (l % 10) + (r % 10) >= 10 ? add(l, r) : null;
  }, add(155, 145));
}

/* ---------- 빼기 ---------- */

function subtraction(band: Band, step: number, rint: Rand): Draft {
  if (band === 0) {
    // 하: 받아내림 없음. 앞자리는 2 ~ (단계 + 2)
    const t1 = rint(2, Math.min(9, 2 + step));
    const t2 = rint(1, t1 - 1);
    const o2 = rint(0, 9);
    const o1 = rint(o2, 9);
    return sub(t1 * 10 + o1, t2 * 10 + o2);
  }
  if (band === 1) {
    if (step === 1) {
      // 두 자리 − 한 자리, 받아내림
      const l = rint(11, 19);
      return sub(l, rint(l % 10 + 1, 9));
    }
    if (step === 2) {
      // 30 이하 − 한 자리, 받아내림
      return retry(() => {
        const l = rint(11, 29);
        const o1 = l % 10;
        return o1 > 8 ? null : sub(l, rint(o1 + 1, 9));
      }, sub(25, 7));
    }
    if (step === 3) {
      // 30 이하 − 두 자리, 받아내림
      return retry(() => {
        const l = rint(20, 29);
        const o1 = l % 10;
        return o1 > 8 ? null : sub(l, 10 + rint(o1 + 1, 9));
      }, sub(28, 19));
    }
    if (step === 4) {
      // 5의 배수 − 두 자리, 받아내림
      const t1 = rint(2, 9);
      const l = t1 * 10 + 5;
      const t2 = rint(1, t1 - 1);
      return sub(l, t2 * 10 + rint(6, 9));
    }
    // 5의 배수 − 두 자리, 받아내림 (앞자리 큰 수)
    const t1 = rint(5, 9);
    const l = t1 * 10 + 5;
    const t2 = rint(1, t1 - 1);
    return sub(l, t2 * 10 + rint(6, 9));
  }
  // 상
  if (step === 1) {
    // 두 자리 − 두 자리, 받아내림
    const t1 = rint(2, 9);
    const o1 = rint(0, 8);
    const t2 = rint(1, t1 - 1);
    const o2 = rint(o1 + 1, 9);
    return sub(t1 * 10 + o1, t2 * 10 + o2);
  }
  if (step === 2) {
    // 세 자리(150 이하) − 두 자리, 받아내림
    return retry(() => {
      const l = rint(100, 150);
      const r = rint(10, 99);
      return l % 10 < r % 10 ? sub(l, r) : null;
    }, sub(120, 57));
  }
  if (step === 3) {
    // 세 자리(200 이하) − 두 자리, 받아내림
    return retry(() => {
      const l = rint(100, 200);
      const r = rint(10, 99);
      return l % 10 < r % 10 ? sub(l, r) : null;
    }, sub(215, 68));
  }
  if (step === 4) {
    // 세 자리(300 이하) − 세 자리
    const l = rint(101, 300);
    return sub(l, rint(100, l - 1));
  }
  // 세 자리(300 이하) − 세 자리, 차 100 이하, 받아내림
  return retry(() => {
    const l = rint(200, 300);
    const r = rint(Math.max(100, l - 100), l - 1);
    return l % 10 < r % 10 ? sub(l, r) : null;
  }, sub(292, 197));
}

/* ---------- 곱하기 ---------- */

function multiplication(band: Band, step: number, rint: Rand): Draft {
  if (band === 0) {
    // 하: 구구단 안에서 시작 → 조금씩 넓힘
    if (step === 1) return mul(rint(2, 9), rint(2, 3));
    if (step === 2) return mul(rint(2, 9), rint(2, 5));
    if (step === 3) return mul(rint(2, 9), rint(2, 9));
    if (step === 4) {
      return rint(0, 1) === 0 ? mul(rint(2, 9), rint(2, 9)) : mul(rint(10, 19), rint(2, 3));
    }
    return rint(0, 1) === 0 ? mul(rint(2, 9), rint(2, 9)) : mul(rint(10, 29), rint(2, 5));
  }
  if (band === 1) {
    // 중: 결과 200 이하
    if (step === 1) return mul(rint(10, 20), rint(6, 9));
    if (step === 2) return mul(rint(10, 30), rint(2, 6));
    if (step === 3) return mul(5 * rint(2, 6), rint(2, 6));
    if (step === 4) return mul(5 * rint(2, 10), rint(2, 4));
    return mul(5 * rint(2, 20), 2);
  }
  // 상: 결과 300 이하
  if (step === 1) return mul(rint(10, 30), rint(2, 9));
  if (step === 2) return mul(rint(10, 50), rint(2, 6));
  if (step === 3) return mul(rint(10, 99), rint(2, 3));
  if (step === 4) return mul(rint(10, 60), rint(2, 5));
  return mul(rint(10, 17), rint(10, 17));
}

/* ---------- 나누기 (딱 떨어지는 문제만) ---------- */

function division(band: Band, step: number, rint: Rand): Draft {
  if (band === 0) {
    // 하: 구구단 역연산부터 나누어지는 수를 조금씩 넓힘 (몫 한 자리)
    if (step === 1) {
      const d = rint(2, 3);
      const q = rint(1, 9);
      return div(d * q, d, q);
    }
    if (step === 2) {
      const d = rint(2, 5);
      const q = rint(1, 9);
      return div(d * q, d, q);
    }
    if (step === 3) {
      const d = rint(2, 9);
      const q = rint(1, 9);
      return div(d * q, d, q);
    }
    if (step === 4) {
      const d = rint(2, 5);
      const q = rint(Math.ceil(10 / d), Math.min(9, Math.floor(45 / d)));
      return div(d * q, d, q);
    }
    const d = rint(2, 9);
    const q = rint(Math.ceil(10 / d), Math.min(9, Math.floor(81 / d)));
    return div(d * q, d, q);
  }
  if (band === 1) {
    // 중: 결과(나누어지는 수)를 30 이하 또는 5의 배수로
    if (step === 1) {
      const d = rint(2, 5);
      const q = rint(1, Math.min(9, Math.floor(30 / d)));
      return div(d * q, d, q);
    }
    if (step === 2) {
      return retry(() => {
        const d = rint(2, 5);
        const q = rint(1, 9);
        const l = d * q;
        return l % 5 === 0 && l <= 45 ? div(l, d, q) : null;
      }, div(10, 2, 5));
    }
    if (step === 3) {
      return retry(() => {
        const d = rint(2, 5);
        const q = rint(10, 15);
        const l = d * q;
        return l % 5 === 0 && l <= 75 ? div(l, d, q) : null;
      }, div(65, 5, 13));
    }
    if (step === 4) {
      const d = rint(6, 9);
      const q = rint(1, 9);
      return div(d * q, d, q);
    }
    const d = rint(2, 9);
    const q = rint(10, 19);
    return div(d * q, d, q);
  }
  // 상: 나누어지는 수 300 이하
  if (step === 1) {
    const d = rint(2, 9);
    const q = rint(10, 30);
    return div(d * q, d, q);
  }
  if (step === 2) {
    const d = rint(10, 20);
    const q = rint(2, 9);
    return div(d * q, d, q);
  }
  if (step === 3) {
    const d = rint(10, 30);
    const q = rint(2, 9);
    return div(d * q, d, q);
  }
  if (step === 4) {
    const d = rint(2, 9);
    const q = rint(10, Math.min(99, Math.floor(300 / d)));
    return div(d * q, d, q);
  }
  const d = rint(10, 30);
  const q = rint(10, Math.min(30, Math.floor(300 / d)));
  return div(d * q, d, q);
}
