/**
 * [실제 DB] Supabase 미션 저장소.
 *
 * 모든 쓰기는 DB 함수(RPC)를 호출합니다. 정답 검사·보상 지급·학습 레벨·연속 학습은 DB 안에서만 일어납니다.
 * 이 파일은 DB 응답을 화면 타입(MissionView)으로 바꾸고, 40문제 계획과 당일 중복 제외 목록을 준비합니다.
 */

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { generateSessionProblems, hashSeed, type MathOperator } from "@/lib/game/math-problems";
import { explainProblem } from "@/lib/game/mission-rules";
import { planLabelFor, planSession, OPERATORS, type BandChoice, type Progress } from "@/lib/game/learning-levels";
import {
  MAX_MISSIONS_PER_DAY,
  MISSION_REWARD_COINS,
  MISSION_REWARD_XP,
  MISSION_TITLE,
  todayInSeoul,
} from "@/lib/game/mission-config";
import type {
  ActionResult,
  AnswerResult,
  AttemptStatus,
  DailyMission,
  MissionView,
  PracticeSettings,
  RewardResult,
} from "@/types/game";

type SupabaseClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;

/* ---------- 공통 도우미 ---------- */

/** 로그인한 부모의 첫 번째 아이를 찾습니다. 로그인이 없으면 에러. */
export async function getCurrentChild() {
  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("AUTH_REQUIRED");

  const { data: child, error } = await supabase
    .from("children")
    .select("id, total_xp, coins, study_progress, practice_mode, practice_bands, next_grade_approved")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (!child) throw new Error("CHILD_NOT_FOUND");
  return { supabase, child };
}

type ChildRow = Awaited<ReturnType<typeof getCurrentChild>>["child"];

/** 연산별 진도 읽기 (DB의 study_progress 모양 그대로) */
function normalizeProgress(raw: unknown): Progress {
  const obj = (raw ?? {}) as Record<string, { level?: number; xp?: number; ready?: boolean; hold?: boolean }>;
  const pick = (op: string) => ({
    level: obj[op]?.level ?? 1,
    xp: obj[op]?.xp ?? 0,
    ready: obj[op]?.ready === true,
    hold: obj[op]?.hold === true,
  });
  return { "+": pick("+"), "-": pick("-"), "×": pick("×"), "÷": pick("÷") };
}

/** 아이 설정에서 이번 회차의 40문제 계획 만들기 */
function planForAttempt(child: ChildRow, attemptNo: number) {
  const today = todayInSeoul();
  const seed = hashSeed(`${child.id}:${today}:${attemptNo}`);
  const bands = normalizeBands(child.practice_bands);
  const progress = normalizeProgress(child.study_progress);
  const mode = child.practice_mode === "choose" ? "choose" : "random";
  let plan = planSession(mode, bands, progress, seed);
  let usedMode: "random" | "choose" = mode;
  if (plan === null) {
    usedMode = "random";
    plan = planSession("random", bands, progress, seed) ?? [];
  }
  return { plan, mode: usedMode, bands };
}

function normalizeBands(raw: unknown): BandChoice {
  const obj = (raw ?? {}) as Record<string, number | null>;
  const result = {} as BandChoice;
  for (const op of OPERATORS) {
    const v = obj[op];
    result[op] = v === 0 || v === 1 || v === 2 ? v : null;
  }
  return result;
}

/** 오늘 이 아이의 회차 목록 (오래된 순). RLS 로 본인 것만 보입니다. */
async function listTodaysAttempts(supabase: SupabaseClient, childId: string) {
  const { data, error } = await supabase
    .from("daily_missions")
    .select("id, attempt_no, status")
    .eq("child_id", childId)
    .eq("mission_date", todayInSeoul())
    .order("attempt_no", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

function attemptStatusFrom(list: { status: string }[]): AttemptStatus {
  const last = list[list.length - 1];
  return {
    started: list.length,
    max: MAX_MISSIONS_PER_DAY,
    canStartNext: !!last && last.status === "rewarded" && list.length < MAX_MISSIONS_PER_DAY,
  };
}

interface DbMissionView {
  mission: {
    id: string;
    date: string;
    title: string;
    totalQuestions: number;
    solvedCount: number;
    correctCount: number;
    status: DailyMission["status"];
    rewardXp: number;
    rewardCoins: number;
    attemptNo: number;
    planLabel: string;
  };
  currentQuestion: { index: number; total: number; prompt: string } | null;
}

/** DB 응답(jsonb)을 화면 타입으로 바꿉니다. */
export function mapMissionView(json: unknown, attempts: AttemptStatus): MissionView {
  const data = json as DbMissionView;
  const m = data.mission;
  return {
    mission: {
      id: m.id,
      date: m.date,
      subject: "math",
      title: m.title,
      totalQuestions: m.totalQuestions,
      solvedCount: m.solvedCount,
      correctCount: m.correctCount,
      status: m.status,
      rewardXp: m.rewardXp,
      rewardCoins: m.rewardCoins,
      attemptNo: m.attemptNo,
      planLabel: m.planLabel,
    },
    currentQuestion: data.currentQuestion,
    lastResult: null,
    reward: null,
    attempts,
  };
}

/** DB 에러 메시지(함수에서 던진 코드)를 아이가 읽을 수 있는 한국어로 바꿉니다. */
const ERROR_MESSAGES: Record<string, string> = {
  mission_already_finished: "이미 모든 문제를 푼 미션이에요.",
  wrong_question_order: "이미 제출한 문제이거나 순서가 맞지 않아요.",
  invalid_input: "0부터 999까지 숫자를 입력해 주세요.",
  not_completed: "모든 문제를 푼 뒤에 보상을 받을 수 있어요.",
  mission_not_found: "오늘의 미션이 아니에요.",
  not_allowed: "이 아이의 미션에 접근할 권한이 없어요.",
  daily_limit_reached: "오늘 미션을 모두 끝냈어요. 내일 다시 만나요!",
  english_daily_limit: "오늘 퀴즈를 5회 모두 풀었어요. 내일 다시 만나요!",
  already_answered: "이미 답한 문제예요.",
  no_wrong_words: "오답이 없어요. 먼저 퀴즈를 풀어 보세요.",
  level_locked: "아직 잠긴 레벨이에요. 보호자가 열어 주면 시작할 수 있어요.",
  previous_mission_open: "지금 미션을 먼저 끝내고 보상을 받아 주세요.",
  invalid_attempt: "회차 번호가 올바르지 않아요.",
  invalid_mode: "풀이 방식을 다시 골라 주세요.",
  grade_not_cleared: "모든 레벨을 채운 뒤에 승인할 수 있어요.",
  AUTH_REQUIRED: "로그인이 필요해요.",
  CHILD_NOT_FOUND: "아이 프로필이 없어요. 부모 화면에서 먼저 만들어 주세요.",
};

/**
 * 오류를 화면용 문구로 바꿉니다.
 * Supabase 오류는 Error 가 아니라 { message, code, details, hint } 객체로 옵니다.
 * 그래서 그 안의 message 를 꺼내서 확인하고, 서버 로그에 전부 남깁니다.
 */
export function toActionError(error: unknown): { ok: false; error: string } {
  let message = "";
  let detail = "";
  if (error instanceof Error) {
    message = error.message;
  } else if (error && typeof error === "object") {
    const e = error as { message?: string; code?: string; details?: string; hint?: string };
    message = e.message ?? "";
    detail = [e.code, e.details, e.hint].filter(Boolean).join(" | ");
  } else {
    message = String(error);
  }
  console.error("[supabase-mission]", message, detail ? `(${detail})` : "");
  const key = Object.keys(ERROR_MESSAGES).find((k) => message.includes(k));
  return { ok: false, error: key ? ERROR_MESSAGES[key] : "처리 중 문제가 생겼어요. 다시 시도해 주세요." };
}

/** 회차 하나(40문제)를 DB에 만들고 화면용 결과를 돌려줍니다. */
async function startAttempt(
  supabase: SupabaseClient,
  child: ChildRow,
  attemptNo: number,
  attemptsAfter: AttemptStatus,
): Promise<MissionView> {
  const today = todayInSeoul();
  const { plan, mode, bands } = planForAttempt(child, attemptNo);

  // 오늘 이미 나온 문제는 제외합니다.
  const { data: keyRows, error: keyError } = await supabase.rpc("today_problem_keys", {
    p_child_id: child.id,
    p_mission_date: today,
  });
  if (keyError) throw keyError;
  const excluded = new Set<string>((keyRows as string[] | null) ?? []);

  const problems = generateSessionProblems(`${child.id}:${today}:${attemptNo}:${mode}`, plan, excluded);

  const { data, error } = await supabase.rpc("start_mission", {
    p_child_id: child.id,
    p_mission_date: today,
    p_attempt_no: attemptNo,
    p_plan_label: planLabelFor(mode, bands),
    p_title: MISSION_TITLE,
    p_reward_xp: MISSION_REWARD_XP,
    p_reward_coins: MISSION_REWARD_COINS,
    p_problems: problems.map((p) => ({
      index: p.index,
      left: p.left,
      right: p.right,
      operator: p.operator,
      answer: p.answer,
    })),
  });
  if (error) throw error;
  return mapMissionView(data, attemptsAfter);
}

/* ---------- 공개 함수 ---------- */

/** 오늘의 미션 가져오기 (회차가 하나도 없으면 1회차를 만듭니다) */
export async function supabaseGetMissionView(): Promise<MissionView> {
  const { supabase, child } = await getCurrentChild();
  const list = await listTodaysAttempts(supabase, child.id);

  if (list.length === 0) {
    return startAttempt(supabase, child, 1, attemptStatusFrom([{ status: "ready" }]));
  }

  const latest = list[list.length - 1];
  const { data, error } = await supabase.rpc("get_mission_view", { p_mission_id: latest.id });
  if (error) throw error;
  return mapMissionView(data, attemptStatusFrom(list));
}

/** 다음 회차 시작 (지금 회차를 보상까지 받은 뒤에만 가능) */
export async function supabaseStartNextAttempt(): Promise<ActionResult<MissionView>> {
  try {
    const { supabase, child } = await getCurrentChild();
    const list = await listTodaysAttempts(supabase, child.id);
    const last = list[list.length - 1];

    if (last && last.status !== "rewarded") {
      return { ok: false, error: "지금 미션을 먼저 끝내고 보상을 받아 주세요." };
    }
    if (list.length >= MAX_MISSIONS_PER_DAY) {
      return { ok: false, error: "오늘 미션을 모두 끝냈어요. 내일 다시 만나요!" };
    }

    const view = await startAttempt(
      supabase,
      child,
      list.length + 1,
      attemptStatusFrom([...list, { status: "ready" }]),
    );
    return { ok: true, data: view };
  } catch (error) {
    return toActionError(error);
  }
}

export async function supabaseSetPractice(settings: PracticeSettings): Promise<ActionResult<null>> {
  try {
    const { supabase, child } = await getCurrentChild();
    const { error } = await supabase.rpc("set_practice", {
      p_child_id: child.id,
      p_mode: settings.mode,
      p_bands: settings.mode === "choose" ? settings.bands : null,
    });
    if (error) throw error;
    return { ok: true, data: null };
  } catch (error) {
    return toActionError(error);
  }
}

/** 레벨을 깬 뒤 아이의 선택 (올라가기 또는 올라가지 않기) */
export async function supabaseResolveLevelUp(op: string, accept: boolean): Promise<ActionResult<null>> {
  try {
    const { supabase, child } = await getCurrentChild();
    const { error } = await supabase.rpc("resolve_level_up", {
      p_child_id: child.id,
      p_op: op,
      p_accept: accept,
    });
    if (error) throw error;
    return { ok: true, data: null };
  } catch (error) {
    return toActionError(error);
  }
}

export async function supabaseApproveNextGrade(): Promise<ActionResult<null>> {
  try {
    const { supabase, child } = await getCurrentChild();
    const { error } = await supabase.rpc("approve_next_grade", { p_child_id: child.id });
    if (error) throw error;
    return { ok: true, data: null };
  } catch (error) {
    return toActionError(error);
  }
}

export async function supabaseSubmitAnswer(
  missionId: string,
  index: number,
  rawInput: string,
  elapsedMs: number,
): Promise<ActionResult<MissionView>> {
  try {
    const { supabase, child } = await getCurrentChild();
    const { data, error } = await supabase.rpc("submit_answer", {
      p_mission_id: missionId,
      p_index: index,
      p_input: Number(rawInput),
      p_elapsed_ms: elapsedMs,
    });
    if (error) throw error;

    const json = data as {
      result: {
        index: number;
        input: number;
        correct: boolean;
        correctAnswer: number;
        left: number;
        right: number;
        operator: MathOperator;
      };
      view: unknown;
    };
    const r = json.result;
    const result: AnswerResult = {
      index: r.index,
      input: r.input,
      correct: r.correct,
      correctAnswer: r.correctAnswer,
      explanation: explainProblem({ left: r.left, right: r.right, operator: r.operator, answer: r.correctAnswer }),
    };

    const list = await listTodaysAttempts(supabase, child.id);
    const view = mapMissionView(json.view, attemptStatusFrom(list));
    return { ok: true, data: { ...view, lastResult: result } };
  } catch (error) {
    return toActionError(error);
  }
}

export async function supabaseClaimReward(missionId: string): Promise<ActionResult<MissionView>> {
  try {
    const { supabase, child } = await getCurrentChild();
    const { data, error } = await supabase.rpc("claim_reward", { p_mission_id: missionId });
    if (error) throw error;

    const json = data as { reward: RewardResult; view: unknown };
    const list = await listTodaysAttempts(supabase, child.id);
    const view = mapMissionView(json.view, attemptStatusFrom(list));
    return { ok: true, data: { ...view, reward: json.reward } };
  } catch (error) {
    return toActionError(error);
  }
}
