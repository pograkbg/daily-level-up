"use server";

/**
 * 미션 서버 함수 (Server Actions).
 * 아이 화면(브라우저)은 정답을 모르고, 여기서만 정답을 검사합니다.
 * 입력값은 브라우저가 조작했을 수 있으므로 모두 다시 확인합니다.
 */

import {
  approveNextGrade,
  claimMissionReward,
  resolveLevelUp,
  setPracticeSettings,
  startNextMissionAttempt,
  submitMissionAnswer,
} from "@/lib/data/mission-repository";
import { ANSWER_MAX_DIGITS } from "@/lib/game/mission-config";
import type { ActionResult, MissionView, PracticeSettings } from "@/types/game";

/** 한 문제에 쓸 수 있는 최대 시간 (120초). 자리를 비운 시간은 학습 시간에서 뺍니다. */
const MAX_ELAPSED_MS = 120_000;

export async function submitAnswerAction(
  missionId: string,
  index: number,
  rawInput: string,
  elapsedMs: number,
): Promise<ActionResult<MissionView>> {
  if (typeof missionId !== "string" || !Number.isInteger(index) || typeof rawInput !== "string") {
    return { ok: false, error: "잘못된 요청이에요." };
  }
  if (rawInput.length > ANSWER_MAX_DIGITS) {
    return { ok: false, error: "0부터 999까지 숫자를 입력해 주세요." };
  }
  const safeElapsed = Number.isFinite(elapsedMs) ? Math.min(Math.max(Math.round(elapsedMs), 0), MAX_ELAPSED_MS) : 0;
  return submitMissionAnswer(missionId, index, rawInput, safeElapsed);
}

export async function claimRewardAction(missionId: string): Promise<ActionResult<MissionView>> {
  if (typeof missionId !== "string") {
    return { ok: false, error: "잘못된 요청이에요." };
  }
  return claimMissionReward(missionId);
}

export async function startNextAttemptAction(): Promise<ActionResult<MissionView>> {
  return startNextMissionAttempt();
}

const OPS = ["+", "-", "×", "÷"] as const;
const BANDS = [0, 1, 2] as const;

export async function setPracticeAction(settings: PracticeSettings): Promise<ActionResult<null>> {
  const mode = settings?.mode;
  if (mode !== "random" && mode !== "choose") {
    return { ok: false, error: "풀이 방식을 다시 골라 주세요." };
  }
  if (mode === "random") {
    return setPracticeSettings({ mode: "random", bands: { "+": null, "-": null, "×": null, "÷": null } });
  }
  const bands = {} as PracticeSettings["bands"];
  for (const op of OPS) {
    const band = BANDS.find((b) => b === settings.bands?.[op]);
    if (band === undefined) {
      return { ok: false, error: "덧셈·뺄셈·곱셈·나눗셈 난이도를 모두 골라 주세요." };
    }
    bands[op] = band;
  }
  return setPracticeSettings({ mode: "choose", bands });
}

/** 레벨을 깬 뒤 "올라가기" 또는 "올라가지 않기" 선택 */
export async function resolveLevelUpAction(op: string, accept: boolean): Promise<ActionResult<null>> {
  if (!["+", "-", "×", "÷"].includes(op) || typeof accept !== "boolean") {
    return { ok: false, error: "잘못된 요청이에요." };
  }
  return resolveLevelUp(op as "+" | "-" | "×" | "÷", accept);
}

export async function approveNextGradeAction(): Promise<ActionResult<null>> {
  return approveNextGrade();
}
