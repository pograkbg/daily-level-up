/**
 * 이번 학기 수학 진도 (서버 전용). 학기 시작일 이후에 푼 문제 수와 정답 수를 셉니다.
 * 데이터는 mission_answers 에서 읽고, 본인 기록만 보입니다 (RLS).
 */

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { MOCK_MIN_ACCURACY, requiredByNow, SEMESTER_TARGET, semesterAt } from "@/lib/game/semester";

export interface SemesterProgress {
  schoolYear: number;
  semester: 1 | 2;
  solved: number;
  correct: number;
  target: number;
  required: number;
  mockOpen: boolean;
}

export async function getSemesterProgress(now: Date = new Date()): Promise<SemesterProgress> {
  const info = semesterAt(now);
  const required = requiredByNow(now);
  const empty: SemesterProgress = {
    schoolYear: info.schoolYear,
    semester: info.semester,
    solved: 0,
    correct: 0,
    target: SEMESTER_TARGET,
    required,
    mockOpen: false,
  };

  if (process.env.DATA_SOURCE !== "supabase") return empty;

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("mission_answers")
      .select("is_correct")
      .gte("answered_at", info.start.toISOString())
      .lt("answered_at", now.toISOString());
    if (error) throw error;

    const rows = data ?? [];
    const solved = rows.length;
    const correct = rows.filter((r) => r.is_correct === true).length;
    const accuracy = solved > 0 ? correct / solved : 0;
    return {
      ...empty,
      solved,
      correct,
      mockOpen: solved > 0 && solved >= required && accuracy >= MOCK_MIN_ACCURACY,
    };
  } catch (error) {
    console.error("[semester] progress failed:", error instanceof Error ? error.message : error);
    return empty;
  }
}
