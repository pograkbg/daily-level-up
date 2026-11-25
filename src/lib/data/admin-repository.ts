/**
 * 관리자 기능 (서버 전용). DB 함수(0013)가 관리자인지 한 번 더 확인합니다.
 * DATA_SOURCE=mock 에서는 관리자 기능을 쓸 수 없습니다.
 */

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/types/game";

export interface AccountRow {
  userId: string;
  email: string;
  approved: boolean;
  isAdmin: boolean;
  suspended: boolean;
  createdAt: string;
}

export function isSupabaseSourceForAdmin(): boolean {
  return process.env.DATA_SOURCE === "supabase";
}

/** 지금 로그인한 계정의 이메일 (화면에 "누구로 로그인했는지" 보여 줄 때 씁니다) */
export async function currentLoginEmail(): Promise<string | null> {
  if (!isSupabaseSourceForAdmin()) return null;
  try {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase.auth.getUser();
    return data.user?.email ?? null;
  } catch {
    return null;
  }
}

/** 지금 로그인한 사람이 관리자인지 */
export async function isCurrentAdmin(): Promise<boolean> {
  if (!isSupabaseSourceForAdmin()) return false;
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.rpc("is_admin");
    if (error) return false;
    return data === true;
  } catch {
    return false;
  }
}

/** 계정 목록 (관리자만) */
export async function listAccounts(): Promise<ActionResult<AccountRow[]>> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.rpc("admin_list_accounts");
    if (error) {
      return { ok: false, error: error.message === "not_admin" ? "관리자만 볼 수 있어요." : "목록을 불러오지 못했어요." };
    }
    const rows = (data ?? []) as {
      user_id: string;
      email: string;
      approved: boolean;
      is_admin: boolean;
      suspended: boolean;
      created_at: string;
    }[];
    return {
      ok: true,
      data: rows.map((r) => ({
        userId: r.user_id,
        email: r.email,
        approved: r.approved,
        isAdmin: r.is_admin,
        suspended: r.suspended,
        createdAt: r.created_at,
      })),
    };
  } catch {
    return { ok: false, error: "목록을 불러오지 못했어요." };
  }
}

export interface ChildRow {
  childId: string;
  nickname: string;
  grade: number;
  parentEmail: string;
  mathLevels: Record<"+" | "-" | "×" | "÷", number>;
  englishMaxLevel: number;
  totalXp: number;
}

/** 아이 목록 (관리자만) */
export async function listChildren(): Promise<ActionResult<ChildRow[]>> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.rpc("admin_list_children");
    // 보안: DB 오류 내용은 화면에 보이지 않게 하고, 서버 기록에만 남깁니다.
    if (error) {
      console.error("[admin] listChildren failed:", error.code ?? "");
      return { ok: false, error: "아이 목록을 불러오지 못했어요." };
    }
    const rows = (data ?? []) as {
      child_id: string;
      nickname: string;
      grade: number;
      parent_email: string;
      study_progress: Record<string, { level: number }>;
      english_max_level: number;
      total_xp: number;
    }[];
    return {
      ok: true,
      data: rows.map((r) => ({
        childId: r.child_id,
        nickname: r.nickname,
        grade: r.grade,
        parentEmail: r.parent_email,
        mathLevels: {
          "+": r.study_progress?.["+"]?.level ?? 1,
          "-": r.study_progress?.["-"]?.level ?? 1,
          "×": r.study_progress?.["×"]?.level ?? 1,
          "÷": r.study_progress?.["÷"]?.level ?? 1,
        },
        englishMaxLevel: r.english_max_level,
        totalXp: r.total_xp,
      })),
    };
  } catch {
    return { ok: false, error: "아이 목록을 불러오지 못했어요." };
  }
}

function adminErrorMessage(message: string): string {
  if (message === "not_admin") return "관리자만 바꿀 수 있어요.";
  if (message === "invalid_level") return "레벨 값이 올바르지 않아요.";
  if (message === "child_not_found") return "아이를 찾을 수 없어요.";
  return "저장하지 못했어요.";
}

/** 연산별 레벨 수동 설정 (관리자만) */
export async function setChildMathLevels(
  childId: string,
  levels: Record<string, number>,
): Promise<ActionResult<null>> {
  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.rpc("admin_set_math_levels", { p_child_id: childId, p_levels: levels });
    if (error) return { ok: false, error: adminErrorMessage(error.message) };
    return { ok: true, data: null };
  } catch {
    return { ok: false, error: "저장하지 못했어요." };
  }
}

/** 영어 열린 최고 레벨 수동 설정 (관리자만) */
export async function setChildEnglishMax(childId: string, level: number): Promise<ActionResult<null>> {
  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.rpc("admin_set_english_max", { p_child_id: childId, p_level: level });
    if (error) return { ok: false, error: adminErrorMessage(error.message) };
    return { ok: true, data: null };
  } catch {
    return { ok: false, error: "저장하지 못했어요." };
  }
}

/** 한 아이의 모든 학습 데이터 초기화 (관리자만) */
export async function resetChildData(childId: string): Promise<ActionResult<null>> {
  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.rpc("admin_reset_child", { p_child_id: childId });
    if (error) return { ok: false, error: adminErrorMessage(error.message) };
    return { ok: true, data: null };
  } catch {
    return { ok: false, error: "초기화하지 못했어요." };
  }
}

/** 승인 또는 승인 취소 (관리자만) */
/** 계정 중지 또는 중지 해제 (관리자만). 데이터는 그대로 둡니다. */
export async function setAccountSuspended(userId: string, suspended: boolean): Promise<ActionResult<null>> {
  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.rpc("admin_set_suspended", { p_user_id: userId, p_suspended: suspended });
    if (error) {
      if (error.message.includes("cannot_suspend_self")) return { ok: false, error: "본인 계정은 중지할 수 없어요." };
      if (error.message.includes("cannot_suspend_admin")) return { ok: false, error: "관리자 계정은 중지할 수 없어요." };
      if (error.message.includes("not_admin")) return { ok: false, error: "관리자만 바꿀 수 있어요." };
      return { ok: false, error: "저장하지 못했어요." };
    }
    return { ok: true, data: null };
  } catch {
    return { ok: false, error: "저장하지 못했어요." };
  }
}

/** 중지된 계정을 완전 삭제 (관리자만). 아이 데이터와 계정이 모두 지워지고 되돌릴 수 없습니다. */
export async function deleteAccount(userId: string): Promise<ActionResult<null>> {
  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.rpc("admin_delete_account", { p_user_id: userId });
    if (error) {
      if (error.message.includes("must_suspend_first")) return { ok: false, error: "먼저 계정을 중지한 뒤 삭제할 수 있어요." };
      if (error.message.includes("cannot_delete_self")) return { ok: false, error: "본인 계정은 삭제할 수 없어요." };
      if (error.message.includes("cannot_delete_admin")) return { ok: false, error: "관리자 계정은 삭제할 수 없어요." };
      if (error.message.includes("not_admin")) return { ok: false, error: "관리자만 삭제할 수 있어요." };
      return { ok: false, error: "삭제하지 못했어요." };
    }
    return { ok: true, data: null };
  } catch {
    return { ok: false, error: "삭제하지 못했어요." };
  }
}

export async function setAccountApproval(userId: string, approved: boolean): Promise<ActionResult<null>> {
  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.rpc("admin_set_approval", { p_user_id: userId, p_approved: approved });
    if (error) {
      if (error.message === "cannot_unapprove_self") return { ok: false, error: "본인 계정은 승인 취소할 수 없어요." };
      if (error.message === "not_admin") return { ok: false, error: "관리자만 바꿀 수 있어요." };
      return { ok: false, error: "저장하지 못했어요." };
    }
    return { ok: true, data: null };
  } catch {
    return { ok: false, error: "저장하지 못했어요." };
  }
}
