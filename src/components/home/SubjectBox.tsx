import type { ReactNode } from "react";
import { Card } from "@/components/ui/Card";

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
  count,
  rows,
}: {
  badge: string;
  title: string;
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
      </div>

      <Row {...rows[0]} />
      <div className="border-t-2 border-ink/10" />
      <Row {...rows[1]} />
      <div className="border-t-2 border-ink/10" />
      <Row {...rows[2]} />
    </Card>
  );
}

/** 한 줄 행: 번호 · 제목 · 수치 · 오른쪽 버튼 (한 줄에 모두 보입니다) */
function Row({ no, title, meta, action }: RowProps) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3 shadow-sm">
      <div className="flex min-w-0 items-center gap-2">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-base font-extrabold text-white" aria-hidden>
          {no}
        </span>
        <span className="truncate text-base font-extrabold text-ink">{title}</span>
        <span className="truncate text-sm font-bold text-ink-soft">{meta}</span>
      </div>
      <div className="shrink-0 whitespace-nowrap [&>*]:min-h-12 [&>*]:px-4 [&>*]:py-2 [&>*]:text-base">{action}</div>
    </div>
  );
}
