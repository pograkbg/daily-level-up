import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { OP_LEVEL_MAX, OPERATOR_NAMES, OPERATORS, XP_PER_LEVEL } from "@/lib/game/learning-levels";
import type { Progress } from "@/lib/game/learning-levels";
import type { ChildStats } from "@/types/game";

function percentOf(correct: number, total: number): number {
  return total === 0 ? 0 : Math.round((correct / total) * 100);
}

/** 연산별 현황 (팝업 안에서 네 연산을 가로로 나란히 보여줍니다) */
export function OperationProgressCard({ progress, stats }: { progress: Progress; stats: ChildStats }) {
  return (
    <Card className="flex flex-col gap-3 py-4">
      <p className="text-lg font-extrabold text-ink">연산별 현황</p>

      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        {OPERATORS.map((op) => {
          const entry = progress[op];
          const done = entry.level >= OP_LEVEL_MAX && entry.xp >= XP_PER_LEVEL;
          const percent = done ? 100 : Math.round((entry.xp / XP_PER_LEVEL) * 100);
          const rate = percentOf(stats.byOp[op].correct, stats.byOp[op].total);
          return (
            <div key={op} className="flex flex-col gap-1.5 rounded-2xl bg-white px-3 py-2 shadow-sm">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-base font-extrabold text-ink">{OPERATOR_NAMES[op]}</span>
                <span className="text-sm font-bold text-ink-soft">
                  {done ? "완료" : `레벨 ${entry.level}/${OP_LEVEL_MAX}`}
                </span>
              </div>
              <ProgressBar value={percent} label={`${OPERATOR_NAMES[op]} 진도 ${percent}%`} colorClass="bg-primary" heightClass="h-2" />
              <span className="text-sm font-bold text-ink-soft">정답률 {rate}%</span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
