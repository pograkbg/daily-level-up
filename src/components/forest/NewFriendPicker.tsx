"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { chooseCharacterAction } from "@/app/forest/actions";
import { Card } from "@/components/ui/Card";
import { InsectGlyph } from "@/components/ui/InsectGlyph";
import { INSECTS, type InsectId } from "@/lib/game/insects";

/** 성충이 된 뒤, 다음 친구를 고르는 카드 (키운 친구는 배움의 숲에 모입니다) */
export function NewFriendPicker({ collection }: { collection: InsectId[] }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const choices = INSECTS.filter((i) => !collection.includes(i.id));

  function pick(id: InsectId) {
    if (pending) return;
    startTransition(async () => {
      const result = await chooseCharacterAction(id);
      if (result.ok) {
        setError(null);
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <Card className="flex flex-col gap-4 border-honey">
      <div className="flex flex-col gap-1">
        <p className="text-lg font-extrabold text-ink">🎉 성충이 되었어요! 다음 친구를 골라 주세요</p>
        <p className="text-sm text-ink-soft">키운 친구는 배움의 숲에 모여요. 새 친구는 아래에서 고를 수 있어요.</p>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {choices.map((insect) => (
          <button
            key={insect.id}
            type="button"
            disabled={pending}
            onClick={() => pick(insect.id)}
            className="flex min-h-24 flex-col items-center justify-center gap-1 rounded-2xl bg-white p-3 text-center shadow-md disabled:opacity-60"
          >
            <InsectGlyph icon={insect.icon} className="h-9 w-9 text-3xl" />
            <span className="text-sm font-extrabold text-ink">{insect.name}</span>
          </button>
        ))}
      </div>
      {error && (
        <p role="alert" className="text-sm font-bold text-red-500">
          {error}
        </p>
      )}
    </Card>
  );
}
