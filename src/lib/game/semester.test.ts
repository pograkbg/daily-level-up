import { describe, expect, it } from "vitest";
import { mockPassed, mockUnlocked, requiredByNow, semesterAt } from "@/lib/game/semester";

// 한국 시간(+09:00) 기준 날짜
const kst = (iso: string) => new Date(`${iso}+09:00`);

describe("semesterAt", () => {
  it("3월~8월은 1학기", () => {
    expect(semesterAt(kst("2026-03-01T09:00:00")).semester).toBe(1);
    expect(semesterAt(kst("2026-08-31T23:00:00")).semester).toBe(1);
  });

  it("9월~2월은 2학기, 학년도는 전년도로 이어짐", () => {
    const sep = semesterAt(kst("2026-09-01T09:00:00"));
    expect(sep.semester).toBe(2);
    expect(sep.schoolYear).toBe(2026);
    const jan = semesterAt(kst("2027-01-15T09:00:00"));
    expect(jan.semester).toBe(2);
    expect(jan.schoolYear).toBe(2026);
  });

  it("11월 27일은 2학기 기간의 약 48% 지점", () => {
    expect(semesterAt(kst("2026-11-27T12:00:00")).ratio).toBeCloseTo(87 / 181, 2);
  });
});

describe("requiredByNow", () => {
  it("11월 27일 낮 12시 기준 진도는 435문제 (지난 87.5일 / 181일 × 900)", () => {
    expect(requiredByNow(kst("2026-11-27T12:00:00"))).toBe(435);
  });

  it("학기 시작일에는 0문제", () => {
    expect(requiredByNow(kst("2026-09-01T00:00:00"))).toBe(0);
  });
});

describe("mockUnlocked", () => {
  const now = kst("2026-11-27T12:00:00");

  it("기준 진도 이상 + 정답률 90% 이상이면 열림", () => {
    expect(mockUnlocked(450, 420, now)).toBe(true);
  });

  it("기준 진도보다 적게 풀면 안 열림", () => {
    expect(mockUnlocked(300, 290, now)).toBe(false);
  });

  it("정답률이 90% 미만이면 안 열림", () => {
    expect(mockUnlocked(450, 400, now)).toBe(false);
  });
});

describe("mockPassed", () => {
  it("50문제 중 45개 이상 맞히면 통과 (90점)", () => {
    expect(mockPassed(45)).toBe(true);
    expect(mockPassed(44)).toBe(false);
  });
});
