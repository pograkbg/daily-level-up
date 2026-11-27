import { describe, expect, it } from "vitest";
import {
  applyCorrectXp,
  DEFAULT_PROGRESS,
  isGradeCleared,
  OPERATORS,
  planSession,
  SESSION_QUESTIONS,
  XP_PER_CORRECT,
  XP_PER_LEVEL,
} from "@/lib/game/learning-levels";

describe("한 회차 문제 수", () => {
  it("한 회차는 20문제입니다 (사칙연산 각 5문제)", () => {
    expect(SESSION_QUESTIONS).toBe(20);
  });
});

describe("지정 풀기 계획 (planSession)", () => {
  const bands = { "+": 0, "-": 0, "×": 0, "÷": 0 } as const;

  it("지정 풀기는 20문제를 만듭니다", () => {
    const plan = planSession("choose", { ...bands }, DEFAULT_PROGRESS, 12345);
    expect(plan).not.toBeNull();
    expect(plan?.length).toBe(20);
  });

  it("연산마다 최소 5문제는 그 연산으로 나옵니다 (나머지 1문제는 랜덤)", () => {
    const plan = planSession("choose", { ...bands }, DEFAULT_PROGRESS, 12345) ?? [];
    for (const op of OPERATORS) {
      const count = plan.filter((slot) => slot.op === op).length;
      expect(count).toBeGreaterThanOrEqual(5);
    }
  });

  it("난이도를 고르지 않으면 계획을 만들지 않습니다", () => {
    const plan = planSession("choose", { "+": null, "-": 0, "×": 0, "÷": 0 }, DEFAULT_PROGRESS, 1);
    expect(plan).toBeNull();
  });

  it("랜덤 풀기도 20문제입니다", () => {
    const plan = planSession("random", { "+": null, "-": null, "×": null, "÷": null }, DEFAULT_PROGRESS, 7);
    expect(plan?.length).toBe(20);
  });
});

describe("경험치와 레벨 (applyCorrectXp)", () => {
  it("정답 한 개는 경험치 5점입니다", () => {
    const after = applyCorrectXp({ level: 1, xp: 0 });
    expect(after.xp).toBe(XP_PER_CORRECT);
  });

  it("250점을 채우면 다음 레벨로 올라갈 차례가 됩니다", () => {
    const almost = { level: 1, xp: XP_PER_LEVEL - XP_PER_CORRECT };
    const after = applyCorrectXp(almost);
    expect(after.ready).toBe(true);
  });
});

describe("학년 완료 여부 (isGradeCleared)", () => {
  it("처음 상태에서는 학년을 끝내지 않았습니다", () => {
    expect(isGradeCleared(DEFAULT_PROGRESS)).toBe(false);
  });
});
