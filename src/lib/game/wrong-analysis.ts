/**
 * 틀린 문제 분석 (규칙 기반, 외부로 아무것도 보내지 않습니다).
 * 말투 원칙: 아이를 탓하지 않고, "많은 친구들이 헷갈려 하는 부분"으로 이야기합니다.
 */

export interface WrongMathRow {
  operator: string; // "+", "-", "×", "÷"
  leftOperand: number;
  rightOperand: number;
  correctAnswer: number;
  myAnswer: number;
}

export type MistakeKind = "carry" | "borrow" | "digit" | "one" | "times" | "divide" | "other";

export const MISTAKE_LABEL: Record<MistakeKind, string> = {
  carry: "받아올림이 있는 덧셈",
  borrow: "받아내림이 있는 뺄셈",
  digit: "자릿수를 맞추는 계산",
  one: "한 칸 차이 (세는 실수)",
  times: "곱셈 구구단",
  divide: "나눗셈",
  other: "그 밖의 계산",
};

/** 틀린 한 문제가 어떤 유형인지 고릅니다. 여러 조건이 맞으면 위에 있는 것을 씁니다. */
export function classifyMistake(row: WrongMathRow): MistakeKind {
  const diff = Math.abs(row.myAnswer - row.correctAnswer);
  if (diff === 10 || diff === 100) return "digit";
  if (diff === 1) return "one";
  if (row.operator === "+" && (row.leftOperand % 10) + (row.rightOperand % 10) >= 10) return "carry";
  if (row.operator === "-" && row.leftOperand % 10 < row.rightOperand % 10) return "borrow";
  if (row.operator === "×") return "times";
  if (row.operator === "÷") return "divide";
  return "other";
}

export interface MathAnalysis {
  total: number; // 분석한 틀린 문제 수
  top: { kind: MistakeKind; count: number; message: string }[]; // 많이 나온 유형 2개
}

/** 틀린 문제가 너무 적으면 분석하지 않습니다 (몇 문제로 단정하지 않기 위해). */
const MIN_WRONG_TO_ANALYZE = 5;

export function analyzeMath(rows: WrongMathRow[]): MathAnalysis | null {
  if (rows.length < MIN_WRONG_TO_ANALYZE) return null;
  const counts = new Map<MistakeKind, number>();
  for (const r of rows) {
    const kind = classifyMistake(r);
    counts.set(kind, (counts.get(kind) ?? 0) + 1);
  }
  const top = [...counts.entries()]
    .filter(([kind, n]) => kind !== "other" && n >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([kind, count]) => ({ kind, count, message: messageFor(kind) }));
  return { total: rows.length, top };
}

/** 상처받지 않는 말투의 한 줄 안내 */
function messageFor(kind: MistakeKind): string {
  switch (kind) {
    case "carry":
      return "받아올림이 있는 덧셈은 많은 친구들이 헷갈려 하는 부분이에요. 일의 자리부터 천천히 계산해 봐요.";
    case "borrow":
      return "받아내림이 있는 뺄셈은 많은 친구들이 어려워하는 부분이에요. 빌려 오는 자리를 함께 확인해 봐요.";
    case "digit":
      return "자릿수가 한 칸 어긋나는 실수는 누구나 하기 쉬워요. 십의 자리와 일의 자리를 나눠서 보면 좋아요.";
    case "one":
      return "답이 한 칸 차이인 경우가 많아요. 세는 순서를 한 번 더 확인하면 도움이 돼요.";
    case "times":
      return "구구단은 헷갈리기 쉬운 부분이에요. 자주 틀린 단을 골라서 반복해 보면 금방 익숙해져요.";
    case "divide":
      return "나눗셈은 많은 친구들이 조금 어려워하는 부분이에요. 곱셈으로 바꿔서 확인해 보면 좋아요.";
    default:
      return "";
  }
}
