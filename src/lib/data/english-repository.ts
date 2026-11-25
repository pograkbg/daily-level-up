/**
 * 영어 데이터 출처 선택기
 * - DATA_SOURCE=mock     → mock-english.ts (우리 단어 파일 기반)
 * - DATA_SOURCE=supabase → supabase-english-repository.ts (DB 함수)
 */

import type { ActionResult } from "@/types/game";
import type {
  EnglishAnswerResult,
  EnglishExample,
  EnglishLevelSummary,
  EnglishQuizStart,
  EnglishStats,
  WrongWord,
} from "@/types/english";
import { ENGLISH_DAILY_MAX } from "@/lib/game/english-quiz";
import {
  mockAnswerEnglishQuiz,
  mockEnglishDailyUsed,
  mockEnglishStats,
  mockEnglishSummary,
  mockSetEnglishMaxLevel,
  mockStartEnglishQuiz,
  mockWrongWords,
} from "./mock-english";
import {
  supabasePickExample,
  supabaseAnswerEnglishQuiz,
  supabaseEnglishDailyUsed,
  supabaseEnglishStats,
  supabaseEnglishSummary,
  supabaseSetEnglishMaxLevel,
  supabaseStartEnglishQuiz,
  supabaseWrongWords,
} from "./supabase-english-repository";

function isSupabaseSource(): boolean {
  return process.env.DATA_SOURCE === "supabase";
}

/**
 * 레벨 열림 규칙: 보호자가 연 레벨이라도, 앞 레벨을 모두 깨지 않았으면 잠깁니다.
 * (예전에 저장된 "3레벨까지 열림" 값이 있어도 1·2레벨을 깨기 전에는 3레벨이 열리지 않습니다.)
 */
function applyClearRule(levels: EnglishLevelSummary[]): EnglishLevelSummary[] {
  let prevCleared = true;
  return levels.map((s) => {
    // 관리자가 직접 연 레벨은 앞 레벨을 깨지 않아도 열립니다.
    const unlocked = s.manualOpen === true ? s.unlocked : s.unlocked && prevCleared;
    prevCleared = prevCleared && s.total > 0 && s.learned >= s.total;
    return { ...s, unlocked };
  });
}

export async function getEnglishSummary(): Promise<EnglishLevelSummary[]> {
  const raw = isSupabaseSource() ? await supabaseEnglishSummary() : mockEnglishSummary();
  return applyClearRule(raw);
}

export async function getEnglishStats(): Promise<EnglishStats> {
  return isSupabaseSource() ? supabaseEnglishStats() : mockEnglishStats();
}

export async function getEnglishWrongWords(level: number): Promise<WrongWord[]> {
  return isSupabaseSource() ? supabaseWrongWords(level) : mockWrongWords(level);
}

/** 오늘 퀴즈를 몇 번 풀었는지 (최대 5회) */
export async function getEnglishDailyStatus(): Promise<{ used: number; max: number }> {
  const used = isSupabaseSource() ? await supabaseEnglishDailyUsed() : mockEnglishDailyUsed();
  return { used, max: ENGLISH_DAILY_MAX };
}

export async function setEnglishMaxLevel(level: number): Promise<ActionResult<null>> {
  return isSupabaseSource() ? supabaseSetEnglishMaxLevel(level) : mockSetEnglishMaxLevel(level);
}

export async function startEnglishQuiz(
  level: number,
  count: number,
  wrongOnly = false,
): Promise<ActionResult<EnglishQuizStart>> {
  // 잠긴 레벨(앞 레벨을 아직 안 깬 레벨 포함)은 시작할 수 없습니다.
  const levels = await getEnglishSummary();
  if (!levels.find((s) => s.level === level)?.unlocked) {
    return { ok: false, error: "아직 잠긴 레벨이에요. 앞 레벨을 모두 깨면 열려요." };
  }
  return isSupabaseSource()
    ? supabaseStartEnglishQuiz(level, count, wrongOnly)
    : mockStartEnglishQuiz(level, count, wrongOnly);
}

/** "다른 예문 보기": 예문 풀에서 한 개 더 고릅니다. 풀이 없으면 null (화면에서는 기본 예문만 보입니다). */
export async function pickEnglishExample(wordId: number): Promise<EnglishExample | null> {
  if (!isSupabaseSource()) return null;
  return supabasePickExample(wordId);
}

export async function answerEnglishQuestion(
  itemId: string,
  choiceId: number,
  elapsedMs: number,
): Promise<ActionResult<EnglishAnswerResult>> {
  return isSupabaseSource()
    ? supabaseAnswerEnglishQuiz(itemId, choiceId, elapsedMs)
    : mockAnswerEnglishQuiz(itemId, choiceId, elapsedMs);
}
