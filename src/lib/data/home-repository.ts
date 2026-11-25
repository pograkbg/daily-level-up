/**
 * 홈 화면 데이터 출처 선택기.
 *
 * - DATA_SOURCE=mock     → 테스트용 가짜 데이터 (mock-store.ts)
 * - DATA_SOURCE=supabase → 실제 DB (3단계에서 구현)
 *
 * 화면 코드(page.tsx)는 어떤 출처인지 몰라도 되도록 이 함수만 호출합니다.
 */

import type { HomeData } from "@/types/game";
import { mockGetHomeData } from "./mock-store";
import { getSupabaseHomeData } from "./supabase-home-repository";

export async function getHomeData(): Promise<HomeData> {
  if (process.env.DATA_SOURCE === "supabase") {
    return getSupabaseHomeData();
  }
  return mockGetHomeData();
}
