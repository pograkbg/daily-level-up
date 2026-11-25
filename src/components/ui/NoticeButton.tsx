"use client";

import { useState } from "react";
import { createPortal } from "react-dom";

interface NoticeButtonProps {
  label: string;
  title: string;
  message: string;
}

/**
 * 잠긴 기능용 버튼. 모양은 시작 버튼과 같은 크기로 두고 회색으로 바꿔서,
 * 누르면 안내 팝업이 뜹니다. 화면 구성은 그대로 유지됩니다.
 */
export function NoticeButton({ label, title, message }: NoticeButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex min-h-16 w-full items-center justify-center gap-3 rounded-3xl bg-ink/10 px-6 py-4 text-xl font-extrabold text-ink-soft sm:text-2xl"
      >
        {label}
      </button>

      {open &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4"
            role="dialog"
            aria-modal="true"
            aria-label={title}
            onClick={() => setOpen(false)}
          >
            <div
              className="flex w-full max-w-sm flex-col gap-4 rounded-[2rem] border-4 border-white bg-white p-6 text-center shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <p className="text-xl font-extrabold text-ink">{title}</p>
              <p className="text-base font-bold text-ink-soft">{message}</p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="min-h-12 rounded-2xl bg-primary px-5 font-extrabold text-white"
              >
                확인
              </button>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
