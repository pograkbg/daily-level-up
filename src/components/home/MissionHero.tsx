import Link from "next/link";
import { buttonClassName } from "@/components/ui/Button";
import { SubjectBox, type StepProps } from "@/components/home/SubjectBox";
import { getMissionProgressPercent, MISSION_STATUS_LABEL } from "@/lib/game/mission";
import { MISSION_TITLE } from "@/lib/game/mission-config";
import type { AttemptStatus, DailyMission } from "@/types/game";

interface MissionHeroProps {
  mission: DailyMission;
  attempts: AttemptStatus;
  grade: number;
  /** 2 섹션: 학기 진도와 단원 연습 */
  step2: StepProps;
}

/** 수학 박스 (2학년 이상). 1 미션 · 2 단원 연습 */
export function MissionHero({ mission, attempts, grade, step2 }: MissionHeroProps) {
  const missionPercent = getMissionProgressPercent(mission);
  const inProgress = mission.solvedCount > 0 && mission.status !== "rewarded";

  return (
    <SubjectBox
      badge="📐 수학 플레이"
      title={MISSION_TITLE}
      caption={`${grade}학년 수학 · ${mission.attemptNo}회차 · ${MISSION_STATUS_LABEL[mission.status]}`}
      count={`오늘 ${attempts.started} / ${attempts.max}회`}
      step1={{
        no: 1,
        title: "미션",
        meta: `${mission.solvedCount} / ${mission.totalQuestions}`,
        percent: missionPercent,
        barLabel: `미션 진행률 ${missionPercent}%`,
        barColor: "bg-honey",
        action: (
          <Link href="/mission" className={buttonClassName()}>
            {inProgress ? "▶ 이어서 풀기" : "⚔️ 수학 시작하기"}
          </Link>
        ),
      }}
      step2={step2}
    />
  );
}
