import { describe, expect, it } from "vitest";
import { analyzeMath, classifyMistake, type WrongMathRow } from "@/lib/game/wrong-analysis";

function row(partial: Partial<WrongMathRow> & Pick<WrongMathRow, "operator" | "leftOperand" | "rightOperand" | "correctAnswer" | "myAnswer">): WrongMathRow {
  return partial;
}

describe("틀린 유형 분류 (classifyMistake)", () => {
  it("답이 10 차이나면 자릿수 실수입니다", () => {
    expect(classifyMistake(row({ operator: "+", leftOperand: 42, rightOperand: 5, correctAnswer: 47, myAnswer: 37 }))).toBe("digit");
  });

  it("답이 1 차이나면 한 칸 차이 실수입니다", () => {
    expect(classifyMistake(row({ operator: "×", leftOperand: 7, rightOperand: 8, correctAnswer: 56, myAnswer: 55 }))).toBe("one");
  });

  it("일의 자리 합이 10 이상인 덧셈은 받아올림입니다", () => {
    expect(classifyMistake(row({ operator: "+", leftOperand: 27, rightOperand: 15, correctAnswer: 42, myAnswer: 30 }))).toBe("carry");
  });

  it("일의 자리가 모자란 뺄셈은 받아내림입니다", () => {
    expect(classifyMistake(row({ operator: "-", leftOperand: 42, rightOperand: 18, correctAnswer: 24, myAnswer: 26 }))).toBe("borrow");
  });

  it("곱셈은 구구단, 나눗셈은 나눗셈으로 나눕니다", () => {
    expect(classifyMistake(row({ operator: "×", leftOperand: 7, rightOperand: 8, correctAnswer: 56, myAnswer: 49 }))).toBe("times");
    expect(classifyMistake(row({ operator: "÷", leftOperand: 56, rightOperand: 8, correctAnswer: 7, myAnswer: 9 }))).toBe("divide");
  });
});

describe("틀린 문제 분석 (analyzeMath)", () => {
  it("틀린 문제가 5개보다 적으면 분석하지 않습니다", () => {
    const rows = [row({ operator: "×", leftOperand: 7, rightOperand: 8, correctAnswer: 56, myAnswer: 49 })];
    expect(analyzeMath(rows)).toBeNull();
  });

  it("같은 유형이 2번 이상 나오면 많이 헷갈리는 유형으로 알려 줍니다", () => {
    const times = row({ operator: "×", leftOperand: 7, rightOperand: 8, correctAnswer: 56, myAnswer: 49 });
    const rows = [times, times, times, row({ operator: "÷", leftOperand: 56, rightOperand: 8, correctAnswer: 7, myAnswer: 9 }), row({ operator: "÷", leftOperand: 56, rightOperand: 8, correctAnswer: 7, myAnswer: 9 })];
    const result = analyzeMath(rows);
    expect(result?.total).toBe(5);
    expect(result?.top[0]?.kind).toBe("times");
    expect(result?.top[0]?.count).toBe(3);
  });
});
