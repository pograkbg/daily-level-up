"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { setEnglishMaxLevelAction } from "@/app/english/actions";

/**
 * 보호자가 이 레벨까지 열기 (선택한 레벨 위는 잠깁니다).
 * canUnlock 이 false 면 앞 레벨을 아직 깨지 않은 것이라 누를 수 없습니다.
 */
export function LevelUnlockButton({
  level,
  unlocked,
  canUnlock,
}: {
  level: number;
  unlocked: boolean;
  canUnlock: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function unlock() {
    if (pending) return;
    startTransition(async () => {
      const result = await setEnglishMaxLevelAction(level);
      if (result.ok) {
        setError(null);
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={unlock}
        disabled={pending || unlocked || !canUnlock}
        className="min-h-12 rounded-2xl bg-ink/5 px-4 text-sm font-bold text-ink disabled:opacity-60"
      >
        {unlocked ? "✔ 열려 있어요" : canUnlock ? "🔓 보호자: 여기까지 열기" : "🔒 앞 레벨을 먼저 깨야 해요"}
      </button>
      {error && (
        <p role="alert" className="text-xs font-bold text-red-500">
          {error}
        </p>
      )}
    </div>
  );
}
