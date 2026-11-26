"use server";

/**
 * 유아·1학년 풀이 기록 저장 (서버 함수). 기록은 본인 아이의 것만 저장됩니다 (RLS).
 */

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/types/game";

export interface EarlyAnswerInput {
  problemId: string | null;
  kind: string;
  input: string;
  correct: boolean;
  elapsedMs: number;
}

const KINDS = ["count_number", "alphabet_pick", "english_number", "color_animal", "add", "sub", "next"];

export async function recordEarlyAction(data: EarlyAnswerInput): Promise<ActionResult<null>> {
  if (
    typeof data.kind !== "string" ||
    !KINDS.includes(data.kind) ||
    typeof data.correct !== "boolean" ||
    typeof data.input !== "string" ||
    !Number.isFinite(data.elapsedMs)
  ) {
    return { ok: false, error: "잘못된 요청이에요." };
  }
  try {
    const supabase = await createSupabaseServerClient();
    const { data: child, error: childError } = await supabase.from("children").select("id").limit(1).maybeSingle();
    if (childError || !child) return { ok: false, error: "아이 정보를 찾지 못했어요." };

    const { error } = await supabase.from("early_attempts").insert({
      child_id: child.id,
      problem_id: data.problemId,
      kind: data.kind,
      input: data.input.slice(0, 40),
      correct: data.correct,
      elapsed_ms: Math.max(0, Math.min(600000, Math.round(data.elapsedMs))),
    });
    if (error) throw error;
    return { ok: true, data: null };
  } catch (error) {
    console.error("[early] record failed:", error instanceof Error ? error.message : error);
    return { ok: false, error: "기록을 저장하지 못했어요." };
  }
}
