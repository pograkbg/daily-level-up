"use server";

/**
 * 회원가입 신청 서버 함수.
 * 가입하면 관리자에게 승인 요청 메일을 보냅니다. 승인은 관리자 화면에서 하고, 승인되면 신청자에게 메일을 보냅니다.
 * 비밀번호는 Supabase Auth 가 안전하게 처리합니다. 이 코드는 값을 저장하거나 기록하지 않습니다.
 */

import { redirect } from "next/navigation";
import type { AuthState } from "@/app/login/actions";
import { adminNotifyAddresses, sendMail, siteUrl } from "@/lib/mail/send";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function fail(error: string): AuthState {
  return { error, message: null };
}

export async function signupAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  // 한글 입력 상태에서 나온 전각 문자(＠, 。 등)를 일반 문자로 바꿉니다.
  const email = String(formData.get("email") ?? "")
    .normalize("NFKC")
    .trim();
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  const agreed = formData.get("agree") === "on";

  if (!email.includes("@") || email.length > 254) return fail("이메일 형식을 확인해 주세요.");
  if (password.length < 8) return fail("비밀번호는 8자리 이상이어야 해요.");
  if (password !== confirm) return fail("비밀번호 확인이 서로 맞지 않아요.");
  if (!agreed) return fail("개인정보 처리방침에 동의해 주세요.");

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { privacy_agreed_at: new Date().toISOString() } },
  });
  if (error) {
    console.error("[auth] signup failed:", error.message, error.code ?? "");
    return fail(`회원가입에 실패했어요: ${error.message}`);
  }

  // 이미 가입된 이메일이면 identities 가 비어 있습니다. 그때는 관리자에게 다시 알리지 않습니다.
  const isNewAccount = (data.user?.identities?.length ?? 0) > 0;
  const adminAddresses = adminNotifyAddresses();
  console.info(
    `[signup] 가입 처리: 새 계정 ${isNewAccount ? "예" : "아니오(이미 가입된 이메일)"}, 세션 ${data.session ? "있음" : "없음"}, 관리자 알림 주소 ${adminAddresses.length}개`,
  );
  if (isNewAccount) {
    const when = new Date().toLocaleString("ko-KR", { timeZone: "Asia/Seoul" });
    await sendMail({
      to: adminAddresses,
      subject: "[오늘의 미션] 가입 승인 요청",
      text: `새 가입 신청이 들어왔어요.\n\n신청 이메일: ${email}\n신청 시각: ${when} (한국 시간)\n\n관리자 화면에서 승인해 주세요.\n${siteUrl()}/admin`,
    });
  }

  if (!data.session) {
    // 이메일 확인 메일을 쓰는 설정이면 세션이 바로 생기지 않습니다.
    return {
      error: null,
      message:
        "가입 신청이 끝났어요. 이메일로 온 확인 링크를 눌러 주세요. 관리자가 승인하면 메일로 알려 드려요.",
    };
  }
  // 세션이 생겼어도 관리자 승인 전이라 /pending 화면으로 갑니다.
  redirect("/pending");
}
