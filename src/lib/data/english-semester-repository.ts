/**
 * 영어 학기 진도 (서버 전용). 목표는 단어 수 × 5번 정답이고, 학기 시작 이후의 기록으로 셉니다.
 * 모의고사 열림: 기준 진도(목표 × 지난 기간 비율) 이상 정답 + 정답률 90% 이상 (수학과 같은 규칙).
 */

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { MOCK_MIN_ACCURACY, semesterAt } from "@/lib/game/semester";

export const ENGLISH_CORRECT_PER_WORD = 5;

export interface EnglishSemesterProgress {
  grade: number;
  semester: 1 | 2;
  words: number;
  target: number;
  solved: number;
  correct: number;
  required: number;
  mockOpen: boolean;
}

export async function getGrade2EnglishProgress(now: Date = new Date()): Promise<EnglishSemesterProgress> {
  const info = semesterAt(now);
  const semester = info.semester;

  const empty: EnglishSemesterProgress = {
    grade: 2,
    semester,
    words: 0,
    target: 0,
    solved: 0,
    correct: 0,
    required: 0,
    mockOpen: false,
  };

  if (process.env.DATA_SOURCE !== "supabase") return empty;

  try {
    const supabase = await createSupabaseServerClient();

    const { count: wordCount, error: wordError } = await supabase
      .from("grade2_words")
      .select("id", { count: "exact", head: true })
      .eq("semester", semester);
    if (wordError) throw wordError;

    const { data: rows, error: rowError } = await supabase
      .from("early_attempts")
      .select("correct")
      .eq("kind", "grade2_word")
      .gte("answered_at", info.start.toISOString())
      .lt("answered_at", now.toISOString());
    if (rowError) throw rowError;

    const words = wordCount ?? 0;
    const target = words * ENGLISH_CORRECT_PER_WORD;
    const solved = (rows ?? []).length;
    const correct = (rows ?? []).filter((r) => r.correct === true).length;
    const required = Math.floor(target * info.ratio);
    const accuracy = solved > 0 ? correct / solved : 0;

    return {
      ...empty,
      words,
      target,
      solved,
      correct,
      required,
      mockOpen: solved > 0 && correct >= required && accuracy >= MOCK_MIN_ACCURACY,
    };
  } catch (error) {
    console.error("[english-semester] progress failed:", error instanceof Error ? error.message : error);
    return empty;
  }
}
