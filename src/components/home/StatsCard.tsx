"use client";

import { useState } from "react";
import { WrongAnswersDialog, type WrongTab } from "@/components/home/WrongAnswersDialog";
import { Card } from "@/components/ui/Card";
import type { WrongEnglishItem, WrongMathItem } from "@/lib/data/wrong-answers-repository";
import { OPERATOR_NAMES, OPERATORS } from "@/lib/game/learning-levels";
import type { EnglishStats } from "@/types/english";
import type { ChildStats } from "@/types/game";

function percentOf(correct: number, total: number): number {
  return total === 0 ? 0 : Math.round((correct / total) * 100);
}

/** 밀리초를 "3분", "1시간 5분"처럼 보여줍니다. 1분 안 된 시간은 0분으로 봅니다. */
export function formatStudyTime(ms: number): string {
  const minutes = Math.floor(ms / 60000);
  if (minutes < 60) return `${minutes}분`;
  return `${Math.floor(minutes / 60)}시간 ${minutes % 60}분`;
}

interface StatsCardProps {
  math: ChildStats;
  english: EnglishStats;
  wrongMath: WrongMathItem[];
  wrongEnglish: WrongEnglishItem[];
}

/**
 * 학습 기록 (코칭): 수학과 영어를 줄을 나눠 같은 모양으로 보여줍니다.
 * "틀린 문제" 칸이나 "틀린 문제 다시 보기" 버튼을 누르면 틀린 문제 목록이 열립니다.
 */
export function StatsCard({ math, english, wrongMath, wrongEnglish }: StatsCardProps) {
  const [wrongOpen, setWrongOpen] = useState(false);
  const [wrongTab, setWrongTab] = useState<WrongTab>("math");

  function openWrong(tab: WrongTab) {
    setWrongTab(tab);
    setWrongOpen(true);
  }

  // 최소 5문제 이상 푼 연산 중 정답률이 가장 낮은 연산
  const weakest = OPERATORS.filter((op) => math.byOp[op].total >= 5)
    .map((op) => ({ op, rate: percentOf(math.byOp[op].correct, math.byOp[op].total) }))
    .sort((a, b) => a.rate - b.rate)[0];

  // 상처 주지 않는 말투: 잘못을 말하지 않고 "많은 친구들이 헷갈려 하는 부분"으로 이야기합니다.
  const mathTip =
    math.total === 0
      ? "첫 미션을 끝내면 기록이 쌓여요."
      : weakest && weakest.rate < 80
        ? `✨ ${OPERATOR_NAMES[weakest.op]}은(는) 많은 친구들이 헷갈려 하는 부분이에요. 함께 연습해 볼까요?`
        : "👏 꾸준히 잘하고 있어요";

  return (
    <Card className="flex flex-col gap-1 py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-lg font-extrabold text-ink">학습 기록 (코칭)</p>
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-sm font-bold text-primary-dark">{mathTip}</p>
          <button
            type="button"
            onClick={() => openWrong("math")}
            className="min-h-12 rounded-2xl bg-white px-4 text-sm font-extrabold text-primary-dark shadow-sm"
          >
            틀린 문제 다시 보기 ({wrongMath.length + wrongEnglish.length}) ▸
          </button>
        </div>
      </div>

      <Row
        label="📐 수학"
        stats={[
          { label: "총 학습 시간", value: formatStudyTime(math.totalMs) },
          { label: "오늘 학습 시간", value: formatStudyTime(math.today.ms) },
          { label: "푼 문제", value: `${math.total}` },
          { label: "정답률", value: `${percentOf(math.correct, math.total)}%` },
          { label: "틀린 문제", value: `${math.total - math.correct}`, onClick: () => openWrong("math") },
        ]}
      />

      <Row
        label="🔤 영어"
        stats={[
          { label: "총 학습 시간", value: formatStudyTime(english.totalMs) },
          { label: "오늘 학습 시간", value: formatStudyTime(english.todayMs) },
          { label: "푼 문제", value: `${english.total}` },
          { label: "정답률", value: `${percentOf(english.correct, english.total)}%` },
          { label: "틀린 문제", value: `${english.total - english.correct}`, onClick: () => openWrong("english") },
        ]}
      />

      <WrongAnswersDialog
        open={wrongOpen}
        onClose={() => setWrongOpen(false)}
        tab={wrongTab}
        onTabChange={setWrongTab}
        math={wrongMath}
        english={wrongEnglish}
      />
    </Card>
  );
}

type StatItem = { label: string; value: string; onClick?: () => void };

function Row({ label, stats }: { label: string; stats: StatItem[] }) {
  return (
    <div className="grid grid-cols-[5.5rem_minmax(0,1fr)] items-center gap-2 rounded-2xl bg-lavender/30 p-0">
      <span className="px-1 text-center text-base font-extrabold text-ink">{label}</span>
      <div className="grid grid-cols-5 gap-3">
        {stats.map((s) => (
          <Stat key={s.label} label={s.label} value={s.value} onClick={s.onClick} />
        ))}
      </div>
    </div>
  );
}

/** 칸 안의 글자는 모두 가운데 정렬합니다. 틀린 문제 칸은 이름 옆에 "▶ 다시 보기"를 붙이고, 숫자는 그 아래에 둡니다. */
function Stat({ label, value, onClick }: { label: string; value: string; onClick?: () => void }) {
  const body = (
    <>
      <span className="w-full truncate text-center text-sm font-bold text-ink-soft">
        {label}
        {onClick && <span className="font-extrabold text-primary-dark"> ▶ 다시 보기</span>}
      </span>
      <span className="w-full truncate text-center text-base font-extrabold text-ink">{value}</span>
    </>
  );
  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="flex min-w-0 flex-col items-center justify-center rounded-xl bg-white px-2 py-0.5 text-center shadow-sm ring-2 ring-primary/30 transition active:scale-95"
      >
        {body}
      </button>
    );
  }
  return (
    <div className="flex min-w-0 flex-col items-center justify-center rounded-xl bg-white px-2 py-0.5 text-center shadow-sm">{body}</div>
  );
}
