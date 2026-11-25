"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { PracticeSelector } from "@/components/mission/PracticeSelector";
import { buttonClassName } from "@/components/ui/Button";
import type { PracticeSettings } from "@/types/game";
import type { Progress } from "@/lib/game/learning-levels";

interface PracticeDialogProps {
  current: PracticeSettings;
  progress: Progress;
}

/**
 * 풀이 방식 설정 버튼.
 * 누르면 화면 위에 설정 창이 뜨므로, 홈 화면은 스크롤 없이 한 화면에 유지됩니다.
 */
export function PracticeDialog({ current, progress }: PracticeDialogProps) {
  const [open, setOpen] = useState(false);
  const modeText = current.mode === "random" ? "랜덤" : "지정";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={buttonClassName({ variant: "secondary", className: "gap-2 px-4" })}
      >
        <span className="whitespace-nowrap">⚙️ 레벨 선택</span>
        <span className="whitespace-nowrap text-sm font-bold">현재: {modeText} ▸</span>
      </button>

      {open && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4" role="dialog" aria-modal="true" aria-label="풀이 방식 설정">
          <div className="flex max-h-[92dvh] w-full max-w-lg flex-col gap-4 overflow-y-auto rounded-[2rem] border-4 border-white bg-white p-5 shadow-2xl sm:p-6">
            <div className="flex items-center justify-between">
              <p className="text-xl font-extrabold text-ink">레벨 선택</p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="min-h-12 rounded-full bg-ink/5 px-5 font-bold text-ink"
              >
                닫기
              </button>
            </div>
            <PracticeSelector current={current} progress={progress} />
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
