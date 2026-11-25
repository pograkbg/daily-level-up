/**
 * 친구 랭킹 (서버 전용). DB 함수 friend_ranking(0020)을 부릅니다.
 * 승인된 계정의 아이만 나오고, 계정명은 가려서 보여 줍니다.
 */

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/types/game";

export interface FriendRow {
  childId: string;
  nickname: string;
  characterId: string;
  charXp: number;
  totalStudyMs: number;
  accountMask: string;
}

export async function listFriendRanking(): Promise<ActionResult<FriendRow[]>> {
  if (process.env.DATA_SOURCE !== "supabase") {
    return { ok: true, data: [] };
  }
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.rpc("friend_ranking");
    if (error) return { ok: false, error: "친구 목록을 불러오지 못했어요." };
    const rows = (data ?? []) as {
      child_id: string;
      nickname: string;
      character_id: string;
      char_xp: number;
      total_study_ms: number;
      account_mask: string;
    }[];
    return {
      ok: true,
      data: rows.map((r) => ({
        childId: r.child_id,
        nickname: r.nickname,
        characterId: r.character_id,
        charXp: r.char_xp,
        totalStudyMs: Number(r.total_study_ms),
        accountMask: r.account_mask,
      })),
    };
  } catch {
    return { ok: false, error: "친구 목록을 불러오지 못했어요." };
  }
}
