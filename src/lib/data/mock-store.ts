/**
 * [MOCK 저장소] 서버 메모리에 상태를 보관하는 가짜 DB입니다.
 *
 * 주의:
 * - 개발 서버를 껐다 켜면 초기화됩니다.
 * - 정답표(problems)는 서버 안에만 있고, 화면에는 현재 문제만 보냅니다.
 * - 회차 제한, 보상 중복 방지, 연산별 진도, 당일 중복 제외, 통계 규칙은 DB 버전(0002~0005 SQL)과 같습니다.
 */

import { MOCK_DAILY_GOAL_MINUTES, MOCK_LAST_STUDY_OFFSET_DAYS, MOCK_PROFILE, MOCK_STUDIED_MINUTES } from "@/lib/data/mock-data";
import { buildCharacter } from "@/lib/game/characters";
import { getLevelInfo } from "@/lib/game/level";
import { ADULT_XP } from "@/lib/game/characters";
import { INSECT_IDS, type InsectId } from "@/lib/game/insects";
import { generateSessionProblems, hashSeed, problemKey, type MathProblem, type MathOperator } from "@/lib/game/math-problems";
import {
  applyCorrectXp,
  resolveLevelUp,
  isBandChoiceComplete,
  isBandUnlocked,
  isGradeCleared,
  OPERATORS,
  planLabelFor,
  planSession,
  type Band,
  type BandChoice,
} from "@/lib/game/learning-levels";
import { checkAnswer, explainProblem, formatPrompt, parseAnswerInput } from "@/lib/game/mission-rules";
import {
  MAX_MISSIONS_PER_DAY,
  MISSION_REWARD_COINS,
  MISSION_REWARD_XP,
  MISSION_TITLE,
  MISSION_TOTAL_QUESTIONS,
  todayInSeoul,
} from "@/lib/game/mission-config";
import { nextStreak, shiftDate } from "@/lib/game/streak";
import type {
  ActionResult,
  AnswerResult,
  AttemptStatus,
  ChildStats,
  DailyMission,
  HomeData,
  MissionView,
  PlayerProfile,
  PracticeSettings,
} from "@/types/game";

interface MockMission {
  mission: DailyMission;
  problems: MathProblem[]; // 정답 포함 (서버 전용)
  results: (boolean | null)[]; // 문제별 정답 여부 (아직 안 푼 문제는 null)
  elapsedMs: number[]; // 문제별 풀이 시간 (ms)
  inputs: (number | null)[]; // 문제별 아이가 쓴 답 (틀린 문제 다시 보기용)
}

interface MockState {
  profile: PlayerProfile;
  lastStudyDate: string | null;
  missions: MockMission[]; // 모든 날짜의 회차 (오래된 순)
}

// 개발 중 핫 리로드가 일어나도 상태가 유지되도록 globalThis 에 보관합니다.
const globalForMock = globalThis as typeof globalThis & { __dluMockState?: MockState };

/** 기본 지정 난이도: 네 연산 모두 "하"(레벨 1~5). 아이가 바로 시작할 수 있게 합니다. */
function defaultBands(): BandChoice {
  return { "+": 0, "-": 0, "×": 0, "÷": 0 };
}

/** 누적 경험치와 캐릭터 경험치를 함께 올립니다 (DB의 grow_character 와 같은 규칙). */
export function addCharacterXp(amount: number): void {
  const profile = getState().profile;
  profile.totalXp += amount;
  if (profile.pendingNewCharacter) return; // 성충 후 새 친구를 고르기 전에는 자라지 않음
  if (profile.characterXp + amount >= ADULT_XP) {
    profile.characterXp = ADULT_XP;
    profile.pendingNewCharacter = true;
    if (!profile.collection.includes(profile.characterId)) {
      profile.collection = [...profile.collection, profile.characterId];
    }
  } else {
    profile.characterXp += amount;
  }
}

/** 레벨을 깬 뒤 아이의 선택 (올라가기 또는 올라가지 않기) */
export function mockResolveLevelUp(op: MathOperator, accept: boolean): ActionResult<null> {
  const profile = getState().profile;
  if (!profile.progress[op]?.ready) return { ok: false, error: "지금은 올라갈지 물어볼 차례가 아니에요." };
  profile.progress[op] = resolveLevelUp(profile.progress[op], accept);
  return { ok: true, data: null };
}

/** 성충 후 새 친구 고르기 */
export function mockChooseCharacter(insect: InsectId): ActionResult<null> {
  const profile = getState().profile;
  if (!profile.pendingNewCharacter) return { ok: false, error: "지금은 새 친구를 고를 차례가 아니에요." };
  if (!INSECT_IDS.includes(insect)) return { ok: false, error: "없는 곤충이에요." };
  if (profile.collection.includes(insect)) return { ok: false, error: "이미 키운 친구예요." };
  profile.characterId = insect;
  profile.characterXp = 0;
  profile.pendingNewCharacter = false;
  return { ok: true, data: null };
}

/** 틀린 수학 문제 목록 (최근 것부터, 개발용 데이터) */
export function mockWrongMath(limit: number): {
  missionDate: string;
  idx: number;
  left: number;
  right: number;
  operator: string;
  correctAnswer: number;
  myAnswer: number;
}[] {
  const rows: ReturnType<typeof mockWrongMath> = [];
  const missions = getState().missions;
  for (let m = missions.length - 1; m >= 0; m--) {
    const entry = missions[m];
    for (let i = entry.results.length - 1; i >= 0; i--) {
      if (entry.results[i] !== false) continue;
      const p = entry.problems[i];
      rows.push({
        missionDate: entry.mission.date,
        idx: i,
        left: p.left,
        right: p.right,
        operator: p.operator,
        correctAnswer: p.answer,
        myAnswer: entry.inputs[i] ?? -1,
      });
      if (rows.length >= limit) return rows;
    }
  }
  return rows;
}

export function getState(): MockState {
  if (!globalForMock.__dluMockState) {
    globalForMock.__dluMockState = {
      profile: {
        ...MOCK_PROFILE,
        progress: { ...MOCK_PROFILE.progress },
        practice: { mode: "choose", bands: defaultBands() },
      },
      lastStudyDate: shiftDate(todayInSeoul(), MOCK_LAST_STUDY_OFFSET_DAYS),
      missions: [],
    };
  }
  return globalForMock.__dluMockState;
}

/* ---------- 내부 도우미 ---------- */

function todaysMissions(state: MockState): MockMission[] {
  const today = todayInSeoul();
  return state.missions.filter((m) => m.mission.date === today);
}

function findMission(state: MockState, missionId: string): MockMission | undefined {
  return state.missions.find((m) => m.mission.id === missionId);
}

/** 오늘 이미 나온 문제 키 목록 (새 회차에서 제외) */
function todaysProblemKeys(state: MockState): Set<string> {
  const keys = new Set<string>();
  todaysMissions(state).forEach((entry) => entry.problems.forEach((p) => keys.add(problemKey(p))));
  return keys;
}

/** 회차 하나(40문제)를 새로 만듭니다. 설정이 불완전하면 랜덤으로 만듭니다. */
function createAttempt(state: MockState, attemptNo: number): MockMission {
  const today = todayInSeoul();
  const { practice, progress } = state.profile;
  const seed = hashSeed(`${state.profile.id}:${today}:${attemptNo}`);

  let mode = practice.mode;
  const bands = practice.bands;
  let plan = planSession(mode, bands, progress, seed);
  if (plan === null) {
    mode = "random";
    plan = planSession("random", bands, progress, seed) ?? [];
  }

  const problems = generateSessionProblems(
    `${state.profile.id}:${today}:${attemptNo}:${mode}`,
    plan,
    todaysProblemKeys(state),
  );

  const mission: DailyMission = {
    id: `mock-${today}-${attemptNo}`,
    date: today,
    subject: "math",
    title: MISSION_TITLE,
    totalQuestions: MISSION_TOTAL_QUESTIONS,
    solvedCount: 0,
    correctCount: 0,
    status: "ready",
    rewardXp: MISSION_REWARD_XP,
    rewardCoins: MISSION_REWARD_COINS,
    attemptNo,
    planLabel: planLabelFor(mode, bands),
  };
  const entry: MockMission = {
    mission,
    problems,
    results: problems.map(() => null),
    elapsedMs: problems.map(() => 0),
    inputs: problems.map(() => null),
  };
  state.missions.push(entry);
  return entry;
}

function attemptStatus(list: MockMission[]): AttemptStatus {
  const last = list[list.length - 1];
  return {
    started: list.length,
    max: MAX_MISSIONS_PER_DAY,
    canStartNext: !!last && last.mission.status === "rewarded" && list.length < MAX_MISSIONS_PER_DAY,
  };
}

/** 오늘 회차가 하나도 없으면 1회차를 만듭니다. */
function ensureTodayAttempt(state: MockState): MockMission {
  const list = todaysMissions(state);
  if (list.length > 0) return list[list.length - 1];
  return createAttempt(state, 1);
}

/** 학습 통계 계산 (풀이 기록 전체 기준) */
function buildStats(state: MockState): ChildStats {
  const today = todayInSeoul();
  const byOp = Object.fromEntries(OPERATORS.map((op) => [op, { total: 0, correct: 0 }])) as ChildStats["byOp"];
  const stats: ChildStats = {
    total: 0,
    correct: 0,
    totalMs: 0,
    today: { total: 0, correct: 0, ms: 0 },
    byOp,
  };
  for (const entry of state.missions) {
    entry.results.forEach((result, i) => {
      if (result === null) return;
      const op: MathOperator = entry.problems[i].operator;
      const ms = entry.elapsedMs[i] ?? 0;
      stats.total += 1;
      stats.totalMs += ms;
      byOp[op].total += 1;
      if (result) {
        stats.correct += 1;
        byOp[op].correct += 1;
      }
      if (entry.mission.date === today) {
        stats.today.total += 1;
        stats.today.ms += ms;
        if (result) stats.today.correct += 1;
      }
    });
  }
  return stats;
}

function buildView(entry: MockMission, lastResult: AnswerResult | null, reward: MissionView["reward"] = null): MissionView {
  const state = getState();
  const { mission, problems } = entry;
  const next = problems[mission.solvedCount];
  return {
    mission: { ...mission },
    currentQuestion:
      next && mission.solvedCount < mission.totalQuestions
        ? { index: next.index, total: mission.totalQuestions, prompt: formatPrompt(next) }
        : null,
    lastResult,
    reward,
    attempts: attemptStatus(todaysMissions(state)),
  };
}

/* ---------- 홈 화면 ---------- */

export function mockGetHomeData(): HomeData {
  const state = getState();
  const entry = ensureTodayAttempt(state);
  const level = getLevelInfo(state.profile.characterXp).level;
  const profile = state.profile;
  return {
    profile: {
      ...profile,
      progress: { ...profile.progress },
      practice: { mode: profile.practice.mode, bands: { ...profile.practice.bands } },
    },
    character: buildCharacter(profile.characterId, level),
    todayMission: { ...entry.mission },
    attempts: attemptStatus(todaysMissions(state)),
    stats: buildStats(state),
    dailyGoalMinutes: MOCK_DAILY_GOAL_MINUTES,
    studiedMinutes: MOCK_STUDIED_MINUTES,
  };
}

/* ---------- 미션 화면 ---------- */

export function mockGetMissionView(): MissionView {
  return buildView(ensureTodayAttempt(getState()), null);
}

export function mockStartNextAttempt(): ActionResult<MissionView> {
  const state = getState();
  const list = todaysMissions(state);
  const last = list[list.length - 1];

  if (last && last.mission.status !== "rewarded") {
    return { ok: false, error: "지금 미션을 먼저 끝내고 보상을 받아 주세요." };
  }
  if (list.length >= MAX_MISSIONS_PER_DAY) {
    return { ok: false, error: "오늘 미션을 모두 끝냈어요. 내일 다시 만나요!" };
  }
  const entry = createAttempt(state, list.length + 1);
  return { ok: true, data: buildView(entry, null) };
}

export function mockSetPractice(settings: PracticeSettings): ActionResult<null> {
  const state = getState();
  if (settings.mode === "random") {
    state.profile.practice = { mode: "choose", bands: defaultBands() };
    return { ok: true, data: null };
  }
  if (!isBandChoiceComplete(settings.bands)) {
    return { ok: false, error: "덧셈·뺄셈·곱셈·나눗셈 난이도를 모두 골라 주세요." };
  }
  for (const op of OPERATORS) {
    const band = settings.bands[op] as Band;
    if (!isBandUnlocked(op, band, state.profile.progress)) {
      return { ok: false, error: "아직 열리지 않은 난이도가 있어요. 앞 단계를 먼저 채워 주세요." };
    }
  }
  state.profile.practice = { mode: "choose", bands: { ...settings.bands } };
  return { ok: true, data: null };
}

export function mockApproveNextGrade(): ActionResult<null> {
  const state = getState();
  if (!isGradeCleared(state.profile.progress)) {
    return { ok: false, error: "네 가지 연산을 모두 레벨 15까지 채운 뒤에 승인할 수 있어요." };
  }
  state.profile.nextGradeApproved = true;
  return { ok: true, data: null };
}

export function mockSubmitAnswer(
  missionId: string,
  index: number,
  rawInput: string,
  elapsedMs: number,
): ActionResult<MissionView> {
  const state = getState();
  const entry = findMission(state, missionId);
  if (!entry) return { ok: false, error: "오늘의 미션이 아니에요." };

  const { mission, problems } = entry;
  if (mission.status === "completed" || mission.status === "rewarded") {
    return { ok: false, error: "이미 모든 문제를 푼 미션이에요." };
  }
  // 같은 문제를 두 번 제출하거나 순서를 건너뛰는 것을 막습니다.
  if (index !== mission.solvedCount) {
    return { ok: false, error: "이미 제출한 문제이거나 순서가 맞지 않아요." };
  }

  const input = parseAnswerInput(rawInput);
  if (input === null) return { ok: false, error: "0부터 999까지 숫자를 입력해 주세요." };

  const problem = problems[index];
  const correct = checkAnswer(problem, input);

  mission.solvedCount += 1;
  if (correct) {
    mission.correctCount += 1;
    // 정답이면 그 연산의 진도를 올립니다.
    const op = problem.operator;
    state.profile.progress[op] = applyCorrectXp(state.profile.progress[op]);
  }
  entry.results[index] = correct;
  entry.elapsedMs[index] = elapsedMs;
  entry.inputs[index] = Number(rawInput);
  mission.status = mission.solvedCount >= mission.totalQuestions ? "completed" : "in_progress";

  const result: AnswerResult = {
    index,
    input,
    correct,
    correctAnswer: problem.answer,
    explanation: explainProblem(problem),
  };
  return { ok: true, data: buildView(entry, result) };
}

export function mockClaimReward(missionId: string): ActionResult<MissionView> {
  const state = getState();
  const entry = findMission(state, missionId);
  if (!entry) return { ok: false, error: "오늘의 미션이 아니에요." };

  const { mission } = entry;

  // 이미 받았다면 아무것도 더하지 않습니다 (중복 지급 방지).
  if (mission.status === "rewarded") {
    return { ok: true, data: buildView(entry, null, { xp: 0, coins: 0, alreadyClaimed: true }) };
  }
  if (mission.status !== "completed") {
    return { ok: false, error: "모든 문제를 푼 뒤에 보상을 받을 수 있어요." };
  }

  const { profile } = state;
  addCharacterXp(mission.rewardXp);
  profile.coins += mission.rewardCoins;
  profile.streakDays = nextStreak(state.lastStudyDate, mission.date, profile.streakDays);
  state.lastStudyDate = mission.date;

  mission.status = "rewarded";

  return {
    ok: true,
    data: buildView(entry, null, { xp: mission.rewardXp, coins: mission.rewardCoins, alreadyClaimed: false }),
  };
}
