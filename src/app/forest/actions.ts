"use server";

/** 배움의 숲 · 새 친구 고르기 서버 함수 */

import { chooseCharacter } from "@/lib/data/character-repository";
import { INSECT_IDS, type InsectId } from "@/lib/game/insects";
import type { ActionResult } from "@/types/game";

export async function chooseCharacterAction(insect: string): Promise<ActionResult<null>> {
  if (typeof insect !== "string" || !INSECT_IDS.includes(insect as InsectId)) {
    return { ok: false, error: "없는 곤충이에요." };
  }
  return chooseCharacter(insect as InsectId);
}
