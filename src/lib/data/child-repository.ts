/**
 * 아이 프로필 데이터 출처 선택기.
 * - DATA_SOURCE=mock     → 항상 아이가 있다고 봅니다 (테스트 데이터).
 * - DATA_SOURCE=supabase → DB에서 확인합니다.
 */

import type { ActionResult, InsectId } from "@/types/game";
import { supabaseCreateChild, supabaseHasChild } from "./supabase-child-repository";

export interface ChildSetupInput {
  nickname: string;
  grade: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  characterId: InsectId;
}

function isSupabaseSource(): boolean {
  return process.env.DATA_SOURCE === "supabase";
}

export async function hasChildProfile(): Promise<boolean> {
  return isSupabaseSource() ? supabaseHasChild() : true;
}

export async function createChildProfile(input: ChildSetupInput): Promise<ActionResult<null>> {
  if (!isSupabaseSource()) {
    return { ok: true, data: null };
  }
  return supabaseCreateChild(input);
}
