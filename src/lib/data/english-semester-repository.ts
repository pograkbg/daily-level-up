/**
 * 영어 학기 진도 (서버 전용). 목표는 단어 수 × 5번 정답이고, 학기 시작 이후의 정답 수로 셉니다.
 * 지금은 2학년 영어 단어 퀴즈(/english2)의 기록만 셉니다.
 */

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { semesterAt } from "@/lib/game/semester";

export const ENGLISH_CORRECT_PER_WORD = 5;

export interface EnglishSemesterProgress {
  grade: number;
  semester: 1 | 2;
  words: number;
  target: number;
  correct: number;
}

export async function getGrade2EnglishProgress(now: Date = new Date()): Promise<EnglishSemesterProgress> {
  const info = semesterAt(now);
  const semester = info.semester;

  const empty: EnglishSemesterProgress = {
    grade: 2,
    semester,
    words: 0,
    target: 0,
    correct: 0,
  };

  if (process.env.DATA_SOURCE !== "supabase") return empty;

  try {
    const supabase = await createSupabaseServerClient();

    const { count: wordCount, error: wordError } = await supabase
      .from("grade2_words")
      .select("id", { count: "exact", head: true })
      .eq("semester", semester);
    if (wordError) throw wordError;

    const { count: correctCount, error: correctError } = await supabase
      .from("early_attempts")
      .select("id", { count: "exact", head: true })
      .eq("kind", "grade2_word")
      .eq("correct", true)
      .gte("answered_at", info.start.toISOString())
      .lt("answered_at", now.toISOString());
    if (correctError) throw correctError;

    const words = wordCount ?? 0;
    return {
      ...empty,
      words,
      target: words * ENGLISH_CORRECT_PER_WORD,
      correct: correctCount ?? 0,
    };
  } catch (error) {
    console.error("[english-semester] progress failed:", error instanceof Error ? error.message : error);
    return empty;
  }
}
