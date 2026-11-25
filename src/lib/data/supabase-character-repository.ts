/**
 * [실제 DB] 새 친구 고르기 (성충 후). 규칙은 DB 함수 choose_new_character(0010)가 지킵니다.
 */

import { getCurrentChild, toActionError } from "@/lib/data/supabase-mission-repository";
import type { InsectId } from "@/lib/game/insects";
import type { ActionResult } from "@/types/game";

export async function supabaseChooseCharacter(insect: InsectId): Promise<ActionResult<null>> {
  try {
    const { supabase, child } = await getCurrentChild();
    const { error } = await supabase.rpc("choose_new_character", {
      p_child_id: child.id,
      p_insect: insect,
    });
    if (error) throw error;
    return { ok: true, data: null };
  } catch (error) {
    return toActionError(error);
  }
}
