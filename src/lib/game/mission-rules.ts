/**
 * 미션 규칙 (순수 함수: DB·화면과 무관)
 */

import type { MathOperator, MathProblem } from "@/lib/game/math-problems";
import { ANSWER_MAX_DIGITS } from "@/lib/game/mission-config";

/** 아이가 입력한 문자열을 답 숫자로 바꿉니다. 1~3자리 숫자만 허용. 잘못되면 null. */
export function parseAnswerInput(raw: string): number | null {
  const pattern = new RegExp(`^\\d{1,${ANSWER_MAX_DIGITS}}$`);
  if (!pattern.test(raw)) return null;
  const value = Number(raw);
  return value <= 999 ? value : null;
}

/** 제출한 답이 정답인지 확인 */
export function checkAnswer(problem: Pick<MathProblem, "answer">, input: number): boolean {
  return problem.answer === input;
}

/** 연산 기호를 화면용으로 바꿉니다. (- 는 긴 빼기 −) */
export function operatorSymbol(operator: MathOperator): string {
  return operator === "-" ? "−" : operator;
}

/** 화면에 보여줄 문제 문장 (예: "12 + 5 = ?", "6 × 7 = ?") */
export function formatPrompt(problem: Pick<MathProblem, "left" | "right" | "operator">): string {
  return `${problem.left} ${operatorSymbol(problem.operator)} ${problem.right} = ?`;
}

/**
 * 틀렸을 때 보여줄 해설.
 * 연산 종류에 맞춰 "왜 그런지"를 짧게 설명합니다.
 */
export function explainProblem(problem: Pick<MathProblem, "left" | "right" | "operator" | "answer">): string {
  const { left, right, operator, answer } = problem;

  if (operator === "+") {
    const carry = (left % 10) + (right % 10) >= 10;
    const tip = carry
      ? " 일의 자리끼리 더하면 10이 넘으니, 10을 십의 자리로 1만큼 받아올림해요."
      : "";
    return `${left}에 ${right}을 더하면 ${answer}이에요.${tip}`;
  }

  if (operator === "-") {
    const borrow = (left % 10) < (right % 10);
    const tip = borrow
      ? " 일의 자리끼리 뺄 수 없으니, 십의 자리에서 10을 빌려와(내림) 계산해요."
      : "";
    return `${left}에서 ${right}을 빼면 ${answer}이에요.${tip}`;
  }

  if (operator === "×") {
    const repeated = Array.from({ length: right }, () => String(left)).join(" + ");
    return `${left} × ${right}은 ${left}을 ${right}번 더한 것과 같아요. (${repeated} = ${answer})`;
  }

  // ÷
  return `${left}을 ${right}개씩 묶으면 ${answer}묶음이 돼요. (${right} × ${answer} = ${left})`;
}
