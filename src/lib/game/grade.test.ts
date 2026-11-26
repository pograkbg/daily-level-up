import { describe, expect, it } from "vitest";
import { currentGrade, MAX_GRADE, schoolYear } from "@/lib/game/grade";

// 한국 시간(+09:00) 기준 날짜를 만듭니다.
const kst = (iso: string) => new Date(`${iso}+09:00`);

describe("schoolYear", () => {
  it("3월 이후는 그 해가 학년도", () => {
    expect(schoolYear(kst("2026-03-01T09:00:00"))).toBe(2026);
    expect(schoolYear(kst("2026-11-26T12:00:00"))).toBe(2026);
  });

  it("1~2월은 전년도가 학년도", () => {
    expect(schoolYear(kst("2027-01-15T09:00:00"))).toBe(2026);
    expect(schoolYear(kst("2027-02-28T23:00:00"))).toBe(2026);
  });
});

describe("currentGrade", () => {
  it("같은 학년도 안에서는 학년이 바뀌지 않음", () => {
    expect(currentGrade(2, 2026, kst("2026-11-26T12:00:00"))).toBe(2);
  });

  it("3월이 되면 한 학년 올라감", () => {
    expect(currentGrade(2, 2026, kst("2027-03-02T09:00:00"))).toBe(3);
  });

  it("유아였던 아이는 1년 뒤 1학년", () => {
    expect(currentGrade(0, 2026, kst("2027-03-02T09:00:00"))).toBe(1);
  });

  it("6학년을 넘지 않음", () => {
    expect(currentGrade(5, 2026, kst("2040-03-02T09:00:00"))).toBe(MAX_GRADE);
  });

  it("저장된 학년도가 미래여도 낮추지 않음", () => {
    expect(currentGrade(2, 2030, kst("2026-11-26T12:00:00"))).toBe(2);
  });
});
