/**
 * [실제 DB] 아이 프로필 생성·확인.
 * RLS 정책 children_owner_insert 때문에 본인(부모) 계정으로만 추가됩니다.
 */

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/types/game";
import type { ChildSetupInput } from "./child-repository";

async function requireUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("AUTH_REQUIRED");
  return { supabase, user };
}

export async function supabaseHasChild(): Promise<boolean> {
  const { supabase } = await requireUser();
  const { count, error } = await supabase
    .from("children")
    .select("id", { count: "exact", head: true });
  if (error) throw error;
  return (count ?? 0) > 0;
}

export async function supabaseCreateChild(input: ChildSetupInput): Promise<ActionResult<null>> {
  try {
    const { supabase, user } = await requireUser();
    const { error } = await supabase.from("children").insert({
      parent_id: user.id,
      nickname: input.nickname,
      grade: input.grade,
      character_id: input.characterId,
    });
    if (error) throw error;
    return { ok: true, data: null };
  } catch (error) {
    console.error("[supabase-child]", error instanceof Error ? error.message : error);
    return { ok: false, error: "아이 프로필을 만들지 못했어요. 다시 시도해 주세요." };
  }
}
