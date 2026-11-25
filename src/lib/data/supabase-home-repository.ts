/**
 * [실제 DB] Supabase 홈 화면 데이터.
 * 화면에 필요한 값을 DB에서 읽어 HomeData 모양으로 맞춥니다.
 */

import { buildCharacter } from "@/lib/game/characters";
import { getLevelInfo } from "@/lib/game/level";
import { DAILY_GOAL_MINUTES, todayInSeoul } from "@/lib/game/mission-config";
import { OPERATORS, type BandChoice, type Progress } from "@/lib/game/learning-levels";
import { getCurrentChild, supabaseGetMissionView } from "@/lib/data/supabase-mission-repository";
import type { ChildStats, HomeData, PlayerProfile } from "@/types/game";
import type { InsectId } from "@/lib/game/insects";

function toBands(raw: unknown): BandChoice {
  const obj = (raw ?? {}) as Record<string, number | null>;
  const result = {} as BandChoice;
  for (const op of OPERATORS) {
    const v = obj[op];
    result[op] = v === 0 || v === 1 || v === 2 ? v : null;
  }
  return result;
}

function toProgress(raw: unknown): Progress {
  const obj = (raw ?? {}) as Record<string, { level?: number; xp?: number; ready?: boolean; hold?: boolean }>;
  const pick = (op: string) => ({
    level: obj[op]?.level ?? 1,
    xp: obj[op]?.xp ?? 0,
    ready: obj[op]?.ready === true,
    hold: obj[op]?.hold === true,
  });
  return { "+": pick("+"), "-": pick("-"), "×": pick("×"), "÷": pick("÷") };
}

function emptyStats(): ChildStats {
  const byOp = Object.fromEntries(OPERATORS.map((op) => [op, { total: 0, correct: 0 }])) as ChildStats["byOp"];
  return { total: 0, correct: 0, totalMs: 0, today: { total: 0, correct: 0, ms: 0 }, byOp };
}

/** DB 응답을 화면용 모양으로 맞춥니다 (0011 이전 DB에는 시간 값이 없을 수 있습니다). */
function normalizeStats(raw: ChildStats | null): ChildStats {
  const base = emptyStats();
  if (!raw) return base;
  return {
    ...base,
    ...raw,
    totalMs: raw.totalMs ?? 0,
    today: { ...base.today, ...raw.today, ms: raw.today?.ms ?? 0 },
  };
}

export async function getSupabaseHomeData(): Promise<HomeData> {
  const { supabase, child } = await getCurrentChild();
  const today = todayInSeoul();

  // 오늘 미션(회차·횟수 포함)은 미션 저장소와 같은 방식으로 가져옵니다.
  const missionView = await supabaseGetMissionView();

  const { data: childDetail, error: childError } = await supabase
    .from("children")
    .select(
      "id, nickname, grade, character_id, total_xp, char_xp, pending_new_character, coins, streak_days, study_progress, practice_mode, practice_bands, next_grade_approved",
    )
    .eq("id", child.id)
    .single();
  if (childError) throw childError;

  const { data: collectionRows, error: collectionError } = await supabase
    .from("child_collection")
    .select("insect_id")
    .eq("child_id", child.id);
  if (collectionError) throw collectionError;

  const { data: studyRow, error: studyError } = await supabase
    .from("study_logs")
    .select("minutes")
    .eq("child_id", child.id)
    .eq("study_date", today)
    .maybeSingle();
  if (studyError) throw studyError;

  // 학습 통계 (정답률, 연산별 기록)
  const { data: statsData, error: statsError } = await supabase.rpc("get_child_stats", {
    p_child_id: child.id,
    p_today: today,
  });
  if (statsError) throw statsError;
  const stats = normalizeStats(statsData as ChildStats | null);

  const profile: PlayerProfile = {
    id: childDetail.id,
    nickname: childDetail.nickname,
    grade: childDetail.grade as PlayerProfile["grade"],
    characterId: childDetail.character_id as PlayerProfile["characterId"],
    totalXp: childDetail.total_xp,
    characterXp: childDetail.char_xp,
    pendingNewCharacter: childDetail.pending_new_character,
    collection: (collectionRows ?? []).map((r) => r.insect_id as InsectId),
    coins: childDetail.coins,
    streakDays: childDetail.streak_days,
    progress: toProgress(childDetail.study_progress),
    practice: {
      mode: childDetail.practice_mode === "choose" ? "choose" : "random",
      bands: toBands(childDetail.practice_bands),
    },
    nextGradeApproved: childDetail.next_grade_approved,
  };

  const level = getLevelInfo(profile.characterXp).level;

  return {
    profile,
    character: buildCharacter(profile.characterId, level),
    todayMission: missionView.mission,
    attempts: missionView.attempts,
    stats,
    dailyGoalMinutes: DAILY_GOAL_MINUTES,
    studiedMinutes: studyRow?.minutes ?? 0,
  };
}
