/**
 * Supabase 브라우저 클라이언트 (화면에서 2단계 인증 코드를 주고받을 때만 씁니다).
 * 키는 공개해도 되는 anon 키입니다. 데이터 보호는 RLS와 DB 함수 권한이 담당합니다.
 */

import { createBrowserClient } from "@supabase/ssr";

export function createSupabaseBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error("환경 설정이 없어요.");
  }
  return createBrowserClient(url, anonKey);
}
