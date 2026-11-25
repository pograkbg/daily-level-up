import { describe, expect, it } from "vitest";
import { checkAnswer, parseAnswerInput } from "@/lib/game/mission-rules";

describe("정답 입력 확인 (parseAnswerInput)", () => {
  it("1~3자리 숫자는 그대로 숫자로 바꿉니다", () => {
    expect(parseAnswerInput("7")).toBe(7);
    expect(parseAnswerInput("42")).toBe(42);
    expect(parseAnswerInput("999")).toBe(999);
  });

  it("빈칸, 4자리 이상, 음수, 글자는 받지 않습니다", () => {
    expect(parseAnswerInput("")).toBeNull();
    expect(parseAnswerInput("1234")).toBeNull();
    expect(parseAnswerInput("-1")).toBeNull();
    expect(parseAnswerInput("abc")).toBeNull();
  });
});

describe("정답 판정 (checkAnswer)", () => {
  it("입력이 정답과 같으면 맞았다고 판정합니다", () => {
    expect(checkAnswer({ answer: 13 }, 13)).toBe(true);
  });

  it("입력이 정답과 다르면 틀렸다고 판정합니다", () => {
    expect(checkAnswer({ answer: 13 }, 12)).toBe(false);
  });
});
