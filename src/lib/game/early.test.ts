import { describe, expect, it } from "vitest";
import { buildGrade1MathSet, distractorsAround } from "@/lib/game/early";

/** 같은 결과가 나오는 간단한 난수 (테스트용) */
function seeded(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

describe("buildGrade1MathSet", () => {
  it("요청한 문제 수를 만든다", () => {
    expect(buildGrade1MathSet(24, seeded(1))).toHaveLength(24);
  });

  it("보기는 항상 4개이고 정답을 포함하며 서로 다르다", () => {
    for (const q of buildGrade1MathSet(60, seeded(7))) {
      expect(q.choices).toHaveLength(4);
      expect(new Set(q.choices).size).toBe(4);
      expect(q.choices).toContain(q.answer);
    }
  });

  it("모든 보기와 정답이 0~100 범위 안", () => {
    for (const q of buildGrade1MathSet(60, seeded(3))) {
      for (const c of q.choices) {
        expect(c).toBeGreaterThanOrEqual(0);
        expect(c).toBeLessThanOrEqual(100);
      }
    }
  });

  it("덧셈과 뺄셈은 받아올림·내림이 없고 정답이 맞다", () => {
    for (const q of buildGrade1MathSet(80, seeded(11))) {
      if (q.kind === "add") {
        const [a, b] = q.prompt.split(" = ")[0].split(" + ").map(Number);
        expect(a + b).toBe(q.answer);
        expect(a % 10 + (b % 10)).toBeLessThanOrEqual(9); // 받아올림 없음
      }
      if (q.kind === "sub") {
        const [a, b] = q.prompt.split(" = ")[0].split(" - ").map(Number);
        expect(a - b).toBe(q.answer);
        expect(a % 10).toBeGreaterThanOrEqual(b % 10); // 내림 없음
        expect(a - b).toBeGreaterThanOrEqual(0);
      }
      if (q.kind === "next") {
        const n = Number(q.prompt.split(" ")[0]);
        expect(n + 1).toBe(q.answer);
      }
    }
  });

  it("문제 문장이 겹치지 않는다", () => {
    const set = buildGrade1MathSet(24, seeded(21));
    expect(new Set(set.map((q) => q.prompt)).size).toBe(set.length);
  });
});

describe("distractorsAround", () => {
  it("정답 포함 4개, 중복 없음", () => {
    const d = distractorsAround(50, seeded(5));
    expect(d).toHaveLength(4);
    expect(d).toContain(50);
    expect(new Set(d).size).toBe(4);
  });
});
