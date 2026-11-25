"use client";

import { useActionState } from "react";
import { authAction, type AuthState } from "@/app/login/actions";
import { buttonClassName } from "@/components/ui/Button";

const INITIAL_STATE: AuthState = { error: null, message: null };

const INPUT_CLASS =
  "min-h-14 w-full rounded-2xl border-2 border-ink/10 bg-white px-4 text-lg text-ink outline-none focus:border-primary";

/** 부모님용 로그인 폼 (회원가입은 /signup 에서 합니다) */
export function LoginForm() {
  const [state, formAction, pending] = useActionState(authAction, INITIAL_STATE);

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
        비밀번호
        <input
          name="password"
          type="password"
          required
          minLength={6}
          autoComplete="current-password"
          className={INPUT_CLASS}
        />
      </label>

      {state.error && (
        <p role="alert" className="font-bold text-red-500">
          {state.error}
        </p>
      )}

      <button disabled={pending} className={`${buttonClassName()} mt-2`}>
        🔑 로그인
      </button>
    </form>
  );
}
