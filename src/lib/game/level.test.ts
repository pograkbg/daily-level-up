import { describe, expect, it } from "vitest";
import { getLevelInfo } from "@/lib/game/level";

describe("캐릭터 레벨 (getLevelInfo)", () => {
  it("경험치가 없으면 레벨 1입니다", () => {
    expect(getLevelInfo(0).level).toBe(1);
  });

  it("경험치 99점은 아직 레벨 1입니다", () => {
    expect(getLevelInfo(99).level).toBe(1);
  });

  it("경험치 100점이면 레벨 2입니다", () => {
    expect(getLevelInfo(100).level).toBe(2);
  });
});
