"use client";

import { useActionState } from "react";
import { updatePasswordAction, type ResetState } from "@/app/reset-password/actions";
import { buttonClassName } from "@/components/ui/Button";

const INITIAL: ResetState = { error: null };

const INPUT_CLASS =
  "min-h-14 w-full rounded-2xl border-2 border-ink/10 bg-white px-4 text-lg text-ink outline-none focus:border-primary";

/** 새 비밀번호 입력 폼 (두 번 입력해서 확인) */
export function ResetPasswordForm() {
  const [state, formAction, pending] = useActionState(updatePasswordAction, INITIAL);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <label className="flex flex-col gap-2 text-base font-bold text-ink">
        새 비밀번호 (6자리 이상)
        <input name="password" type="password" required minLength={6} autoComplete="new-password" className={INPUT_CLASS} />
      </label>
      <label className="flex flex-col gap-2 text-base font-bold text-ink">
        새 비밀번호 한 번 더
        <input name="confirm" type="password" required minLength={6} autoComplete="new-password" className={INPUT_CLASS} />
      </label>

      {state.error && (
        <p role="alert" className="font-bold text-red-500">
          {state.error}
        </p>
      )}

      <button type="submit" disabled={pending} className={buttonClassName()}>
        ✅ 새 비밀번호 저장
      </button>
    </form>
  );
}
