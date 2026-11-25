"use server";

/** 새 비밀번호 저장 (메일 링크로 로그인된 상태에서만 동작) */

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface ResetState {
  error: string | null;
}

export async function updatePasswordAction(_prev: ResetState, formData: FormData): Promise<ResetState> {
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (password.length < 6) {
    return { error: "비밀번호는 6자리 이상이어야 해요." };
  }
  if (password !== confirm) {
    return { error: "두 비밀번호가 서로 달라요. 다시 입력해 주세요." };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "재설정 링크가 만료됐어요. 로그인 화면에서 다시 요청해 주세요." };
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    console.error("[auth] update password failed:", error.message, error.code ?? "");
    return { error: `비밀번호를 바꾸지 못했어요: ${error.message}` };
  }

  redirect("/");
}
