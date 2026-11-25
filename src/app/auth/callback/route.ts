/**
 * 메일 링크 콜백.
 * 비밀번호 재설정 메일의 링크를 누르면 이 주소로 돌아오며 ?code=... 가 붙습니다.
 * 코드를 로그인 세션으로 바꾼 뒤 next 주소(재설정 화면)로 보냅니다.
 */

import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const nextParam = searchParams.get("next") ?? "/";
  // 바깥 주소로 튕겨 나가지 않도록 같은 사이트 경로만 허용합니다.
  const next = nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/";

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=reset_link", origin));
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    console.error("[auth] code exchange failed:", error.message);
    return NextResponse.redirect(new URL("/login?error=reset_link", origin));
  }

  return NextResponse.redirect(new URL(next, origin));
}
