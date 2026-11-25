"use client";

import { useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { resetChildAction, setEnglishMaxAction, setMathLevelsAction } from "@/app/admin/actions";
import type { ChildRow } from "@/lib/data/admin-repository";

const OPS = ["+", "-", "×", "÷"] as const;
const MATH_LEVELS = Array.from({ length: 15 }, (_, i) => i + 1);
const ENGLISH_LEVELS = [1, 2, 3];
/** 헤더와 모든 줄이 같은 칸 폭을 씁니다. 마지막 칸(버튼)은 고정 폭이라 줄마다 칸이 밀리지 않습니다. */
const GRID =
  "md:grid md:grid-cols-[minmax(0,1.4fr)_repeat(4,minmax(0,0.7fr))_minmax(0,0.8fr)_9rem] md:items-center md:gap-2";

/** 아이 목록: 한 아이가 한 줄. 레벨은 줄 안에서 바로 고치고, 초기화는 팝업으로 확인합니다. */
export function ChildPanel({ rows }: { rows: ChildRow[] }) {
  if (rows.length === 0) {
    return <p className="text-base font-bold text-ink-soft">아직 등록된 아이가 없어요.</p>;
  }
  return (
    <div className="flex flex-col gap-2">
      <div className={`hidden border-2 border-transparent px-4 py-1 text-sm font-bold text-ink-soft ${GRID}`}>
        <span>아이 · 보호자</span>
        <span className="text-center">덧셈</span>
        <span className="text-center">뺄셈</span>
        <span className="text-center">곱셈</span>
        <span className="text-center">나눗셈</span>
        <span className="text-center">영어 레벨</span>
        <span />
      </div>
      <ul className="flex flex-col gap-2">
        {rows.map((r) => (
          <ChildRowItem key={r.childId} child={r} />
        ))}
      </ul>
    </div>
  );
}

function ChildRowItem({ child }: { child: ChildRow }) {
  const [math, setMath] = useState(child.mathLevels);
  const [english, setEnglish] = useState(child.englishMaxLevel);
  const [message, setMessage] = useState<string | null>(null);
  const [showReset, setShowReset] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [pending, startTransition] = useTransition();

  function save() {
    startTransition(async () => {
      const m = await setMathLevelsAction(child.childId, math);
      if (!m.ok) return setMessage(m.error);
      const e = await setEnglishMaxAction(child.childId, english);
      setMessage(e.ok ? "저장했어요." : e.error);
    });
  }

  function reset() {
    startTransition(async () => {
      const r = await resetChildAction(child.childId, confirmText);
      if (r.ok) {
        setMath({ "+": 1, "-": 1, "×": 1, "÷": 1 });
        setEnglish(1);
        setShowReset(false);
        setConfirmText("");
        setMessage("초기화했어요.");
      } else {
        setMessage(r.error);
      }
    });
  }

  return (
    <li className={`flex flex-col gap-2 rounded-2xl border-2 border-white bg-white px-4 py-3 shadow-sm ${GRID}`}>
      <div className="flex min-w-0 flex-col">
        <span className="truncate text-base font-extrabold text-ink">{child.nickname}</span>
        <span className="truncate text-xs font-bold text-ink-soft">
          {child.parentEmail} · {child.grade}학년
        </span>
      </div>

      {OPS.map((op) => (
        <label key={op} className="flex items-center justify-between gap-2 text-sm font-bold text-ink md:justify-center">
          <span className="md:hidden">{op}</span>
          <select
            aria-label={`${op} 레벨`}
            value={math[op]}
            onChange={(e) => setMath({ ...math, [op]: Number(e.target.value) })}
            className="min-h-10 rounded-xl border-2 border-ink/10 bg-white px-2 text-sm font-extrabold text-ink"
          >
            {MATH_LEVELS.map((lv) => (
              <option key={lv} value={lv}>
                {lv}
              </option>
            ))}
          </select>
        </label>
      ))}

      <label className="flex items-center justify-between gap-2 text-sm font-bold text-ink md:justify-center">
        <span className="md:hidden">영어</span>
        <select
          aria-label="영어 레벨"
          value={english}
          onChange={(e) => setEnglish(Number(e.target.value))}
          className="min-h-10 rounded-xl border-2 border-ink/10 bg-white px-2 text-sm font-extrabold text-ink"
        >
          {ENGLISH_LEVELS.map((lv) => (
            <option key={lv} value={lv}>
              {lv}
            </option>
          ))}
        </select>
      </label>

      <div className="flex gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={save}
          className="min-h-10 flex-1 rounded-xl bg-primary px-3 text-sm font-extrabold text-white disabled:opacity-50 md:flex-none"
        >
          저장
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => setShowReset(true)}
          className="min-h-10 flex-1 rounded-xl bg-red-100 px-3 text-sm font-extrabold text-red-600 disabled:opacity-50 md:flex-none"
        >
          초기화
        </button>
      </div>

      {message && (
        <p role="status" className="text-xs font-bold text-primary-dark md:col-span-full">
          {message}
        </p>
      )}

      {showReset &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4"
            role="dialog"
            aria-modal="true"
            aria-label="데이터 초기화 확인"
          >
            <div className="flex w-full max-w-sm flex-col gap-3 rounded-[2rem] border-4 border-white bg-white p-6 shadow-2xl">
              <p className="text-lg font-extrabold text-ink">{child.nickname} 데이터 초기화</p>
              <p className="text-sm font-bold text-red-600">
                미션·퀴즈·도감·공부 기록이 모두 지워지고 처음 상태로 돌아갑니다. 되돌릴 수 없어요. 계정과 이름은 남아요.
              </p>
              <input
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="초기화"
                className="min-h-12 rounded-2xl border-2 border-red-200 bg-white px-3 text-base font-bold text-ink"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={pending || confirmText !== "초기화"}
                  onClick={reset}
                  className="min-h-12 flex-1 rounded-2xl bg-red-500 px-4 font-extrabold text-white disabled:opacity-40"
                >
                  실행
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowReset(false);
                    setConfirmText("");
                  }}
                  className="min-h-12 flex-1 rounded-2xl bg-ink/10 px-4 font-extrabold text-ink"
                >
                  취소
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </li>
  );
}
