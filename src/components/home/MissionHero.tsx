import Link from "next/link";
import { OperationDialog } from "@/components/home/OperationDialog";
import { PracticeDialog } from "@/components/mission/PracticeDialog";
import { buttonClassName } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { getDailyGoalPercent, getMissionProgressPercent, MISSION_STATUS_LABEL } from "@/lib/game/mission";
import { MISSION_TITLE } from "@/lib/game/mission-config";
import type { Progress } from "@/lib/game/learning-levels";
import type { AttemptStatus, ChildStats, DailyMission, PracticeSettings } from "@/types/game";

interface MissionHeroProps {
  mission: DailyMission;
  attempts: AttemptStatus;
  practice: PracticeSettings;
  progress: Progress;
  stats: ChildStats;
  dailyGoalMinutes: number;
  studiedMinutes: number;
  /** 카드 맨 아래에 함께 보여 줄 내용 (학기 진도, 연습 버튼 등) */
  footer?: React.ReactNode;
  /** 레벨 선택 버튼 표시 여부 (학년 체계에서는 끕니다) */
  showLevelPicker?: boolean;
  /** 학년 (학년 체계에서는 레벨 대신 학년 문구를 씁니다) */
  grade?: number;
  /** 하루 학습 목표 막대 표시 여부 (학년 체계에서는 끕니다) */
  showGoal?: boolean;
}

/**
 * 수학 플레이 카드 (대시보드 왼쪽 칸). 한 화면에 들어가도록 줄였습니다.
 * 위: 라벨·횟수 · 제목 · 한 줄 상태 · 진행 막대 · 아래: 시작과 풀이 방식 버튼 나란히 · 학습 목표
 */
export function MissionHero({
  mission,
  attempts,
  practice,
  progress,
  stats,
  dailyGoalMinutes,
  studiedMinutes,
  footer,
  showLevelPicker = true,
  grade,
  showGoal = true,
}: MissionHeroProps) {
  const missionPercent = getMissionProgressPercent(mission);
  const goalPercent = getDailyGoalPercent(studiedMinutes, dailyGoalMinutes);
  const inProgress = mission.solvedCount > 0 && mission.status !== "rewarded";

  return (
    <Card className="flex h-full flex-col justify-between gap-5">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <span className="w-fit rounded-full bg-sky px-3 py-1 text-sm font-bold text-primary-dark">📐 수학 플레이</span>
          <span className="text-sm font-bold text-ink-soft">오늘 {attempts.started} / {attempts.max}회</span>
        </div>
        <h2 className="text-2xl font-extrabold leading-snug text-ink">{MISSION_TITLE}</h2>
        <p className="text-sm font-bold text-ink-soft">
          {grade !== undefined
            ? `${grade}학년 수학 · ${mission.attemptNo}회차 · ${MISSION_STATUS_LABEL[mission.status]}`
            : `숫자 모험 · ${mission.attemptNo}회차 · ${mission.planLabel ? `${mission.planLabel} · ` : ""}${MISSION_STATUS_LABEL[mission.status]}`}
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between gap-2 text-sm font-bold text-ink">
          <span>문제 진행</span>
          <span className="flex items-center gap-3">
            <span>
              {mission.solvedCount} / {mission.totalQuestions}
            </span>
            <OperationDialog progress={progress} stats={stats} />
          </span>
        </div>
        <ProgressBar value={missionPercent} label={`미션 진행률 ${missionPercent}%`} colorClass="bg-honey" heightClass="h-3" />
      </div>

      <div className={showLevelPicker ? "grid grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] gap-2" : "grid grid-cols-1 gap-2"}>
        <Link href="/mission" className={buttonClassName()}>
          {inProgress ? "▶ 이어서 풀기" : "⚔️ 수학 시작하기"}
        </Link>
        {showLevelPicker && <PracticeDialog current={practice} progress={progress} />}
      </div>

      {showGoal && (
      <div className="flex items-center gap-3 rounded-2xl bg-mint/60 px-3 py-2">
        <span className="shrink-0 text-sm font-bold text-ink">학습 목표 {studiedMinutes}/{dailyGoalMinutes}분</span>
        <ProgressBar value={goalPercent} label={`하루 목표 진행률 ${goalPercent}%`} colorClass="bg-xp" heightClass="h-2.5" />
      </div>
      )}
      {footer && <div className="flex flex-col gap-4 border-t-2 border-ink/10 pt-4">{footer}</div>}
    </Card>
  );
}
