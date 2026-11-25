"use client";

import { useActionState } from "react";
import { createChildAction, type SetupState } from "@/app/setup/actions";
import { buttonClassName } from "@/components/ui/Button";
import { InsectGlyph } from "@/components/ui/InsectGlyph";
import { INSECTS } from "@/lib/game/insects";

const INITIAL_STATE: SetupState = { error: null };

const INPUT_CLASS =
  "min-h-14 w-full rounded-2xl border-2 border-ink/10 bg-white px-4 text-lg text-ink outline-none focus:border-primary";

/** 아이 프로필 만들기 폼: 이름, 학년, 처음 키울 곤충 고르기 */
export function ChildSetupForm() {
  const [state, formAction, pending] = useActionState(createChildAction, INITIAL_STATE);

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <label className="flex flex-col gap-2 text-base font-bold text-ink">
        아이 이름 (별명도 괜찮아요)
        <input name="nickname" required maxLength={20} className={INPUT_CLASS} placeholder="예: 하린" />
      </label>

      <label className="flex flex-col gap-2 text-base font-bold text-ink">
        학년
        <select name="grade" defaultValue="2" className={INPUT_CLASS}>
          {[2, 3, 4, 5, 6].map((grade) => (
            <option key={grade} value={grade}>
              {grade}학년
            </option>
          ))}
        </select>
      </label>

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-2 text-base font-bold text-ink">처음 키울 곤충 친구</legend>
        {INSECTS.map((insect, i) => (
          <label
            key={insect.id}
            className="flex min-h-16 cursor-pointer items-center gap-4 rounded-3xl border-4 border-white bg-white p-4 shadow-md has-[:checked]:border-primary has-[:checked]:bg-lavender"
          >
            <input type="radio" name="characterId" value={insect.id} defaultChecked={i === 0} className="h-6 w-6 accent-primary" />
            <InsectGlyph icon={insect.icon} className="h-12 w-12 text-4xl" />
            <span className="flex min-w-0 flex-col">
              <span className="text-lg font-extrabold text-ink">{insect.name}</span>
              <span className="text-sm text-ink-soft">{insect.tagline}</span>
            </span>
          </label>
        ))}
      </fieldset>

      {state.error && (
        <p role="alert" className="font-bold text-red-500">
          {state.error}
        </p>
      )}

      <button type="submit" disabled={pending} className={buttonClassName()}>
        🎉 모험 시작하기
      </button>
    </form>
  );
}
