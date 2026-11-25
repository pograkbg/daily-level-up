"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import type { WrongEnglishItem, WrongMathItem } from "@/lib/data/wrong-answers-repository";
import { analyzeMath, classifyMistake, MISTAKE_LABEL } from "@/lib/game/wrong-analysis";

export type WrongTab = "math" | "english";

interface WrongAnswersDialogProps {
  open: boolean;
  onClose: () => void;
  tab: WrongTab;
  onTabChange: (tab: WrongTab) => void;
  math: WrongMathItem[];
  english: WrongEnglishItem[];
}

/**
 * 틀린 문제 다시 보기 팝업 (열고 닫는 것은 바깥에서 정합니다).
 * 위: 많이 헷갈리는 유형 안내(수학) · 탭: 수학 / 영어 · 목록을 누르면 그 문제를 자세히 보여 줍니다.
 */
export function WrongAnswersDialog({ open, onClose, tab, onTabChange, math, english }: WrongAnswersDialogProps) {
  const [selected, setSelected] = useState<number | null>(null);
  if (!open) return null;

  const analysis = analyzeMath(math);

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="틀린 문제 다시 보기"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90dvh] w-full max-w-lg flex-col gap-4 overflow-y-auto rounded-[2rem] border-4 border-white bg-white p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <p className="text-xl font-extrabold text-ink">틀린 문제 다시 보기</p>
          <button type="button" onClick={onClose} className="min-h-10 rounded-full bg-ink/5 px-4 font-bold text-ink">
            닫기
          </button>
        </div>

        <div className="flex gap-2">
          <TabButton
            active={tab === "math"}
            onClick={() => {
              onTabChange("math");
              setSelected(null);
            }}
          >
            📐 수학 ({math.length})
          </TabButton>
          <TabButton
            active={tab === "english"}
            onClick={() => {
              onTabChange("english");
              setSelected(null);
            }}
          >
            🔤 영어 ({english.length})
          </TabButton>
        </div>

        {tab === "math" && analysis && analysis.top.length > 0 && (
          <div className="flex flex-col gap-2 rounded-2xl bg-sky/40 p-4">
            <p className="text-sm font-extrabold text-ink">많이 헷갈리는 유형</p>
            {analysis.top.map((t) => (
              <p key={t.kind} className="text-sm font-bold text-ink">
                <span className="text-primary-dark">{MISTAKE_LABEL[t.kind]}</span> · {t.count}번
                <br />
                <span className="text-ink-soft">{t.message}</span>
              </p>
            ))}
          </div>
        )}
        {tab === "math" && !analysis && (
          <p className="text-sm font-bold text-ink-soft">틀린 문제가 5개 이상 모이면 많이 헷갈리는 유형을 알려 드려요.</p>
        )}

        {tab === "math" ? (
          math.length === 0 ? (
            <Empty />
          ) : (
            <ul className="flex flex-col gap-2">
              {math.map((m, i) => (
                <li key={`${m.missionDate}-${i}`}>
                  <button
                    type="button"
                    onClick={() => setSelected(selected === i ? null : i)}
                    className="flex w-full items-center justify-between rounded-2xl bg-ink/5 px-4 py-3 text-left font-extrabold text-ink"
                  >
                    <span>
                      {m.leftOperand} {m.operator} {m.rightOperand} = ?
                    </span>
                    <span className="text-sm text-ink-soft">{selected === i ? "접기 ▴" : `${m.missionDate.slice(5)} ▸`}</span>
                  </button>
                  {selected === i && (
                    <div className="mt-2 flex flex-col gap-1 rounded-2xl bg-white p-4 shadow-inner">
                      <p className="text-base font-bold text-ink">
                        내가 쓴 답 <span className="text-red-500">{m.myAnswer}</span> · 정답{" "}
                        <span className="text-primary-dark">{m.correctAnswer}</span>
                      </p>
                      <p className="text-sm font-bold text-ink-soft">
                        {MISTAKE_LABEL[classifyMistake(m)]}을(를) 다시 연습해 보면 좋아요.
                      </p>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )
        ) : english.length === 0 ? (
          <Empty />
        ) : (
          <ul className="flex flex-col gap-2">
            {english.map((w, i) => (
              <li key={w.itemId}>
                <button
                  type="button"
                  onClick={() => setSelected(selected === i ? null : i)}
                  className="flex w-full items-center justify-between rounded-2xl bg-ink/5 px-4 py-3 text-left font-extrabold text-ink"
                >
                  <span>{w.word}</span>
                  <span className="text-sm text-ink-soft">{selected === i ? "접기 ▴" : "보기 ▸"}</span>
                </button>
                {selected === i && (
                  <div className="mt-2 flex flex-col gap-1 rounded-2xl bg-white p-4 shadow-inner">
                    <p className="text-base font-bold text-ink">
                      내가 고른 뜻 <span className="text-red-500">{w.myMeaning || "(없음)"}</span>
                    </p>
                    <p className="text-base font-bold text-ink">
                      정답 뜻 <span className="text-primary-dark">{w.correctMeaning}</span>
                    </p>
                    <p className="mt-1 text-base text-ink">{w.exampleEn}</p>
                    <p className="text-sm text-ink-soft">{w.exampleKo}</p>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}

        {math.length + english.length === 0 && (
          <p className="text-center text-sm font-bold text-ink-soft">아직 틀린 문제가 없어요. 잘하고 있어요!</p>
        )}
      </div>
    </div>,
    document.body,
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-12 flex-1 rounded-2xl px-3 font-extrabold ${active ? "bg-primary text-white" : "bg-ink/5 text-ink"}`}
    >
      {children}
    </button>
  );
}

function Empty() {
  return <p className="text-center text-sm font-bold text-ink-soft">이 과목에서는 아직 틀린 문제가 없어요.</p>;
}
