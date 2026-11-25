"use server";

/** 영어 서버 함수: 정답 확인, 레벨 잠금 설정, 발음 기호 조회 */

import {
  answerEnglishQuestion,
  getEnglishSummary,
  pickEnglishExample,
  setEnglishMaxLevel,
} from "@/lib/data/english-repository";
import { fetchPronunciation, isValidEnglishWord, type PronunciationResult } from "@/lib/data/english-pronunciation";
import { findAudioUrl, isDictionaryAudioEnabled } from "@/lib/data/english-audio";
import type { ActionResult } from "@/types/game";
import type { EnglishAnswerResult, EnglishExample } from "@/types/english";

/** 한 문제에 쓸 수 있는 최대 시간 (120초). 자리를 비운 시간은 학습 시간에서 뺍니다. */
const MAX_ELAPSED_MS = 120_000;

export async function answerEnglishAction(
  itemId: string,
  choiceId: number,
  elapsedMs: number,
): Promise<ActionResult<EnglishAnswerResult>> {
  if (typeof itemId !== "string" || !Number.isInteger(choiceId)) {
    return { ok: false, error: "잘못된 요청이에요." };
  }
  const safeElapsed = Number.isFinite(elapsedMs) ? Math.min(Math.max(Math.round(elapsedMs), 0), MAX_ELAPSED_MS) : 0;
  return answerEnglishQuestion(itemId, choiceId, safeElapsed);
}

/**
 * 보호자가 레벨을 열 때: 열려는 레벨 바로 앞 레벨까지 모두 깼는지 서버에서 확인합니다.
 * "깼다" = 그 레벨의 단어를 모두 한 번 이상 맞힌 것.
 */
/** "다른 예문 보기" 버튼: 같은 단어의 다른 예문을 한 개 고릅니다. */
export async function nextEnglishExampleAction(wordId: number): Promise<ActionResult<EnglishExample | null>> {
  if (!Number.isInteger(wordId) || wordId < 1) {
    return { ok: false, error: "잘못된 요청이에요." };
  }
  try {
    return { ok: true, data: await pickEnglishExample(wordId) };
  } catch {
    return { ok: false, error: "예문을 불러오지 못했어요." };
  }
}

export async function setEnglishMaxLevelAction(level: number): Promise<ActionResult<null>> {
  if (!Number.isInteger(level) || level < 1 || level > 3) {
    return { ok: false, error: "레벨은 1~3 중에서 골라 주세요." };
  }
  const summary = await getEnglishSummary();
  const currentMax = summary.filter((s) => s.unlocked).reduce((max, s) => Math.max(max, s.level), 0);
  if (level > currentMax) {
    for (let lv = currentMax + 1; lv < level; lv++) {
      const prev = summary.find((s) => s.level === lv);
      if (!prev || prev.learned < prev.total) {
        return { ok: false, error: `${lv}레벨을 모두 깨야 ${level}레벨을 열 수 있어요.` };
      }
    }
  }
  return setEnglishMaxLevel(level);
}

export async function getAudioAction(word: string): Promise<ActionResult<{ url: string | null; enabled: boolean }>> {
  if (typeof word !== "string" || !isValidEnglishWord(word.toLowerCase())) {
    return { ok: false, error: "음성을 찾을 수 없는 단어예요." };
  }
  const enabled = isDictionaryAudioEnabled();
  if (!enabled) return { ok: true, data: { url: null, enabled: false } };
  const url = await findAudioUrl(word);
  return { ok: true, data: { url, enabled: true } };
}

export async function getPronunciationAction(word: string): Promise<ActionResult<PronunciationResult>> {
  if (typeof word !== "string" || !isValidEnglishWord(word.toLowerCase())) {
    return { ok: false, error: "발음을 찾을 수 없는 단어예요." };
  }
  const result = await fetchPronunciation(word);
  if (!result) return { ok: false, error: "발음 정보를 불러오지 못했어요." };
  return { ok: true, data: result };
}
