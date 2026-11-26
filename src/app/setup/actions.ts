"use server";

/** 아이 프로필 만들기 서버 함수. 입력값은 서버에서 다시 확인합니다. */

import { redirect } from "next/navigation";
import { createChildProfile } from "@/lib/data/child-repository";
import { INSECT_IDS, type InsectId } from "@/lib/game/insects";

export interface SetupState {
  error: string | null;
}

export async function createChildAction(_prev: SetupState, formData: FormData): Promise<SetupState> {
  const nickname = String(formData.get("nickname") ?? "").trim();
  const grade = Number(formData.get("grade"));
  const characterId = String(formData.get("characterId") ?? "") as InsectId;

  if (nickname.length < 1 || nickname.length > 20) {
    return { error: "이름은 1~20글자로 입력해 주세요." };
  }
  if (![0, 1, 2, 3, 4, 5, 6].includes(grade)) {
    return { error: "학년을 확인해 주세요." };
  }
  if (!INSECT_IDS.includes(characterId)) {
    return { error: "곤충 친구를 골라 주세요." };
  }

  const result = await createChildProfile({
    nickname,
    grade: grade as 0 | 1 | 2 | 3 | 4 | 5 | 6,
    characterId,
  });
  if (!result.ok) {
    return { error: result.error };
  }

  redirect("/");
}
