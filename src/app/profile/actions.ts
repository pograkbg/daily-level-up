"use server";

import { revalidatePath } from "next/cache";
import { changeChildNickname } from "@/lib/data/nickname-repository";
import type { ActionResult } from "@/types/game";

/** 아이 이름 바꾸기 버튼 */
export async function renameChildAction(nickname: string): Promise<ActionResult<null>> {
  if (typeof nickname !== "string") {
    return { ok: false, error: "잘못된 요청이에요." };
  }
  const result = await changeChildNickname(nickname);
  if (result.ok) revalidatePath("/");
  return result;
}
