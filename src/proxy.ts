/**
 * 요청 전 로그인 확인 (Next.js 16의 proxy 파일).
 *
 * - DATA_SOURCE=supabase 일 때만 동작합니다.
 * - 로그인이 없으면 /login 으로 보내고, 로그인한 상태로 /login 에 가면 홈으로 보냅니다.
 * - 로그인했지만 관리자 승인(account_approvals.approved)이 없으면 /pending 으로 보냅니다.
 * - 속도: 매 요청마다 Supabase 서버를 부르지 않도록, 승인 확인 결과를 서명된 짧은 쿠키(5분)에 담아 둡니다.
 *   APPROVAL_COOKIE_SECRET 이 없으면 이 캐시를 쓰지 않고 매번 확인합니다.
 * - 이것은 "편의용 확인"입니다. 실제 데이터 보호는 DB의 RLS 정책이 합니다.
 */

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const APPROVAL_COOKIE = "dlu_approved";
const APPROVAL_TTL_SEC = 300;
const encoder = new TextEncoder();

/** 로그인 확인이 필요 없는 경로: 인증 콜백(재설정 메일 링크), 개인정보 처리방침 */
function isPublicPath(pathname: string): boolean {
  return pathname.startsWith("/auth/") || pathname.startsWith("/privacy");
}

async function hmacKey(): Promise<CryptoKey | null> {
  const secret = process.env.APPROVAL_COOKIE_SECRET;
  if (!secret || secret.length < 16) return null;
  return crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, [
    "sign",
  ]);
}

async function signature(key: CryptoKey, data: string): Promise<string> {
  const buf = await crypto.subtle.sign("HMAC", key, encoder.encode(data));
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("");
}

/** 쿠키 값: "사용자ID.만료시각(ms).서명". 사용자 ID가 맞고 서명이 맞고 만료 전이면 승인된 것으로 봅니다. */
async function readApprovalCookie(request: NextRequest, userId: string): Promise<boolean> {
  const key = await hmacKey();
  const raw = request.cookies.get(APPROVAL_COOKIE)?.value;
  if (!key || !raw) return false;
  const [id, expText, sig] = raw.split(".");
  if (id !== userId || !sig) return false;
  const exp = Number(expText);
  if (!Number.isFinite(exp) || exp < Date.now()) return false;
  return (await signature(key, `${id}.${expText}`)) === sig;
}

async function makeApprovalCookie(userId: string): Promise<string | null> {
  const key = await hmacKey();
  if (!key) return null;
  const expText = String(Date.now() + APPROVAL_TTL_SEC * 1000);
  return `${userId}.${expText}.${await signature(key, `${userId}.${expText}`)}`;
}

export async function proxy(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (process.env.DATA_SOURCE !== "supabase" || !url || !anonKey) {
    return NextResponse.next();
  }

  const pathname = request.nextUrl.pathname;
  // 공개 경로는 Supabase를 부르지 않고 바로 통과합니다.
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        // 세션이 갱신되면 새 쿠키를 요청과 응답 양쪽에 넣습니다.
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const isLoginPage = pathname.startsWith("/login");
  const isSignupPage = pathname.startsWith("/signup");
  const isPendingPage = pathname.startsWith("/pending");
  const isSuspendedPage = pathname.startsWith("/suspended");

  // 세션 쿠키만 읽어 봅니다 (Supabase 서버 호출 없음). 세션이 없으면 바로 로그인 화면으로 보냅니다.
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    return isLoginPage || isSignupPage ? response : NextResponse.redirect(new URL("/login", request.url));
  }

  let approved: boolean;
  let suspended = false;
  const userId = session.user.id;

  if (await readApprovalCookie(request, userId)) {
    // 최근 5분 안에 승인이 확인된 계정: DB 조회를 건너뜁니다.
    approved = true;
  } else {
    // 토큰이 진짜인지 Supabase 서버에 확인한 뒤 승인 상태를 봅니다.
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return isLoginPage || isSignupPage ? response : NextResponse.redirect(new URL("/login", request.url));
    }
    const { data: approval } = await supabase
      .from("account_approvals")
      .select("approved, suspended")
      .eq("user_id", user.id)
      .maybeSingle();
    approved = approval?.approved === true;
    suspended = approval?.suspended === true;

    // 정상 승인된 계정만 캐시합니다. 중지·미승인 계정은 매번 확인합니다.
    if (approved && !suspended) {
      const value = await makeApprovalCookie(user.id);
      if (value) {
        response.cookies.set(APPROVAL_COOKIE, value, {
          httpOnly: true,
          sameSite: "lax",
          secure: process.env.NODE_ENV === "production",
          path: "/",
          maxAge: APPROVAL_TTL_SEC,
        });
      }
    }
  }

  // 관리자가 중지한 계정은 중지 안내 화면만 봅니다.
  if (suspended) {
    return isSuspendedPage ? response : NextResponse.redirect(new URL("/suspended", request.url));
  }
  if (isSuspendedPage) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (!approved) {
    return isPendingPage ? response : NextResponse.redirect(new URL("/pending", request.url));
  }
  if (isLoginPage || isSignupPage || isPendingPage) {
    return NextResponse.redirect(new URL("/", request.url));
  }
  return response;
}

export const config = {
  // 이미지, 정적 파일은 검사하지 않습니다.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
