"use client";

import { useActionState } from "react";
import { requestResetAction, type ForgotState } from "@/app/login/forgot/actions";
import { buttonClassName } from "@/components/ui/Button";

const INITIAL: ForgotState = { error: null, message: null };

const INPUT_CLASS =
  "min-h-14 w-full rounded-2xl border-2 border-ink/10 bg-white px-4 text-lg text-ink outline-none focus:border-primary";

/** 재설정 메일 주소 입력 폼 */
export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(requestResetAction, INITIAL);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <label className="flex flex-col gap-2 text-base font-bold text-ink">
        가입할 때 쓴 이메일
        <input name="email" type="email" required autoComplete="email" className={INPUT_CLASS} />
      </label>

      {state.error && (
        <p role="alert" className="font-bold text-red-500">
          {state.error}
        </p>
      )}
      {state.message && <p className="font-bold text-primary-dark">{state.message}</p>}

      <button type="submit" disabled={pending} className={buttonClassName()}>
        📧 재설정 메일 보내기
      </button>
    </form>
  );
}
