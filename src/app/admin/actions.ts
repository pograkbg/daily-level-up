"use server";

import { revalidatePath } from "next/cache";
import {
  deleteAccount,
  listAccounts,
  resetChildData,
  setAccountApproval,
  setAccountSuspended,
  setChildEnglishMax,
  setChildMathLevels,
} from "@/lib/data/admin-repository";
import { sendMail, siteUrl } from "@/lib/mail/send";
import { approvalMail } from "@/lib/mail/templates";
import type { ActionResult } from "@/types/game";

/** 계정 중지 또는 중지 해제 */
export async function setSuspendedAction(userId: string, suspended: boolean): Promise<ActionResult<null>> {
  if (typeof userId !== "string" || typeof suspended !== "boolean") {
    return { ok: false, error: "잘못된 요청이에요." };
  }
  const result = await setAccountSuspended(userId, suspended);
  if (result.ok) revalidatePath("/admin");
  return result;
}

/** 중지된 계정 완전 삭제. 확인 문구가 "삭제"일 때만 실행합니다. */
export async function deleteAccountAction(userId: string, confirmText: string): Promise<ActionResult<null>> {
  if (typeof userId !== "string") return { ok: false, error: "잘못된 요청이에요." };
  if (confirmText !== "삭제") return { ok: false, error: "확인 문구를 정확히 \"삭제\"라고 입력해 주세요." };
  const result = await deleteAccount(userId);
  if (result.ok) revalidatePath("/admin");
  return result;
}

const OPS = ["+", "-", "×", "÷"] as const;

/** 아이의 연산별 레벨 수동 설정 (1~15) */
export async function setMathLevelsAction(
  childId: string,
  levels: Record<string, number>,
): Promise<ActionResult<null>> {
  if (typeof childId !== "string") return { ok: false, error: "잘못된 요청이에요." };
  const clean: Record<string, number> = {};
  for (const op of OPS) {
    const lv = levels?.[op];
    if (!Number.isInteger(lv) || lv < 1 || lv > 15) return { ok: false, error: "레벨은 1~15 사이로 골라 주세요." };
    clean[op] = lv;
  }
  const result = await setChildMathLevels(childId, clean);
  if (result.ok) revalidatePath("/admin");
  return result;
}

/** 아이의 영어 열린 최고 레벨 수동 설정 (1~3) */
export async function setEnglishMaxAction(childId: string, level: number): Promise<ActionResult<null>> {
  if (typeof childId !== "string" || !Number.isInteger(level) || level < 1 || level > 3) {
    return { ok: false, error: "레벨은 1~3 중에서 골라 주세요." };
  }
  const result = await setChildEnglishMax(childId, level);
  if (result.ok) revalidatePath("/admin");
  return result;
}

/** 한 아이의 모든 학습 데이터 초기화. 확인 문구가 "초기화"일 때만 실행합니다. */
export async function resetChildAction(childId: string, confirmText: string): Promise<ActionResult<null>> {
  if (typeof childId !== "string") return { ok: false, error: "잘못된 요청이에요." };
  if (confirmText !== "초기화") return { ok: false, error: "확인 문구를 정확히 \"초기화\"라고 입력해 주세요." };
  const result = await resetChildData(childId);
  if (result.ok) revalidatePath("/admin");
  return result;
}

/** 관리자 화면의 승인·승인 취소 버튼. 처음 승인되는 순간에만 신청자에게 승인 메일을 보냅니다. */
export async function setApprovalAction(userId: string, approved: boolean): Promise<ActionResult<null>> {
  if (typeof userId !== "string" || typeof approved !== "boolean") {
    return { ok: false, error: "잘못된 요청이에요." };
  }
  // 메일을 보내려면 신청자 이메일과 지금 승인 상태가 필요합니다. 바꾸기 전에 먼저 확인합니다.
  const before = approved ? await listAccounts() : null;
  const target = before?.ok ? before.data.find((a) => a.userId === userId) : undefined;
  if (approved) {
    console.info(
      `[approve] 승인 처리: 계정 목록 ${before?.ok ? "조회 성공" : `조회 실패(${before?.ok === false ? before.error : "-"})`}, 신청자 찾음 ${target ? "예" : "아니오"}, 지금 승인 상태 ${target ? (target.approved ? "승인됨" : "미승인") : "-"}`,
    );
  }

  const result = await setAccountApproval(userId, approved);
  if (!result.ok) {
    console.error(`[approve] 승인 저장 실패: ${result.error}`);
  }
  if (result.ok) {
    revalidatePath("/admin");
    if (target && !target.approved) {
      await sendMail({ to: [target.email], ...approvalMail(`${siteUrl()}/login`) });
    }
  }
  return result;
}
