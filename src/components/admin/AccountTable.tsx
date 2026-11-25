"use client";

import { useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { deleteAccountAction, setApprovalAction, setSuspendedAction } from "@/app/admin/actions";
import type { AccountRow } from "@/lib/data/admin-repository";

/**
 * 계정 목록.
 * 상태: 승인 대기 → 승인됨 → (중지) → (완전 삭제)
 * 중지는 되돌릴 수 있고, 완전 삭제는 중지된 계정에만 할 수 있습니다.
 */
export function AccountTable({ accounts }: { accounts: AccountRow[] }) {
  const [message, setMessage] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AccountRow | null>(null);
  const [confirmText, setConfirmText] = useState("");
  const [pending, startTransition] = useTransition();

  function run(task: () => Promise<{ ok: boolean; error?: string } & object>, okMessage: string) {
    if (pending) return;
    setMessage(null);
    startTransition(async () => {
      const result = await task();
      setMessage(result.ok ? okMessage : (result.error ?? "처리하지 못했어요."));
    });
  }

  function approve(userId: string, approved: boolean) {
    run(() => setApprovalAction(userId, approved), approved ? "승인했어요." : "승인을 취소했어요.");
  }

  function suspend(userId: string, suspended: boolean) {
    run(() => setSuspendedAction(userId, suspended), suspended ? "중지했어요." : "중지를 해제했어요.");
  }

  function remove() {
    if (!deleteTarget) return;
    const target = deleteTarget;
    startTransition(async () => {
      const result = await deleteAccountAction(target.userId, confirmText);
      if (result.ok) {
        setMessage(`${target.email} 계정을 삭제했어요.`);
        setDeleteTarget(null);
        setConfirmText("");
      } else {
        setMessage(result.error ?? "삭제하지 못했어요.");
      }
    });
  }

  const waiting = accounts.filter((a) => !a.approved && !a.suspended).length;

  return (
    <div className="flex flex-col gap-4">
      <p className="text-base font-bold text-ink-soft">
        승인 대기 {waiting}명 · 전체 {accounts.length}명
      </p>
      {message && (
        <p role="status" className="text-base font-bold text-primary-dark">
          {message}
        </p>
      )}
      <ul className="flex flex-col gap-3">
        {accounts.map((a) => (
          <li
            key={a.userId}
            className="flex flex-col gap-3 rounded-3xl border-4 border-white bg-white p-4 shadow-md sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex min-w-0 flex-col gap-1">
              <span className="truncate text-lg font-extrabold text-ink">{a.email}</span>
              <span className="text-sm font-bold text-ink-soft">
                {a.isAdmin ? "관리자 · " : ""}
                {new Date(a.createdAt).toLocaleDateString("ko-KR")} 가입
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full px-3 py-1 text-sm font-bold ${
                  a.suspended ? "bg-red-100 text-red-600" : a.approved ? "bg-mint text-ink" : "bg-peach text-ink"
                }`}
              >
                {a.suspended ? "중지됨" : a.approved ? "승인됨" : "승인 대기"}
              </span>

              {!a.suspended && !a.isAdmin && (
                a.approved ? (
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => approve(a.userId, false)}
                    className="min-h-12 rounded-2xl bg-ink/10 px-4 font-extrabold text-ink-soft disabled:opacity-50"
                  >
                    승인 취소
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => approve(a.userId, true)}
                    className="min-h-12 rounded-2xl bg-primary px-4 font-extrabold text-white disabled:opacity-50"
                  >
                    승인
                  </button>
                )
              )}

              {!a.isAdmin && !a.suspended && (
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => suspend(a.userId, true)}
                  className="min-h-12 rounded-2xl bg-butter px-4 font-extrabold text-ink disabled:opacity-50"
                >
                  중지
                </button>
              )}

              {a.suspended && (
                <>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => suspend(a.userId, false)}
                    className="min-h-12 rounded-2xl bg-mint px-4 font-extrabold text-ink disabled:opacity-50"
                  >
                    중지 해제
                  </button>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => {
                      setConfirmText("");
                      setDeleteTarget(a);
                    }}
                    className="min-h-12 rounded-2xl bg-red-100 px-4 font-extrabold text-red-600 disabled:opacity-50"
                  >
                    완전 삭제
                  </button>
                </>
              )}
            </div>
          </li>
        ))}
      </ul>

      {deleteTarget &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4"
            role="dialog"
            aria-modal="true"
            aria-label="계정 완전 삭제 확인"
          >
            <div className="flex w-full max-w-sm flex-col gap-3 rounded-[2rem] border-4 border-white bg-white p-6 shadow-2xl">
              <p className="text-lg font-extrabold text-ink">계정 완전 삭제</p>
              <p className="text-sm font-bold text-red-600">
                {deleteTarget.email} 계정과 아이 학습 데이터가 모두 지워져요. 되돌릴 수 없어요. 삭제 후에는 같은 이메일로 다시 가입할 수 있어요.
              </p>
              <input
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="삭제"
                className="min-h-12 rounded-2xl border-2 border-red-200 bg-white px-3 text-base font-bold text-ink"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={pending || confirmText !== "삭제"}
                  onClick={remove}
                  className="min-h-12 flex-1 rounded-2xl bg-red-500 px-4 font-extrabold text-white disabled:opacity-40"
                >
                  완전 삭제
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDeleteTarget(null);
                    setConfirmText("");
                  }}
                  className="min-h-12 flex-1 rounded-2xl bg-ink/10 px-4 font-extrabold text-ink"
                >
                  취소
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
