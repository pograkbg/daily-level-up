/**
 * 게임 전체에서 쓰는 타입 정의.
 * 화면(UI)은 이 타입만 보고 그리고, 데이터 출처(mock/DB)는 신경 쓰지 않습니다.
 */

import type { InsectId } from "@/lib/game/insects";

/** 선택 가능한 곤충 친구 (도감은 lib/game/insects.ts) */
export type { InsectId };

/** 곤충 성장 단계: 알 → 애벌레 → 번데기 → 성충 */
export type GrowthStage = "egg" | "larva" | "pupa" | "adult";

export interface InsectCharacter {
  id: InsectId;
  name: string; // 예: 꿀벌
  title: string; // 예: 꿀벌 용사
  description: string;
  stage: GrowthStage;
  stageLabel: string; // 예: 애벌레
  emoji: string; // 임시 아이콘 (나중에 일러스트로 교체)
}

export type Subject = "math";

/** 풀이 방식: 랜덤(열린 레벨에서 무작위) 또는 지정(연산·난이도 선택) */
export type PracticeMode = "random" | "choose";

/** 연산별 난이도 (0 = 하, 1 = 중, 2 = 상, null = 아직 안 고름). 지정 풀기에서만 씁니다. */
export type OperatorBands = Record<"+" | "-" | "×" | "÷", 0 | 1 | 2 | null>;

export interface PracticeSettings {
  mode: PracticeMode;
  bands: OperatorBands;
}

export type MissionStatus = "ready" | "in_progress" | "completed" | "rewarded";

export interface DailyMission {
  id: string;
  date: string; // YYYY-MM-DD
  subject: Subject;
  title: string;
  totalQuestions: number;
  solvedCount: number;
  correctCount: number;
  status: MissionStatus;
  rewardXp: number;
  rewardCoins: number;
  attemptNo: number; // 오늘의 회차 (1 ~ 최대 횟수)
  planLabel: string; // 이 회차의 풀이 요약 (예: "지정 풀기 · 덧셈 하 · 뺄셈 중 …")
}

export interface PlayerProfile {
  id: string;
  nickname: string;
  grade: 2 | 3 | 4 | 5 | 6; // 초등학교 학년
  characterId: InsectId;
  totalXp: number; // 누적 경험치 (평생, 표시용)
  characterXp: number; // 지금 키우는 친구의 경험치 (성충 3,600에서 멈춤)
  pendingNewCharacter: boolean; // 성충이 되어 새 친구를 고를 차례인지
  collection: InsectId[]; // 배움의 숲: 성충이 된 친구들
  coins: number; // 보유 코인 (통장 잔액)
  streakDays: number; // 연속 학습 일수
  progress: Record<"+" | "-" | "×" | "÷", { level: number; xp: number; ready?: boolean; hold?: boolean }>; // 연산별 학습 레벨 (1~15)
  practice: PracticeSettings; // 풀이 방식
  nextGradeApproved: boolean; // 보호자가 다음 학년을 승인했는지
}

/** 오늘 미션 회차 현황 */
export interface AttemptStatus {
  started: number; // 오늘 시작한 회차 수
  max: number; // 하루 최대 회차
  canStartNext: boolean; // 다음 회차를 시작할 수 있는지
}

/** 연산 하나의 통계 */
export interface OpStats {
  total: number; // 푼 문제 수
  correct: number; // 맞힌 문제 수
}

/** 아이 학습 통계 (캐릭터 아래에 표시) */
export interface ChildStats {
  total: number;
  correct: number;
  totalMs: number; // 전체 풀이 시간 (ms)
  today: OpStats & { ms: number }; // 오늘 풀이 시간 (ms)
  byOp: Record<"+" | "-" | "×" | "÷", OpStats>;
}

export interface HomeData {
  profile: PlayerProfile;
  character: InsectCharacter;
  todayMission: DailyMission;
  attempts: AttemptStatus;
  stats: ChildStats;
  dailyGoalMinutes: number; // 하루 목표 (기본 30분)
  studiedMinutes: number; // 오늘 공부한 시간
}

/* ---------- 미션 진행 ---------- */

/** 화면에 보여줄 현재 문제 (정답은 절대 포함하지 않습니다) */
export interface QuestionView {
  index: number; // 0 ~ 9
  total: number;
  prompt: string; // 예: "12 + 5 = ?"
}

/** 정답 제출 결과 */
export interface AnswerResult {
  index: number;
  input: number;
  correct: boolean;
  correctAnswer: number;
  explanation: string; // 해설 (틀렸을 때 보여줌)
}

/** 보상 수령 결과 */
export interface RewardResult {
  xp: number; // 이번에 새로 지급된 경험치 (중복이면 0)
  coins: number; // 이번에 새로 지급된 코인 (중복이면 0)
  alreadyClaimed: boolean; // true = 이미 받은 보상이라 추가 지급 없음
}

/** 미션 화면이 한 번에 받는 전체 상태 */
export interface MissionView {
  mission: DailyMission;
  currentQuestion: QuestionView | null; // 모든 문제를 풀면 null
  lastResult: AnswerResult | null; // 방금 제출한 답의 결과
  reward: RewardResult | null; // 보상을 받은 뒤에만 값이 있음
  attempts: AttemptStatus;
}

/** 서버 함수(Server Action)의 공통 응답 형식 */
export type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string };
