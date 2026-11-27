import type { ReactNode } from "react";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";

/** 한 줄(1 · 2 · 3)의 내용 */
export interface RowProps {
  no: 1 | 2 | 3;
  title: string;
  meta: string;
  percent: number;
  barLabel: string;
  barColor: string;
  note: string;
  action: ReactNode;
}

/**
 * 과목 박스 (수학·영어 공통 틀).
 * 머리글 → 1 줄 → 구분선 → 2 줄 → 구분선 → 3 줄(모의고사).
 * 세 줄 모두 같은 높이라서, 수학과 영어 박스의 줄과 버튼 위치가 항상 맞습니다.
 */
export function SubjectBox({
  badge,
  title,
  caption,
  count,
  rows,
}: {
  badge: string;
  title: string;
  caption: string;
  count: string;
  rows: [RowProps, RowProps, RowProps];
}) {
  return (
    <Card className="flex h-full flex-col gap-3">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <span className="w-fit rounded-full bg-sky px-3 py-1 text-sm font-bold text-primary-dark">{badge}</span>
          <span className="text-sm font-bold text-ink-soft">{count}</span>
        </div>
        <h2 className="text-2xl font-extrabold leading-snug text-ink">{title}</h2>
        <p className="text-sm font-bold text-ink-soft">{caption}</p>
      </div>

      <Row {...rows[0]} />
      <div className="border-t-2 border-ink/10" />
      <Row {...rows[1]} />
      <div className="border-t-2 border-ink/10" />
      <Row {...rows[2]} />
    </Card>
  );
}

/** 한 줄: 번호, 제목, 수치 · 진행 막대 · 설명 · 버튼 (높이 고정) */
function Row({ no, title, meta, percent, barLabel, barColor, note, action }: RowProps) {
  return (
    <div className="flex min-h-[9.5rem] flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-base font-extrabold text-white" aria-hidden>
            {no}
          </span>
          <span className="text-lg font-extrabold text-ink">{title}</span>
        </span>
        <span className="text-sm font-bold text-ink-soft">{meta}</span>
      </div>
      <ProgressBar value={percent} label={barLabel} colorClass={barColor} heightClass="h-3" />
      <p className="min-h-[1.25rem] text-sm font-bold text-ink-soft">{note}</p>
      <div className="mt-auto">{action}</div>
    </div>
  );
}
