/**
 * 아이 이름 바꾸기 (서버 전용). DATA_SOURCE 에 따라 DB 또는 개발용 데이터를 씁니다.
 */

import { getState } from "@/lib/data/mock-store";
import { getCurrentChild } from "@/lib/data/supabase-mission-repository";
import type { ActionResult } from "@/types/game";

export async function changeChildNickname(nickname: string): Promise<ActionResult<null>> {
  const name = nickname.trim();
  if (name.length < 1 || name.length > 20) {
    return { ok: false, error: "이름은 1~20글자로 입력해 주세요." };
  }

  if (process.env.DATA_SOURCE !== "supabase") {
    getState().profile.nickname = name;
    return { ok: true, data: null };
  }

  try {
    const { supabase, child } = await getCurrentChild();
    const { error } = await supabase.rpc("set_child_nickname", { p_child_id: child.id, p_nickname: name });
    if (error) {
      return {
        ok: false,
        error: error.message === "invalid_nickname" ? "이름은 1~20글자로 입력해 주세요." : "이름을 바꾸지 못했어요.",
      };
    }
    return { ok: true, data: null };
  } catch {
    return { ok: false, error: "이름을 바꾸지 못했어요." };
  }
}
