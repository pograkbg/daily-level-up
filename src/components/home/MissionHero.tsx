import Link from "next/link";
import { buttonClassName } from "@/components/ui/Button";
import { SubjectBox, type RowProps } from "@/components/home/SubjectBox";
import { getMissionProgressPercent, MISSION_STATUS_LABEL } from "@/lib/game/mission";
import { MISSION_TITLE } from "@/lib/game/mission-config";
import { MOCK_MIN_ACCURACY } from "@/lib/game/semester";
import type { SemesterProgress } from "@/lib/data/semester-repository";
import type { AttemptStatus, DailyMission } from "@/types/game";

interface MissionHeroProps {
  mission: DailyMission;
  attempts: AttemptStatus;
  grade: number;
  semester: SemesterProgress;
}

/** 수학 박스 (2학년 이상): 1 미션 · 2 단원 연습 · 3 모의고사 */
export function MissionHero({ mission, attempts, semester }: MissionHeroProps) {
  const missionPercent = getMissionProgressPercent(mission);
  const inProgress = mission.solvedCount > 0 && mission.status !== "rewarded";
  const semesterPercent = semester.target > 0 ? Math.min(100, Math.round((semester.solved / semester.target) * 100)) : 0;
  const accuracy = semester.solved > 0 ? Math.round((semester.correct / semester.solved) * 100) : 0;

  const row1: RowProps = {
    no: 1,
    title: "수학 퀴즈",
    meta: `${mission.solvedCount} / ${mission.totalQuestions}`,
    percent: missionPercent,
    barLabel: `미션 진행률 ${missionPercent}%`,
    barColor: "bg-honey",
    note: `${MISSION_STATUS_LABEL[mission.status]} · ${mission.attemptNo}회차`,
    action: (
      <Link href="/mission" className={buttonClassName()}>
        {inProgress ? "▶ 수학 퀴즈 이어서 풀기" : "✏️ 수학 퀴즈 시작하기"}
      </Link>
    ),
  };

  const row2: RowProps = {
    no: 2,
    title: "단원 연습",
    meta: `${semester.solved} / ${semester.target}`,
    percent: semesterPercent,
    barLabel: `학기 진도 ${semesterPercent}%`,
    barColor: "bg-primary",
    note: `지금까지 필요한 진도 ${semester.required}문제`,
    action: (
      <Link href="/practice" className={buttonClassName({ variant: "secondary" })}>
        📘 오늘의 단원 연습
      </Link>
    ),
  };

  const row3: RowProps = {
    no: 3,
    title: "레벨업 모의고사",
    meta: semester.mockOpen ? "열림" : "잠김",
    percent: accuracy,
    barLabel: `정답률 ${accuracy}% (${Math.round(MOCK_MIN_ACCURACY * 100)}% 이상 열림)`,
    barColor: "bg-xp",
    note: semester.mockOpen ? "모의고사를 볼 수 있어요" : "진도와 정답률이 채워지면 열려요",
    action: (
      <span className={`${buttonClassName({ variant: "secondary" })} pointer-events-none opacity-50`} aria-disabled="true">
        {semester.mockOpen ? "🎯 레벨업 모의고사 (준비 중)" : "🔒 레벨업 모의고사"}
      </span>
    ),
  };

  return (
    <SubjectBox
      badge="📐 수학 플레이"
      title={MISSION_TITLE}
      count={`오늘 ${attempts.started} / ${attempts.max}회`}
      rows={[row1, row2, row3]}
    />
  );
}
