"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { OperationProgressCard } from "@/components/home/OperationProgressCard";
import type { Progress } from "@/lib/game/learning-levels";
import type { ChildStats } from "@/types/game";

interface OperationDialogProps {
  progress: Progress;
  stats: ChildStats;
}

/**
 * 연산별 현황 버튼. 누르면 가운데에 팝업이 뜨고, 홈 화면 배치는 그대로 유지됩니다.
 */
export function OperationDialog({ progress, stats }: OperationDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-sm font-extrabold text-primary-dark underline underline-offset-4"
      >
        연산별 현황 ▸
      </button>

      {open && createPortal(
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="연산별 현황"
        >
          <div className="flex w-full max-w-2xl flex-col gap-3 rounded-[2rem] border-4 border-white bg-white p-5 shadow-2xl sm:p-6">
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="min-h-12 rounded-full bg-ink/5 px-5 font-bold text-ink"
              >
                닫기
              </button>
            </div>
            <OperationProgressCard progress={progress} stats={stats} />
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
