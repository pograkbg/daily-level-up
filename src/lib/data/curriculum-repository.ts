/**
 * 교육과정 단원과 난이도 규칙 읽기 (서버 전용). 0028 마이그레이션의 테이블을 읽습니다.
 */

import type { CurriculumKind, CurriculumParams } from "@/lib/game/curriculum";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface CurriculumUnit {
  id: number;
  grade: number;
  semester: number;
  ord: number;
  unit: string;
  field: string;
  kind: CurriculumKind;
}

/** 아이 학년의 단원 목록 (1학기, 2학기 순서) */
export async function listUnits(grade: number): Promise<CurriculumUnit[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("curriculum_units")
    .select("id, grade, semester, ord, unit, field, kind")
    .eq("grade", grade)
    .order("semester", { ascending: true })
    .order("ord", { ascending: true });
  if (error) throw error;
  return (data ?? []) as CurriculumUnit[];
}

export async function getUnit(id: number): Promise<CurriculumUnit | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("curriculum_units")
    .select("id, grade, semester, ord, unit, field, kind")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return (data as CurriculumUnit | null) ?? null;
}

/** 문제 종류와 난이도(1~5)에 맞는 숫자 규칙 */
export async function getDifficultyParams(kind: CurriculumKind, difficulty: number): Promise<CurriculumParams | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("difficulty_params")
    .select("params")
    .eq("kind", kind)
    .eq("difficulty", difficulty)
    .maybeSingle();
  if (error) throw error;
  return (data?.params as CurriculumParams | undefined) ?? null;
}
