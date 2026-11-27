import { describe, expect, it } from "vitest";
import {
  buildCurriculumSet,
  type CurriculumKind,
  type CurriculumParams,
  generateCurriculumProblem,
  hasBorrow,
  hasCarry,
} from "@/lib/game/curriculum";

function seeded(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

const PARAMS: Record<CurriculumKind, CurriculumParams> = {
  add: { a: [100, 499], b: [10, 99], carry: true },
  sub: { a: [100, 499], b: [10, 99], carry: true },
  mul: { a: [10, 99], b: [2, 9] },
  div: { b: [2, 9], q: [10, 30] },
  frac_add: { den: [2, 12], same: false },
  frac_sub: { den: [2, 12], same: false },
  frac_mul: { den: [2, 9], den2: [2, 9] },
  frac_div: { den: [2, 9], den2: [2, 9] },
  dec_add: { dec: 2, a: [1, 99] },
  dec_sub: { dec: 2, a: [1, 99] },
  dec_mul: { dec: 1, a: [1, 99], b: [2, 9] },
  dec_div: { dec: 1, b: [2, 9], q: [10, 99] },
  mixed: { a: [10, 49], b: [2, 9], c: [2, 9] },
  pattern: { start: [1, 20], step: [2, 5], len: 4 },
  average: { a: [20, 59] },
  round: { a: [100, 999], unit: [10, 10] },
  ratio: { a: [1, 19], b: [2, 19] },
  proportion: { a: [2, 9], k: [2, 6], c: [2, 12] },
};

describe("새 문제 종류", () => {
  it("규칙 찾기: 다음 수가 정답", () => {
    for (let i = 0; i < 40; i += 1) {
      const p = generateCurriculumProblem("pattern", { start: [1, 20], step: [2, 5], len: 4 }, seeded(i + 900));
      const nums = p.prompt.replace(", ?", "").split(", ").map(Number);
      const step = nums[1] - nums[0];
      expect(Number(p.answer)).toBe(nums[nums.length - 1] + step);
    }
  });

  it("평균: 정답은 세 수의 평균", () => {
    for (let i = 0; i < 40; i += 1) {
      const p = generateCurriculumProblem("average", { a: [20, 59] }, seeded(i + 950));
      const nums = p.prompt.split("의 평균")[0].split(", ").map(Number);
      expect((nums[0] + nums[1] + nums[2]) / 3).toBe(Number(p.answer));
    }
  });

  it("어림하기: 답은 단위의 배수", () => {
    for (let i = 0; i < 40; i += 1) {
      const p = generateCurriculumProblem("round", { a: [100, 999], unit: [10, 10] }, seeded(i + 980));
      expect(Number(p.answer) % 10).toBe(0);
    }
  });

  it("비례식: a : ak = c : ? 의 답은 k×c", () => {
    for (let i = 0; i < 40; i += 1) {
      const p = generateCurriculumProblem("proportion", { a: [2, 9], k: [2, 6], c: [2, 12] }, seeded(i + 990));
      const [left, right] = p.prompt.replace(" = ", "|").split("|");
      const [a, b] = left.split(" : ").map(Number);
      const [c] = right.replace(" : ?", "").split(" : ").map(Number);
      expect(Number(p.answer)).toBe((b / a) * c);
    }
  });

  it("혼합계산과 비율도 보기 4개를 만든다", () => {
    for (const kind of ["mixed", "ratio"] as const) {
      const p = generateCurriculumProblem(kind, PARAMS[kind], seeded(1234));
      expect(p.choices).toHaveLength(4);
      expect(p.choices).toContain(p.answer);
    }
  });
});

describe("정수 덧셈·뺄셈", () => {
  it("받아올림 없음 규칙이면 자리마다 합이 10 미만", () => {
    for (let i = 0; i < 50; i += 1) {
      const p = generateCurriculumProblem("add", { a: [10, 49], b: [1, 9], carry: false }, seeded(i + 1));
      const [a, b] = p.prompt.split(" = ")[0].split(" + ").map(Number);
      expect(hasCarry(a, b)).toBe(false);
      expect(a + b).toBe(Number(p.answer));
    }
  });

  it("뺄셈은 답이 0 이상", () => {
    for (let i = 0; i < 50; i += 1) {
      const p = generateCurriculumProblem("sub", { a: [20, 89], b: [1, 9], carry: true }, seeded(i + 100));
      const [a, b] = p.prompt.split(" = ")[0].split(" − ").map(Number);
      expect(a - b).toBe(Number(p.answer));
      expect(Number(p.answer)).toBeGreaterThanOrEqual(0);
      expect(hasBorrow(a, b)).toBe(true);
    }
  });
});

describe("정수 곱셈·나눗셈", () => {
  it("나눗셈은 나누어떨어진다", () => {
    for (let i = 0; i < 50; i += 1) {
      const p = generateCurriculumProblem("div", { b: [2, 9], q: [2, 9] }, seeded(i + 200));
      const [a, b] = p.prompt.split(" = ")[0].split(" ÷ ").map(Number);
      expect(a / b).toBe(Number(p.answer));
    }
  });
});

describe("분수", () => {
  it("답은 약분된 분수", () => {
    for (let i = 0; i < 60; i += 1) {
      const p = generateCurriculumProblem("frac_add", { den: [2, 12], same: false }, seeded(i + 300));
      const [n, d] = p.answer.split("/").map(Number);
      const g = gcdOf(n, d || 1);
      expect(g).toBe(1);
    }
  });

  it("분수 덧셈 답이 맞다", () => {
    for (let i = 0; i < 40; i += 1) {
      const p = generateCurriculumProblem("frac_add", { den: [2, 9], same: false }, seeded(i + 400));
      const [x, y] = p.prompt.split(" = ")[0].split(" + ");
      const [n1, d1] = x.split("/").map(Number);
      const [n2, d2] = y.split("/").map(Number);
      const expected = (n1 * d2 + n2 * d1) / (d1 * d2);
      const [n, d] = p.answer.split("/").map(Number);
      expect(n / d).toBeCloseTo(expected, 10);
    }
  });

  it("분수 뺄셈 답은 양수", () => {
    for (let i = 0; i < 40; i += 1) {
      const p = generateCurriculumProblem("frac_sub", { den: [2, 9], same: false }, seeded(i + 500));
      expect(Number(p.answer.split("/")[0])).toBeGreaterThan(0);
    }
  });
});

describe("소수", () => {
  it("답은 정해진 소수 자릿수로 표시", () => {
    for (let i = 0; i < 40; i += 1) {
      const p = generateCurriculumProblem("dec_add", { dec: 2, a: [1, 99] }, seeded(i + 600));
      expect(p.answer.split(".")[1]).toHaveLength(2);
    }
  });

  it("소수 나눗셈은 나누어떨어진다", () => {
    for (let i = 0; i < 40; i += 1) {
      const p = generateCurriculumProblem("dec_div", { dec: 1, b: [2, 9], q: [10, 99] }, seeded(i + 700));
      const [dividend, b] = p.prompt.split(" = ")[0].split(" ÷ ").map(Number);
      expect(Math.abs(dividend / b - Number(p.answer))).toBeLessThan(1e-9);
    }
  });
});

describe("보기", () => {
  for (const kind of Object.keys(PARAMS) as CurriculumKind[]) {
    it(`${kind}: 보기 4개, 중복 없음, 정답 포함`, () => {
      for (let i = 0; i < 30; i += 1) {
        const p = generateCurriculumProblem(kind, PARAMS[kind], seeded(i + 800));
        expect(p.choices).toHaveLength(4);
        expect(new Set(p.choices).size).toBe(4);
        expect(p.choices).toContain(p.answer);
      }
    });
  }
});

describe("buildCurriculumSet", () => {
  it("요청한 수만큼, 문장이 겹치지 않게 만든다", () => {
    const set = buildCurriculumSet("mul", { a: [2, 9], b: [2, 9] }, 20, seeded(9));
    expect(set).toHaveLength(20);
    expect(new Set(set.map((p) => p.prompt)).size).toBe(20);
  });
});

function gcdOf(a: number, b: number): number {
  return b === 0 ? Math.abs(a) : gcdOf(b, a % b);
}
