"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { resolveLevelUpAction } from "@/app/mission/actions";
import type { MathOperator } from "@/lib/game/math-problems";

export interface LevelUpItem {
  op: MathOperator;
  name: string; // 예: 덧셈
  level: number; // 방금 깬 레벨
}

/**
 * 레벨을 깼을 때 "올라갈까요?" 묻는 카드.
 * - 올라가기: 다음 레벨로 올라갑니다.
 * - 올라가지 않기: 지금 레벨에 머물고, 이 연산은 더 이상 묻지 않습니다 (랜덤으로만 연습).
 */
export function LevelUpPrompt({ items }: { items: LevelUpItem[] }) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState<string[]>([]);

  if (items.length === 0) return null;

  function choose(item: LevelUpItem, accept: boolean) {
    if (pending) return;
    startTransition(async () => {
      const result = await resolveLevelUpAction(item.op, accept);
      if (result.ok) {
        setDone((prev) => [...prev, item.op]);
        setMessage(accept ? `${item.name} 레벨 ${item.level + 1}로 올라갔어요!` : `${item.name}은 지금 레벨에서 랜덤으로 연습해요.`);
        router.refresh();
      } else {
        setMessage(result.error);
      }
    });
  }

  const visible = items.filter((i) => !done.includes(i.op));

  return (
    <section className="flex flex-col gap-3" aria-label="레벨업 선택">
      {visible.map((item) => (
        <div
          key={item.op}
          className="flex flex-col gap-3 rounded-3xl border-4 border-white bg-white p-4 shadow-md sm:flex-row sm:items-center sm:justify-between"
        >
          <p className="text-base font-extrabold text-ink">
            🎉 {item.name} 레벨 {item.level}을 깼어요! 다음 레벨(레벨 {item.level + 1})로 올라갈까요?
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={pending}
              onClick={() => choose(item, true)}
              className="min-h-12 flex-1 rounded-2xl bg-primary px-4 font-extrabold text-white disabled:opacity-50 sm:flex-none"
            >
              올라가기
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => choose(item, false)}
              className="min-h-12 flex-1 rounded-2xl bg-ink/10 px-4 font-extrabold text-ink disabled:opacity-50 sm:flex-none"
            >
              올라가지 않기
            </button>
          </div>
        </div>
      ))}
      {message && (
        <p role="status" className="text-sm font-bold text-primary-dark">
          {message}
        </p>
      )}
    </section>
  );
}
