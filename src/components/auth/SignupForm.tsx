"use client";

import Link from "next/link";
import { useActionState } from "react";
import type { AuthState } from "@/app/login/actions";
import { signupAction } from "@/app/signup/actions";
import { buttonClassName } from "@/components/ui/Button";

const INITIAL_STATE: AuthState = { error: null, message: null };

const INPUT_CLASS =
  "min-h-14 w-full rounded-2xl border-2 border-ink/10 bg-white px-4 text-lg text-ink outline-none focus:border-primary";

/** 부모님용 회원가입 신청 폼. 가입 후 관리자 승인을 받아야 이용할 수 있습니다. */
export function SignupForm() {
  const [state, formAction, pending] = useActionState(signupAction, INITIAL_STATE);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <label className="flex flex-col gap-2 text-base font-bold text-ink">
        이메일
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          className={INPUT_CLASS}
          placeholder="parent@example.com"
        />
      </label>

      <label className="flex flex-col gap-2 text-base font-bold text-ink">
        비밀번호 (8자리 이상)
        <input
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className={INPUT_CLASS}
        />
      </label>

      <label className="flex flex-col gap-2 text-base font-bold text-ink">
        비밀번호 확인
        <input
          name="confirm"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className={INPUT_CLASS}
        />
      </label>

      <label className="flex items-start gap-3 rounded-2xl bg-white/70 p-4 text-sm font-bold text-ink">
        <input name="agree" type="checkbox" required className="mt-1 h-5 w-5 shrink-0 accent-primary" />
        <span>
          <Link href="/privacy" target="_blank" className="underline text-primary-dark">
            개인정보 처리방침
          </Link>
          을 읽었고, 보호자 본인으로서 이에 동의합니다.
        </span>
      </label>

      {state.error && (
        <p role="alert" className="font-bold text-red-500">
          {state.error}
        </p>
      )}
      {state.message && <p className="font-bold text-primary-dark">{state.message}</p>}

      <button disabled={pending} className={`${buttonClassName()} mt-2`}>
        ✨ 회원가입 신청하기
      </button>
    </form>
  );
}
