/**
 * 미션 데이터 출처 선택기
 *
 * - DATA_SOURCE=mock     → mock-store.ts
 * - DATA_SOURCE=supabase → supabase-mission-repository.ts
 */

import type { ActionResult, MissionView, PracticeSettings } from "@/types/game";
import type { MathOperator } from "@/lib/game/math-problems";
import {
  mockApproveNextGrade,
  mockClaimReward,
  mockGetMissionView,
  mockResolveLevelUp,
  mockSetPractice,
  mockStartNextAttempt,
  mockSubmitAnswer,
} from "./mock-store";
import {
  supabaseApproveNextGrade,
  supabaseClaimReward,
  supabaseGetMissionView,
  supabaseResolveLevelUp,
  supabaseSetPractice,
  supabaseStartNextAttempt,
  supabaseSubmitAnswer,
} from "./supabase-mission-repository";

function isSupabaseSource(): boolean {
  return process.env.DATA_SOURCE === "supabase";
}

export async function getMissionView(): Promise<MissionView> {
  return isSupabaseSource() ? supabaseGetMissionView() : mockGetMissionView();
}

export async function submitMissionAnswer(
  missionId: string,
  index: number,
  rawInput: string,
  elapsedMs: number,
): Promise<ActionResult<MissionView>> {
  return isSupabaseSource()
    ? supabaseSubmitAnswer(missionId, index, rawInput, elapsedMs)
    : mockSubmitAnswer(missionId, index, rawInput, elapsedMs);
}

export async function claimMissionReward(missionId: string): Promise<ActionResult<MissionView>> {
  return isSupabaseSource() ? supabaseClaimReward(missionId) : mockClaimReward(missionId);
}

export async function startNextMissionAttempt(): Promise<ActionResult<MissionView>> {
  return isSupabaseSource() ? supabaseStartNextAttempt() : mockStartNextAttempt();
}

export async function setPracticeSettings(settings: PracticeSettings): Promise<ActionResult<null>> {
  return isSupabaseSource() ? supabaseSetPractice(settings) : mockSetPractice(settings);
}

export async function approveNextGrade(): Promise<ActionResult<null>> {
  return isSupabaseSource() ? supabaseApproveNextGrade() : mockApproveNextGrade();
}

/** 레벨을 깬 뒤 올라갈지 고르기 */
export async function resolveLevelUp(op: MathOperator, accept: boolean): Promise<ActionResult<null>> {
  return isSupabaseSource() ? supabaseResolveLevelUp(op, accept) : mockResolveLevelUp(op, accept);
}
