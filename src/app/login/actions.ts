"use server";

/**
 * 부모 로그인 · 로그아웃 서버 함수. 회원가입은 /signup 에서 따로 합니다.
 * 비밀번호는 Supabase Auth 가 안전하게 처리합니다. 이 코드는 값을 저장하거나 기록하지 않습니다.
 */

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface AuthState {
  error: string | null;
  message: string | null;
}

export async function authAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  // 한글 입력 상태에서 나온 전각 문자(＠, 。 등)를 일반 문자로 바꿉니다.
  const email = String(formData.get("email") ?? "")
    .normalize("NFKC")
    .trim();
  const password = String(formData.get("password") ?? "");

  if (!email.includes("@") || email.length > 254) {
    return { error: "이메일 형식을 확인해 주세요.", message: null };
  }
  if (password.length < 6) {
    return { error: "비밀번호는 6자리 이상이어야 해요.", message: null };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    console.error("[auth] signin failed:", error.message, error.code ?? "");
    if (error.code === "email_not_confirmed") {
      return {
        error: "이메일 확인이 아직 끝나지 않았어요. 가입 메일의 링크를 눌러 주세요.",
        message: null,
      };
    }
    if (error.code === "invalid_credentials") {
      return { error: "이메일 또는 비밀번호가 맞지 않아요.", message: null };
    }
    return { error: `로그인에 실패했어요: ${error.message}`, message: null };
  }

  redirect("/");
}

export async function signOutAction() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  // 승인 확인 캐시(proxy.ts)도 함께 지웁니다.
  (await cookies()).delete("dlu_approved");
  redirect("/login");
}
