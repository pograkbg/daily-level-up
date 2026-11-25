"use client";

import { useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { renameChildAction } from "@/app/profile/actions";

/** 아이 이름 바꾸기: 버튼을 누르면 이름 입력 팝업이 뜹니다. */
export function RenameButton({ current, label = "이름 바꾸기" }: { current: string; label?: string }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(current);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function save() {
    startTransition(async () => {
      const result = await renameChildAction(name);
      if (result.ok) {
        setOpen(false);
      } else {
        setMessage(result.error);
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setName(current);
          setMessage(null);
          setOpen(true);
        }}
        className="min-h-12 rounded-xl px-3 text-sm font-extrabold text-primary-dark"
      >
        {label} ›
      </button>

      {open &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4"
            role="dialog"
            aria-modal="true"
            aria-label="이름 바꾸기"
            onClick={() => setOpen(false)}
          >
            <div
              className="flex w-full max-w-sm flex-col gap-4 rounded-[2rem] border-4 border-white bg-white p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <p className="text-lg font-extrabold text-ink">아이 이름 바꾸기</p>
              <input
                value={name}
                maxLength={20}
                onChange={(e) => setName(e.target.value)}
                className="min-h-12 rounded-2xl border-2 border-ink/10 bg-white px-4 text-base font-bold text-ink"
              />
              <p className="text-xs font-bold text-ink-soft">1~20글자로 입력해 주세요.</p>
              {message && (
                <p role="alert" className="text-sm font-bold text-red-500">
                  {message}
                </p>
              )}
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={pending || name.trim().length < 1}
                  onClick={save}
                  className="min-h-12 flex-1 rounded-2xl bg-primary px-4 font-extrabold text-white disabled:opacity-50"
                >
                  저장
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="min-h-12 flex-1 rounded-2xl bg-ink/10 px-4 font-extrabold text-ink"
                >
                  취소
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
