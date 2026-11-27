/**
 * 학습 레벨 (A안: 연산마다 따로 진도)
 *
 * - 연산 4개(덧셈·뺄셈·곱셈·나눗셈) 각각 15레벨 = 난이도 3(하·중·상) × 단계 5
 * - 정답 1개 = 5 XP 를 그 연산에 줍니다. 레벨 1개 = 250 XP = 정답 50개
 * - 4개 연산을 모두 레벨 15 까지 채우면 "학년 완료". 보호자가 승인하면 다음 학년이 열립니다.
 * - 승인 전까지는 열린 레벨에서 랜덤 연습을 계속합니다.
 */

import type { MathOperator } from "@/lib/game/math-problems";

export const OPERATORS: MathOperator[] = ["+", "-", "×", "÷"];
export const OP_LEVEL_MAX = 15; // 연산 하나의 레벨 수
export const XP_PER_LEVEL = 250; // 레벨 하나를 채우는 경험치
export const XP_PER_CORRECT = 5; // 정답 1개당 경험치
export const SESSION_QUESTIONS = 20; // 사칙연산 각 5문제 (그중 1문제는 랜덤 연산)
export const PER_OP_QUESTIONS = SESSION_QUESTIONS / 4; // 6
export const RANDOM_PER_OP = 1; // 연산마다 한 문제는 랜덤 문제
export const BAND_NAMES = ["하", "중", "상"] as const;
export const OPERATOR_NAMES: Record<MathOperator, string> = {
  "+": "덧셈",
  "-": "뺄셈",
  "×": "곱셈",
  "÷": "나눗셈",
};

export type Band = 0 | 1 | 2;
export type BandChoice = Record<MathOperator, Band | null>;
export interface OpProgress {
  level: number; // 1 ~ 15
  xp: number; // 0 ~ 250 (레벨을 다 채우면 250에서 멈춤)
  ready?: boolean; // 레벨을 깼고, 올라갈지 아이에게 물어볼 차례
  hold?: boolean; // 아이가 "올라가지 않기"를 골라서, 이 연산은 더 이상 묻지 않고 지금 레벨에 머무름
}
export type Progress = Record<MathOperator, OpProgress>;

export interface PlanSlot {
  op: MathOperator;
  band: Band;
  step: number; // 1 ~ 5
}

export const DEFAULT_PROGRESS: Progress = {
  "+": { level: 1, xp: 0 },
  "-": { level: 1, xp: 0 },
  "×": { level: 1, xp: 0 },
  "÷": { level: 1, xp: 0 },
};

/** 연산 안의 레벨 번호(1~15) → 난이도와 단계 */
export function slotOfLevel(level: number): { band: Band; step: number } {
  const i = Math.min(OP_LEVEL_MAX, Math.max(1, Math.floor(level))) - 1;
  return { band: Math.floor(i / 5) as Band, step: (i % 5) + 1 };
}

/** 화면 표시용 이름 (예: "중 · 3단계") */
export function levelName(level: number): string {
  const { band, step } = slotOfLevel(level);
  return `${BAND_NAMES[band]} · ${step}단계`;
}

/** 연산·난이도에서 지금 열린 가장 높은 레벨 번호 (열리지 않았으면 null) */
export function resolveChooseLevel(band: Band, opLevel: number): number | null {
  const first = band * 5 + 1;
  if (first > opLevel) return null;
  return Math.min(first + 4, opLevel);
}

/** 지정 풀기 설정이 모두 채워졌는지 */
export function isBandChoiceComplete(bands: BandChoice): boolean {
  return OPERATORS.every((op) => bands[op] !== null);
}

/** 이 난이도가 열렸는지 (해당 연산의 현재 레벨 기준) */
export function isBandUnlocked(op: MathOperator, band: Band, progress: Progress): boolean {
  return band * 5 + 1 <= progress[op].level;
}

/** 랜덤 문제 한 개: 어느 연산이든 나올 수 있고, 그 연산의 열린 레벨 중 하나 */
function randomSlot(seed: number, i: number, progress: Progress): PlanSlot {
  const r = (seed + i * 2654435761) >>> 0;
  const op = OPERATORS[r % OPERATORS.length];
  const unlocked = Math.max(1, progress[op].level);
  const level = 1 + ((r >>> 8) % unlocked);
  const { band, step } = slotOfLevel(level);
  return { op, band, step };
}

/**
 * 한 회차(20문제)의 계획
 * - 지정 풀기: 연산마다 6문제 (덧셈 → 뺄셈 → 곱셈 → 나눗셈 순).
 *   각 연산의 6문제 중 1문제는 랜덤(어느 연산이든) 문제로 바꿉니다.
 * - 랜덤 풀기: 20문제 각각 무작위 연산, 그 연산의 열린 레벨 중 하나
 * null 이면 열리지 않은 난이도가 섞여 있다는 뜻
 */
export function planSession(
  mode: "random" | "choose",
  bands: BandChoice,
  progress: Progress,
  seed: number,
): PlanSlot[] | null {
  if (mode === "choose") {
    const plan: PlanSlot[] = [];
    const normalPerOp = PER_OP_QUESTIONS - RANDOM_PER_OP; // 연산마다 고정 문제 5개
    let counter = 0;
    for (const op of OPERATORS) {
      const band = bands[op];
      if (band === null) return null;
      const level = resolveChooseLevel(band, progress[op].level);
      if (level === null) return null;
      // 그 난이도에서 열린 가장 높은 단계까지, 1단계부터 차례로 올라갑니다.
      const maxStep = slotOfLevel(level).step;
      // 랜덤 문제가 들어갈 자리를 연산 안에서 정합니다 (같은 회차·같은 seed 면 항상 같은 자리).
      const randomAt = (seed >>> 0) % PER_OP_QUESTIONS;
      for (let i = 0; i < PER_OP_QUESTIONS; i++) {
        if (i === randomAt) {
          plan.push(randomSlot(seed, counter, progress));
        } else {
          const j = i < randomAt ? i : i - 1; // 고정 문제 순번 (0 ~ normalPerOp-1)
          const step = Math.min(maxStep, 1 + Math.floor((j * maxStep) / normalPerOp));
          plan.push({ op, band, step });
        }
        counter += 1;
      }
    }
    return plan;
  }

  return Array.from({ length: SESSION_QUESTIONS }, (_, i) => randomSlot(seed, i, progress));
}

/** 정답 1개 반영: 250 XP 가 차면 다음 레벨. 레벨 15 에서는 바가 가득 찬 상태에서 멈춤. */
export function applyCorrectXp(entry: OpProgress): OpProgress {
  // 레벨은 바로 올리지 않고, 250을 채우면 "올라갈까요?" 차례(ready)로 둡니다.
  const xp = Math.min(XP_PER_LEVEL, entry.xp + XP_PER_CORRECT);
  const ready = entry.ready === true || (xp >= XP_PER_LEVEL && entry.level < OP_LEVEL_MAX && entry.hold !== true);
  return { ...entry, xp, ready };
}

/** 아이의 선택 반영: 올라가기(accept) 또는 올라가지 않기 */
export function resolveLevelUp(entry: OpProgress, accept: boolean): OpProgress {
  if (accept) {
    return {
      level: Math.min(OP_LEVEL_MAX, entry.level + 1),
      xp: 0,
      ready: false,
      hold: false,
    };
  }
  return { level: entry.level, xp: 0, ready: false, hold: true };
}


/** 학년 완료: 네 연산 모두 레벨 15 의 바가 가득 찼을 때 */
export function isGradeCleared(progress: Progress): boolean {
  return OPERATORS.every((op) => progress[op].level >= OP_LEVEL_MAX && progress[op].xp >= XP_PER_LEVEL);
}

/** 회차 요약 문구 (예: "지정 풀기 · 덧셈 하 · 뺄셈 중 · 곱셈 상 · 나눗셈 하") */
export function planLabelFor(mode: "random" | "choose", bands: BandChoice): string {
  if (mode === "random") return `랜덤 풀기 · ${SESSION_QUESTIONS}문제`;
  const parts = OPERATORS.map((op) => {
    const b = bands[op];
    return `${OPERATOR_NAMES[op]} ${b === null ? "-" : BAND_NAMES[b]}`;
  });
  return `지정 풀기 · ${parts.join(" · ")}`;
}
