/**
 * [MOCK 영어 저장소] 우리 단어 파일(data/english/elementary800_words.json)을 읽어 퀴즈를 만듭니다.
 * DB 버전(0006~0007 SQL)과 같은 규칙: 서버가 정답을 확인하고, 정답이면 5 XP 를 줍니다.
 */

import rawWords from "../../../data/english/elementary800_words.json";
import { addCharacterXp } from "@/lib/data/mock-store";
import { ENGLISH_DAILY_MAX, shuffle } from "@/lib/game/english-quiz";
import { todayInSeoul } from "@/lib/game/mission-config";
import type { ActionResult } from "@/types/game";
import type { EnglishAnswerResult, EnglishLevelSummary, EnglishQuizStart, EnglishStats, WrongWord } from "@/types/english";

interface WordRow {
  id: number;
  word: string;
  level: number;
  meaning: string;
  example: string;
  exampleKo: string;
}

interface RawWord {
  no: number;
  word: string;
  level: number;
  meaning_ko_source: string;
  example_en_source: string;
  example_ko_source: string;
}

// 번호 순서대로 1부터 번호를 매깁니다 (시드 SQL과 같은 방식).
const WORDS: WordRow[] = ((rawWords as unknown as { words: RawWord[] }).words)
  .slice()
  .sort((a, b) => a.no - b.no)
  .map((w, i) => ({
    id: i + 1,
    word: w.word,
    level: w.level,
    meaning: w.meaning_ko_source,
    example: w.example_en_source,
    exampleKo: w.example_ko_source,
  }));

const BY_ID = new Map(WORDS.map((w) => [w.id, w]));

interface MockQuizItem {
  sessionId: string;
  day: string; // 퀴즈를 시작한 날짜 (서울 기준)
  wordId: number;
  choices: number[];
  answered: number | null;
  correct: boolean | null;
  elapsedMs: number; // 풀이 시간 (ms)
}

interface MockEnglishState {
  items: Map<string, MockQuizItem>;
  progress: Map<number, { correct: number; attempt: number }>;
  maxLevel: number; // 보호자가 연 가장 높은 레벨 (처음에는 1)
  dailySessions: Map<string, number>; // 날짜별 퀴즈 횟수
}

const globalForEnglish = globalThis as typeof globalThis & { __dluEnglishState?: MockEnglishState };

function englishState(): MockEnglishState {
  if (!globalForEnglish.__dluEnglishState) {
    globalForEnglish.__dluEnglishState = { items: new Map(), progress: new Map(), maxLevel: 1, dailySessions: new Map() };
  }
  return globalForEnglish.__dluEnglishState;
}

/** 뜻을 쉼표·슬래시로 나눈 낱개 뜻 목록 (예: "남자,녀석" → ["남자", "녀석"]) */
function senses(meaning: string): string[] {
  return meaning
    .split(/[,/·]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** 틀린 영어 퀴즈 목록 (최근 것부터, 개발용 데이터) */
export function mockWrongEnglish(limit: number): {
  itemId: string;
  word: string;
  correctMeaning: string;
  myMeaning: string;
  exampleEn: string;
  exampleKo: string;
}[] {
  const state = englishState();
  const items = [...state.items.entries()].reverse();
  const rows: ReturnType<typeof mockWrongEnglish> = [];
  for (const [id, item] of items) {
    if (item.answered === null || item.correct !== false) continue;
    const word = BY_ID.get(item.wordId);
    if (!word) continue;
    rows.push({
      itemId: id,
      word: word.word,
      correctMeaning: word.meaning,
      myMeaning: BY_ID.get(item.answered)?.meaning ?? "",
      exampleEn: word.example,
      exampleKo: word.exampleKo,
    });
    if (rows.length >= limit) break;
  }
  return rows;
}

export function mockEnglishDailyUsed(): number {
  return englishState().dailySessions.get(todayInSeoul()) ?? 0;
}

export const ENGLISH_LEVEL_COUNT = 3;

export function mockEnglishStats(): EnglishStats {
  const state = englishState();
  const byLevel = Array.from({ length: ENGLISH_LEVEL_COUNT }, (_, i) => ({ level: i + 1, total: 0, correct: 0 }));
  let total = 0;
  let correct = 0;
  state.progress.forEach((row, wordId) => {
    const word = BY_ID.get(wordId);
    if (!word) return;
    total += row.attempt;
    correct += row.correct;
    byLevel[word.level - 1].total += row.attempt;
    byLevel[word.level - 1].correct += row.correct;
  });
  let totalMs = 0;
  let todayMs = 0;
  const today = todayInSeoul();
  state.items.forEach((item) => {
    if (item.answered === null) return;
    totalMs += item.elapsedMs;
    if (item.day === today) todayMs += item.elapsedMs;
  });
  return { total, correct, byLevel, totalMs, todayMs };
}

export function mockWrongWords(level: number): WrongWord[] {
  const state = englishState();
  return WORDS.filter((w) => w.level === level && (state.progress.get(w.id)?.attempt ?? 0) > (state.progress.get(w.id)?.correct ?? 0))
    .map((w) => {
      const row = state.progress.get(w.id)!;
      return {
        id: w.id,
        word: w.word,
        meaning: w.meaning,
        example: w.example,
        exampleKo: w.exampleKo,
        wrong: row.attempt - row.correct,
        attempts: row.attempt,
        correct: row.correct,
      };
    })
    .sort((a, b) => b.wrong - a.wrong || a.word.localeCompare(b.word));
}

export function mockEnglishSummary(): EnglishLevelSummary[] {
  const state = englishState();
  return Array.from({ length: ENGLISH_LEVEL_COUNT }, (_, i) => i + 1).map((level) => {
    const words = WORDS.filter((w) => w.level === level);
    const learned = words.filter((w) => (state.progress.get(w.id)?.correct ?? 0) > 0).length;
    return { level, total: words.length, learned, unlocked: level <= state.maxLevel };
  });
}

export function mockSetEnglishMaxLevel(level: number): ActionResult<null> {
  if (level < 1 || level > ENGLISH_LEVEL_COUNT) return { ok: false, error: "레벨은 1~3 중에서 골라 주세요." };
  englishState().maxLevel = level;
  return { ok: true, data: null };
}

export function mockStartEnglishQuiz(level: number, count: number, wrongOnly = false): ActionResult<EnglishQuizStart> {
  if (level < 1 || level > ENGLISH_LEVEL_COUNT) return { ok: false, error: "레벨은 1~3 중에서 골라 주세요." };
  if (level > englishState().maxLevel) return { ok: false, error: "아직 잠긴 레벨이에요. 보호자가 열어 주면 시작할 수 있어요." };
  if (count < 1 || count > 20) return { ok: false, error: "문제 수는 1~20개예요." };
  const state = englishState();
  const pool = WORDS.filter(
    (w) =>
      w.level === level &&
      (!wrongOnly || (state.progress.get(w.id)?.attempt ?? 0) > (state.progress.get(w.id)?.correct ?? 0)),
  );
  if (wrongOnly && pool.length === 0) return { ok: false, error: "오답이 없어요. 먼저 퀴즈를 풀어 보세요." };
  if (pool.length < 4) return { ok: false, error: "이 레벨에는 아직 단어가 부족해요." };
  const allInLevel = WORDS.filter((w) => w.level === level);

  const today = todayInSeoul();
  const usedToday = state.dailySessions.get(today) ?? 0;
  if (usedToday >= ENGLISH_DAILY_MAX) {
    return { ok: false, error: "오늘 퀴즈를 5회 모두 풀었어요. 내일 다시 만나요!" };
  }
  state.dailySessions.set(today, usedToday + 1);

  const sessionId = crypto.randomUUID();
  const picked = shuffle(pool).slice(0, Math.min(count, pool.length));

  const items = picked.map((target, idx) => {
    // 정답과 뜻이 같은 단어는 보기로 뽑지 않습니다 (정답이 두 개가 되는 것을 막기 위해).
    const targetSenses = senses(target.meaning);
    const distractors = shuffle(
      allInLevel.filter(
        (w) => w.id !== target.id && !senses(w.meaning).some((s) => targetSenses.includes(s)),
      ),
    ).slice(0, 3);
    const choices = shuffle([target.id, ...distractors.map((d) => d.id)]);
    const itemId = crypto.randomUUID();
    state.items.set(itemId, {
      sessionId,
      day: today,
      wordId: target.id,
      choices,
      answered: null,
      correct: null,
      elapsedMs: 0,
    });
    return {
      id: itemId,
      idx,
      word: target.word,
      choices: choices.map((id) => ({ id, meaning: BY_ID.get(id)?.meaning ?? "" })),
    };
  });

  return { ok: true, data: { sessionId, items } };
}

export function mockAnswerEnglishQuiz(itemId: string, choiceId: number, elapsedMs: number): ActionResult<EnglishAnswerResult> {
  const state = englishState();
  const item = state.items.get(itemId);
  if (!item) return { ok: false, error: "문제를 찾을 수 없어요. 다시 시작해 주세요." };
  if (item.answered !== null) return { ok: false, error: "이미 답한 문제예요." };
  if (!item.choices.includes(choiceId)) return { ok: false, error: "보기 중에서 골라 주세요." };

  const correct = choiceId === item.wordId;
  item.answered = choiceId;
  item.correct = correct;
  item.elapsedMs = elapsedMs;

  const row = state.progress.get(item.wordId) ?? { correct: 0, attempt: 0 };
  row.attempt += 1;
  if (correct) row.correct += 1;
  state.progress.set(item.wordId, row);

  if (correct) {
    addCharacterXp(5);
  }

  const target = BY_ID.get(item.wordId)!;
  return {
    ok: true,
    data: {
      correct,
      correctWordId: target.id,
      correctMeaning: target.meaning,
      example: target.example,
      exampleKo: target.exampleKo,
    },
  };
}
