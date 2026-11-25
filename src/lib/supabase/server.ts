/**
 * Supabase 서버 클라이언트 (서버 컴포넌트 · 서버 함수에서만 사용)
 *
 * - 키는 .env.local 의 환경변수에서만 읽습니다. 코드에 직접 쓰지 않습니다.
 * - anon 키는 공개해도 되는 키입니다. 데이터 보호는 RLS 정책이 담당합니다.
 * - service_role 키는 절대 쓰지 않습니다 (모든 권한을 우회하므로 노출되면 위험).
 */

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createSupabaseServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error(".env.local 에 NEXT_PUBLIC_SUPABASE_URL 과 NEXT_PUBLIC_SUPABASE_ANON_KEY 를 입력하세요.");
  }

  const cookieStore = await cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // 서버 컴포넌트에서는 쿠키를 쓸 수 없습니다. 읽기만 되면 충분합니다.
        }
      },
    },
  });
}
