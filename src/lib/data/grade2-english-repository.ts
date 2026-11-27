/**
 * 2학년 영어 단어 퀴즈 문제 만들기 (서버 전용). grade2_words 테이블을 읽습니다.
 * - 단어를 보고 뜻 4개 중 고릅니다.
 * - 오답은 같은 학기의 다른 단어 뜻에서 고르고, 같은 뜻은 피합니다.
 */

import type { EarlyItem } from "@/lib/data/early-repository";
import { shuffle } from "@/lib/game/early";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const QUESTIONS = 20;
export const MOCK_ENGLISH_QUESTIONS = 50;

interface WordRow {
  word: string;
  meaning_ko: string;
  category: string;
}

export async function loadGrade2English(semester: 1 | 2, count: number = QUESTIONS): Promise<EarlyItem[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("grade2_words")
    .select("word, meaning_ko, category")
    .eq("semester", semester);
  if (error) throw error;

  const words = (data ?? []) as WordRow[];
  const random = () => Math.random();
  const picked = shuffle(words, random).slice(0, count);

  return picked.map((w) => {
    const others = words.filter((o) => o.word !== w.word && o.meaning_ko !== w.meaning_ko);
    const wrong = shuffle(others, random)
      .map((o) => o.meaning_ko)
      .filter((m, i, arr) => arr.indexOf(m) === i)
      .slice(0, 3);
    return {
      key: w.word,
      problemId: null,
      kind: "grade2_word",
      prompt: w.word,
      choices: shuffle([w.meaning_ko, ...wrong], random),
      answer: w.meaning_ko,
    };
  });
}
