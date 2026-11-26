/**
 * 유아·1학년 문제 읽기 (서버 전용). 문제는 early_problems 테이블, 1학년 수학은 코드에서 만듭니다.
 * - 유아 수학: 숫자 세기 (count_number)
 * - 유아 영어: 알파벳 맞추기 + 영어 숫자 세기 (20문제)
 * - 1학년 수학: 덧셈·뺄셈과 다음 수 찾기 (24문제, 코드에서 생성)
 * - 1학년 영어: 색·동물 80% (16문제) + 유아 영어 문제 20% (4문제), 무작위로 섞음
 */

import { buildGrade1MathSet, shuffle } from "@/lib/game/early";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type EarlySubject = "math" | "english";

export interface EarlyItem {
  key: string;
  /** DB 문제면 id, 코드에서 만든 문제면 null */
  problemId: string | null;
  kind: string;
  prompt: string;
  choices: string[];
  answer: string;
}

interface ProblemRow {
  id: string;
  kind: string;
  prompt: string;
  choices: string[];
  answer: string;
}

const random = () => Math.random();

async function fetchProblems(kinds: string[], grade: number): Promise<ProblemRow[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("early_problems")
    .select("id, kind, prompt, choices, answer")
    .in("kind", kinds)
    .eq("grade", grade)
    .eq("active", true);
  if (error) throw error;
  return (data ?? []) as ProblemRow[];
}

function toItem(row: ProblemRow): EarlyItem {
  return {
    key: row.id,
    problemId: row.id,
    kind: row.kind,
    prompt: row.prompt,
    choices: shuffle(row.choices, random),
    answer: row.answer,
  };
}

/** 학년과 과목에 맞는 한 묶음의 문제를 만듭니다. */
export async function loadEarlySet(grade: 0 | 1, subject: EarlySubject): Promise<EarlyItem[]> {
  if (grade === 1 && subject === "math") {
    return buildGrade1MathSet(24, random).map((q) => ({
      key: q.prompt,
      problemId: null,
      kind: q.kind,
      prompt: q.prompt,
      choices: q.choices.map(String),
      answer: String(q.answer),
    }));
  }

  if (grade === 0 && subject === "math") {
    const rows = await fetchProblems(["count_number"], 0);
    return shuffle(rows, random).map(toItem);
  }

  if (grade === 0) {
    const rows = await fetchProblems(["alphabet_pick", "english_number"], 0);
    return shuffle(rows, random).slice(0, 20).map(toItem);
  }

  // 1학년 영어: 색·동물 80%, 유아 영어 20%
  const [colors, young] = await Promise.all([
    fetchProblems(["color_animal"], 1),
    fetchProblems(["alphabet_pick", "english_number"], 0),
  ]);
  const mix = [...shuffle(colors, random).slice(0, 16), ...shuffle(young, random).slice(0, 4)];
  return shuffle(mix, random).map(toItem);
}
