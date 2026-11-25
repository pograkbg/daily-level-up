/**
 * [실제 DB] 영어 퀴즈 저장소.
 * 퀴즈 만들기, 정답 확인, 학습 기록, 오답 목록은 DB 함수(0007~0009)가 합니다.
 * 이 파일은 결과를 화면 형식으로 바꿉니다.
 */

import { getCurrentChild, toActionError } from "@/lib/data/supabase-mission-repository";
import type { ActionResult } from "@/types/game";
import type {
  EnglishAnswerResult,
  EnglishLevelSummary,
  EnglishQuizStart,
  EnglishStats,
  WrongWord,
} from "@/types/english";
import { todayInSeoul } from "@/lib/game/mission-config";
import type { EnglishExample } from "@/types/english";

const LEVEL_COUNT = 3;

export async function supabaseEnglishSummary(): Promise<EnglishLevelSummary[]> {
  const { supabase, child } = await getCurrentChild();

  const { data: words, error: wordError } = await supabase.from("english_words").select("id, level");
  if (wordError) throw wordError;

  const { data: progress, error: progressError } = await supabase
    .from("english_progress")
    .select("word_id, correct_count, english_words(level)")
    .eq("child_id", child.id)
    .gt("correct_count", 0);
  if (progressError) throw progressError;

  const { data: childRow, error: childError } = await supabase
    .from("children")
    .select("english_max_level, english_manual_max")
    .eq("id", child.id)
    .single();
  if (childError) throw childError;
  const manualMax = (childRow.english_manual_max as number | null) ?? 0;

  const learnedByLevel = new Map<number, number>();
  for (const row of progress ?? []) {
    const word = row.english_words as unknown as { level: number } | null;
    if (!word) continue;
    learnedByLevel.set(word.level, (learnedByLevel.get(word.level) ?? 0) + 1);
  }

  const maxLevel = childRow.english_max_level as number;
  return Array.from({ length: LEVEL_COUNT }, (_, i) => i + 1).map((level) => ({
    level,
    total: (words ?? []).filter((w) => w.level === level).length,
    learned: learnedByLevel.get(level) ?? 0,
    unlocked: level <= maxLevel,
    manualOpen: level <= manualMax,
  }));
}

/** 오늘 푼 퀴즈 횟수 (수학 회차와 같은 날짜 기준) */
export async function supabaseEnglishDailyUsed(): Promise<number> {
  const { supabase, child } = await getCurrentChild();
  const today = todayInSeoul();
  const { count, error } = await supabase
    .from("english_quiz_sessions")
    .select("id", { count: "exact", head: true })
    .eq("child_id", child.id)
    .gte("created_at", `${today}T00:00:00+09:00`);
  if (error) throw error;
  return count ?? 0;
}

export async function supabaseEnglishStats(): Promise<EnglishStats> {
  const { supabase, child } = await getCurrentChild();
  const { data, error } = await supabase.rpc("get_english_stats", { p_child_id: child.id });
  if (error) throw error;
  const json = (data as EnglishStats | null) ?? { total: 0, correct: 0, byLevel: [], totalMs: 0, todayMs: 0 };
  return { ...json, totalMs: json.totalMs ?? 0, todayMs: json.todayMs ?? 0 };
}

export async function supabaseWrongWords(level: number): Promise<WrongWord[]> {
  const { supabase, child } = await getCurrentChild();
  const { data, error } = await supabase.rpc("get_english_wrong_words", {
    p_child_id: child.id,
    p_level: level,
  });
  if (error) throw error;
  return (data as WrongWord[] | null) ?? [];
}

export async function supabaseSetEnglishMaxLevel(level: number): Promise<ActionResult<null>> {
  try {
    const { supabase, child } = await getCurrentChild();
    const { error } = await supabase.rpc("set_english_max_level", {
      p_child_id: child.id,
      p_level: level,
    });
    if (error) throw error;
    return { ok: true, data: null };
  } catch (error) {
    return toActionError(error);
  }
}

export async function supabaseStartEnglishQuiz(
  level: number,
  count: number,
  wrongOnly: boolean,
): Promise<ActionResult<EnglishQuizStart>> {
  try {
    const { supabase, child } = await getCurrentChild();
    const { data, error } = await supabase.rpc("start_english_quiz", {
      p_child_id: child.id,
      p_level: level,
      p_count: count,
      p_wrong_only: wrongOnly,
    });
    if (error) throw error;

    const json = data as {
      sessionId: string;
      startIndex?: number;
      score?: number;
      items: { id: string; idx: number; word: string; choices: { id: number; meaning: string }[] }[];
    };
    return {
      ok: true,
      data: {
        sessionId: json.sessionId,
        items: json.items,
        startIndex: json.startIndex ?? 0,
        score: json.score ?? 0,
      },
    };
  } catch (error) {
    return toActionError(error);
  }
}

export async function supabaseAnswerEnglishQuiz(
  itemId: string,
  choiceId: number,
  elapsedMs: number,
): Promise<ActionResult<EnglishAnswerResult>> {
  try {
    const { supabase } = await getCurrentChild();
    const { data, error } = await supabase.rpc("answer_english_quiz", {
      p_item_id: itemId,
      p_choice: choiceId,
      p_elapsed_ms: elapsedMs,
    });
    if (error) throw error;

    const json = data as EnglishAnswerResult;

    // 예문 풀에 이 단어의 예문이 있으면 그것을 보여 주고, 출처를 함께 줍니다.
    const example = await supabasePickExample(json.correctWordId).catch(() => null);
    if (example) {
      return {
        ok: true,
        data: {
          ...json,
          example: example.en,
          exampleKo: example.ko,
          exampleSource: { owner: example.owner, license: example.license },
        },
      };
    }
    return { ok: true, data: { ...json, exampleSource: null } };
  } catch (error) {
    return toActionError(error);
  }
}

/** 예문 풀에서 한 개 고르기 (아이·날짜 기준, 같은 날 중복 없음). 없으면 null. */
export async function supabasePickExample(wordId: number): Promise<EnglishExample | null> {
  const { supabase, child } = await getCurrentChild();
  const { data, error } = await supabase.rpc("pick_examples", {
    p_child_id: child.id,
    p_word_id: wordId,
    p_limit: 1,
  });
  if (error) throw error;
  const row = (data as { example_id: number; en: string; ko: string; owner: string; license: string }[] | null)?.[0];
  if (!row) return null;
  return { id: Number(row.example_id), en: row.en, ko: row.ko, owner: row.owner, license: row.license };
}
