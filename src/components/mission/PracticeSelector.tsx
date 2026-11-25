"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { setPracticeAction } from "@/app/mission/actions";
import {
  BAND_NAMES,
  isBandChoiceComplete,
  isBandUnlocked,
  OPERATOR_NAMES,
  OPERATORS,
  type Band,
  type BandChoice,
  type Progress,
} from "@/lib/game/learning-levels";
import type { PracticeSettings } from "@/types/game";

interface PracticeSelectorProps {
  current: PracticeSettings;
  progress: Progress;
}

/**
 * 풀이 방식
 * - 랜덤 풀기: 열린 레벨에서 40문제가 무작위로 나옵니다.
 * - 지정해서 풀기: 덧셈·뺄셈·곱셈·나눗셈의 난이도를 각각 정하면, 그 순서대로 10문제씩 40문제가 나옵니다.
 */
export function PracticeSelector({ current, progress }: PracticeSelectorProps) {
  const router = useRouter();
  const [mode, setMode] = useState(current.mode);
  const [bands, setBands] = useState<BandChoice>(current.bands);
  const [message, setMessage] = useState<{ type: "error" | "ok"; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  function save(nextMode: "random" | "choose", nextBands: BandChoice) {
    if (pending) return;
    if (nextMode === "choose" && !isBandChoiceComplete(nextBands)) {
      setMessage({ type: "error", text: "덧셈·뺄셈·곱셈·나눗셈 난이도를 모두 골라 주세요." });
      return;
    }
    startTransition(async () => {
      const result = await setPracticeAction(
        nextMode === "random"
          ? { mode: "random", bands: { "+": null, "-": null, "×": null, "÷": null } }
          : { mode: "choose", bands: nextBands },
      );
      if (result.ok) {
        setMessage({ type: "ok", text: nextMode === "random" ? "랜덤 풀기로 저장했어요." : "지정한 순서로 저장했어요." });
        router.refresh();
      } else {
        setMessage({ type: "error", text: result.error });
      }
    });
  }

  function isUnlocked(op: (typeof OPERATORS)[number], band: Band): boolean {
    return isBandUnlocked(op, band, progress);
  }

  function pick(op: (typeof OPERATORS)[number], band: Band) {
    if (!isUnlocked(op, band)) {
      setMessage({ type: "error", text: "아직 열리지 않은 난이도예요. 앞 단계를 먼저 채워 주세요." });
      return;
    }
    setBands((prev) => ({ ...prev, [op]: band }));
    setMessage(null);
  }

  const isRandom = mode === "random";

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-extrabold text-ink">풀이 방식 (다음 도전부터 적용)</p>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          aria-pressed={isRandom}
          disabled={pending}
          onClick={() => {
            setMode("random");
            save("random", bands);
          }}
          title="누르면 바로 저장돼요"
          className={`min-h-14 rounded-2xl px-3 font-bold transition ${
            isRandom ? "bg-primary text-white shadow-md" : "bg-white text-ink shadow-sm"
          }`}
        >
          🎲 랜덤 풀기 (24문제)
        </button>
        <button
          type="button"
          aria-pressed={!isRandom}
          disabled={pending}
          onClick={() => {
            setMode("choose");
            setMessage({ type: "ok", text: "연산마다 난이도를 고른 뒤 '이 순서로 저장'을 눌러야 적용돼요." });
          }}
          className={`min-h-14 rounded-2xl px-3 font-bold transition ${
            !isRandom ? "bg-primary text-white shadow-md" : "bg-white text-ink shadow-sm"
          }`}
        >
          🎯 지정해서 풀기 (24문제)
        </button>
      </div>

      {!isRandom && (
        <div className="flex flex-col gap-2 rounded-2xl bg-white/70 p-3">
          <p className="text-xs font-bold text-ink-soft">
            연산마다 난이도를 고르세요. 덧셈 → 뺄셈 → 곱셈 → 나눗셈 순서로 각 6문제씩, 그중 1문제는 랜덤으로 나옵니다.
          </p>
          <div className="grid grid-cols-[84px_repeat(3,minmax(0,1fr))] gap-2 text-center text-sm font-bold text-ink-soft">
            <span />
            {BAND_NAMES.map((name) => (
              <span key={name}>{name}</span>
            ))}
          </div>
          {OPERATORS.map((op) => (
            <div key={op} className="grid grid-cols-[84px_repeat(3,minmax(0,1fr))] gap-2">
              <span className="flex items-center text-sm font-extrabold text-ink">{OPERATOR_NAMES[op]}</span>
              {([0, 1, 2] as Band[]).map((band) => {
                const unlocked = isUnlocked(op, band);
                const active = bands[op] === band;
                return (
                  <button
                    key={band}
                    type="button"
                    aria-pressed={active}
                    onClick={() => pick(op, band)}
                    className={`min-h-12 rounded-xl text-sm font-bold transition ${
                      active
                        ? "bg-primary text-white shadow-md"
                        : unlocked
                          ? "bg-white text-ink shadow-sm"
                          : "bg-ink/5 text-ink-soft"
                    }`}
                  >
                    {unlocked ? BAND_NAMES[band] : `🔒 ${BAND_NAMES[band]}`}
                  </button>
                );
              })}
            </div>
          ))}
          <button
            type="button"
            disabled={pending}
            onClick={() => save("choose", bands)}
            className="min-h-14 rounded-2xl bg-primary px-4 font-extrabold text-white shadow-md"
          >
            ✅ 이 순서로 저장
          </button>
        </div>
      )}

      {message && (
        <p
          role={message.type === "error" ? "alert" : "status"}
          className={`text-sm font-bold ${message.type === "error" ? "text-red-500" : "text-primary-dark"}`}
        >
          {message.text}
        </p>
      )}
    </div>
  );
}
