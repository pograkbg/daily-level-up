"use server";

/** 비밀번호 재설정 메일 보내기 */

import { headers } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface ForgotState {
  error: string | null;
  message: string | null;
}

export async function requestResetAction(_prev: ForgotState, formData: FormData): Promise<ForgotState> {
  const email = String(formData.get("email") ?? "")
    .normalize("NFKC")
    .trim();

  if (!email.includes("@") || email.length > 254) {
    return { error: "이메일 형식을 확인해 주세요.", message: null };
  }

  // 메일 링크가 돌아올 주소를 현재 접속 주소 기준으로 만듭니다.
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const redirectTo = `${proto}://${host}/auth/callback?next=/reset-password`;

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
  if (error) {
    console.error("[auth] reset email failed:", error.message, error.code ?? "");
    // 보안상 실패 이유를 자세히 알려주지 않습니다. (존재하지 않는 이메일도 같은 문구)
  }

  return {
    error: null,
    message: "입력한 주소로 재설정 메일을 보냈어요. 메일의 링크를 눌러 주세요. (메일이 안 보이면 스팸함을 확인하세요)",
  };
}
