/**
 * 음성 파일 주소 조회 (서버 전용). dictionaryapi.dev 사용.
 *
 * - 파일을 저장하지 않습니다. 주소만 찾아 브라우저가 바로 재생합니다.
 * - 이 음성은 이용 조건이 명시되어 있지 않습니다. 가족용 비상업 서비스로 쓰는 것을 전제로 하며,
 *   화면에 출처와 주의 문구를 함께 표시합니다.
 * - 켜고 끄기: .env.local 의 ENGLISH_AUDIO 값
 *   - dictionaryapi  : 음성 파일 사용
 *   - (비어 있음)     : 기기 음성 사용 (기본값)
 */

const API = "https://api.dictionaryapi.dev/api/v2/entries/en";
const WORD_PATTERN = /^[a-z]+(?:['-][a-z]+)*$/;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

interface AudioEntry {
  url: string | null;
  at: number;
}

const globalForAudio = globalThis as typeof globalThis & { __dluAudioCache?: Map<string, AudioEntry> };
const cache = (globalForAudio.__dluAudioCache ??= new Map<string, AudioEntry>());

export function isDictionaryAudioEnabled(): boolean {
  return process.env.ENGLISH_AUDIO === "dictionaryapi";
}

/** 단어의 음성 파일 주소 (없으면 null). 파일 자체는 저장하지 않습니다. */
export async function findAudioUrl(word: string): Promise<string | null> {
  const key = word.toLowerCase();
  if (!WORD_PATTERN.test(key) || key.length > 40) return null;

  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.url;

  try {
    const res = await fetch(`${API}/${encodeURIComponent(key)}`, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) {
      cache.set(key, { url: null, at: Date.now() });
      return null;
    }
    const json = (await res.json()) as { phonetics?: { audio?: string }[] }[];
    const audio = json.flatMap((entry) => entry.phonetics ?? []).map((p) => p.audio).find((a) => !!a && a.length > 0);

    // 주소가 "//" 로 시작하면 https 를 붙입니다. https 주소만 허용합니다.
    const url = audio ? (audio.startsWith("//") ? `https:${audio}` : audio) : null;
    const safe = url && url.startsWith("https://") ? url : null;
    cache.set(key, { url: safe, at: Date.now() });
    return safe;
  } catch (error) {
    console.error("[audio] lookup failed:", error instanceof Error ? error.message : error);
    return null;
  }
}
