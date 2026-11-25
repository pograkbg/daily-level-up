/**
 * 발음 기호 조회 (서버 전용). Free Dictionary API 사용.
 *
 * - 엔드포인트: GET https://freedictionaryapi.com/api/v1/entries/en/{word}
 * - 응답에는 발음 기호(IPA) 텍스트만 있고 소리 파일은 없습니다. 소리는 기기 음성으로 냅니다.
 * - 데이터 라이선스: CC BY-SA 4.0 (Wiktionary). 화면에 출처를 함께 표시합니다.
 * - 호출 제한: IP당 시간당 1,000회. 같은 단어는 메모리에 잠시 저장해서 다시 부르지 않습니다.
 */

const API_BASE = "https://freedictionaryapi.com/api/v1";
const WORD_PATTERN = /^[a-z]+(?:['-][a-z]+)*$/;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

export interface PronunciationResult {
  word: string;
  ipa: string | null; // 예: /bʌy/
  source: { name: string; url: string };
}

interface CacheEntry {
  value: PronunciationResult;
  at: number;
}

const globalForPron = globalThis as typeof globalThis & { __dluPronCache?: Map<string, CacheEntry> };
const cache = (globalForPron.__dluPronCache ??= new Map<string, CacheEntry>());

export function isValidEnglishWord(word: string): boolean {
  return WORD_PATTERN.test(word) && word.length <= 40;
}

export async function fetchPronunciation(word: string): Promise<PronunciationResult | null> {
  const key = word.toLowerCase();
  if (!isValidEnglishWord(key)) return null;

  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.value;

  const fallbackSource = { name: "FreeDictionaryAPI.com (Wiktionary, CC BY-SA 4.0)", url: "https://freedictionaryapi.com" };

  try {
    const res = await fetch(`${API_BASE}/entries/en/${encodeURIComponent(key)}`, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) {
      console.error("[pronunciation] API status", res.status);
      return { word: key, ipa: null, source: fallbackSource };
    }
    const json = (await res.json()) as {
      entries?: { pronunciations?: { type: string; text: string }[] }[];
      source?: { url?: string; license?: { name?: string } };
    };

    const ipa =
      json.entries?.flatMap((e) => e.pronunciations ?? []).find((p) => p.type === "ipa")?.text ?? null;

    const value: PronunciationResult = {
      word: key,
      ipa,
      source: {
        name: json.source?.license?.name
          ? `${json.source.license.name} · FreeDictionaryAPI.com`
          : fallbackSource.name,
        url: json.source?.url ?? fallbackSource.url,
      },
    };
    cache.set(key, { value, at: Date.now() });
    return value;
  } catch (error) {
    console.error("[pronunciation] fetch failed:", error instanceof Error ? error.message : error);
    return { word: key, ipa: null, source: fallbackSource };
  }
}
