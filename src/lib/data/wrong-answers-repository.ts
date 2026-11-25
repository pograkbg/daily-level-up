/**
 * 틀린 문제 목록 (서버 전용). DATA_SOURCE 에 따라 DB 또는 개발용 데이터를 씁니다.
 */

import { mockWrongEnglish } from "@/lib/data/mock-english";
import { mockWrongMath } from "@/lib/data/mock-store";
import { getCurrentChild } from "@/lib/data/supabase-mission-repository";
import type { WrongMathRow } from "@/lib/game/wrong-analysis";
import type { MathOperator } from "@/lib/game/math-problems";

export interface WrongMathItem extends WrongMathRow {
  missionDate: string;
  left: number;
  right: number;
}

export interface WrongEnglishItem {
  itemId: string;
  word: string;
  correctMeaning: string;
  myMeaning: string;
  exampleEn: string;
  exampleKo: string;
}

function isSupabaseSource(): boolean {
  return process.env.DATA_SOURCE === "supabase";
}

export async function getWrongMath(limit = 30): Promise<WrongMathItem[]> {
  if (!isSupabaseSource()) {
    return mockWrongMath(limit).map((r) => ({
      missionDate: r.missionDate,
      operator: r.operator,
      leftOperand: r.left,
      rightOperand: r.right,
      left: r.left,
      right: r.right,
      correctAnswer: r.correctAnswer,
      myAnswer: r.myAnswer,
    }));
  }
  const { supabase, child } = await getCurrentChild();
  const { data, error } = await supabase.rpc("get_wrong_math", { p_child_id: child.id, p_limit: limit });
  if (error) throw error;
  const rows = (data ?? []) as {
    mission_date: string;
    left_operand: number;
    right_operand: number;
    operator: MathOperator;
    correct_answer: number;
    my_answer: number;
  }[];
  return rows.map((r) => ({
    missionDate: r.mission_date,
    operator: r.operator,
    leftOperand: r.left_operand,
    rightOperand: r.right_operand,
    left: r.left_operand,
    right: r.right_operand,
    correctAnswer: r.correct_answer,
    myAnswer: r.my_answer,
  }));
}

export async function getWrongEnglish(limit = 30): Promise<WrongEnglishItem[]> {
  if (!isSupabaseSource()) {
    return mockWrongEnglish(limit);
  }
  const { supabase, child } = await getCurrentChild();
  const { data, error } = await supabase.rpc("get_wrong_english", { p_child_id: child.id, p_limit: limit });
  if (error) throw error;
  const rows = (data ?? []) as {
    item_id: string;
    word: string;
    correct_meaning: string;
    my_meaning: string | null;
    example_en: string;
    example_ko: string;
  }[];
  return rows.map((r) => ({
    itemId: r.item_id,
    word: r.word,
    correctMeaning: r.correct_meaning,
    myMeaning: r.my_meaning ?? "",
    exampleEn: r.example_en,
    exampleKo: r.example_ko,
  }));
}
