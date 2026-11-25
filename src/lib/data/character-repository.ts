/**
 * 캐릭터 성장 데이터 출처 선택기 (성충 후 새 친구 고르기)
 */

import type { ActionResult } from "@/types/game";
import type { InsectId } from "@/lib/game/insects";
import { mockChooseCharacter } from "./mock-store";
import { supabaseChooseCharacter } from "./supabase-character-repository";

export async function chooseCharacter(insect: InsectId): Promise<ActionResult<null>> {
  return process.env.DATA_SOURCE === "supabase" ? supabaseChooseCharacter(insect) : mockChooseCharacter(insect);
}
