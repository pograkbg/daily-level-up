import type { ReactNode } from "react";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";

/** 한 섹션(1 또는 2)의 내용 */
export interface StepProps {
  no: 1 | 2;
  title: string;
  meta: string;
  percent: number;
  barLabel: string;
  barColor?: string;
  note?: string;
  action: ReactNode;
}

/** 과목 박스 하나: 머리글 → 1 섹션 → 구분선 → 2 섹션. 수학·영어가 같은 틀을 씁니다. */
export function SubjectBox({
  badge,
  title,
  caption,
  count,
  step1,
  step2,
}: {
  badge: string;
  title: string;
  caption: string;
  count: string;
  step1: StepProps;
  step2: StepProps;
}) {
  return (
    <Card className="flex h-full flex-col gap-4">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <span className="w-fit rounded-full bg-sky px-3 py-1 text-sm font-bold text-primary-dark">{badge}</span>
          <span className="text-sm font-bold text-ink-soft">{count}</span>
        </div>
        <h2 className="text-2xl font-extrabold leading-snug text-ink">{title}</h2>
        <p className="text-sm font-bold text-ink-soft">{caption}</p>
      </div>

      <Step {...step1} />

      <div className="border-t-2 border-ink/10" />

      <Step {...step2} />
    </Card>
  );
}

/** 번호가 붙은 섹션. 두 섹션은 같은 높이라서 두 박스의 줄과 버튼이 맞춰집니다. */
function Step({ no, title, meta, percent, barLabel, barColor = "bg-honey", note, action }: StepProps) {
  return (
    <div className="flex min-h-[13rem] flex-col gap-3">
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
      {note ? <p className="text-xs font-bold text-ink-soft">{note}</p> : <span className="block h-4" aria-hidden />}
      <div className="mt-auto">{action}</div>
    </div>
  );
}
