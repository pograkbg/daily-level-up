#!/usr/bin/env node
/**
 * 예문 수집 스크립트 (개발자 PC에서 가끔 한 번씩 실행합니다. 앱 실행 중에는 쓰지 않습니다.)
 *
 * 사용법 (프로젝트 폴더에서):
 *   node scripts/build-examples.mjs
 *   node scripts/build-examples.mjs --target=10 --max-requests=300 --delay=1000
 *
 * 하는 일:
 *  1. Tatoeba API 에서 영어 문장(한국어 번역 포함)을 무작위 순서로 받습니다.
 *  2. 초등용 조건으로 거릅니다 (짧은 문장, CC BY 라이선스, 승인된 문장, 금칙어 없음).
 *  3. 우리 단어 목록(data/english/elementary800_words.json)의 단어가 들어 있는 문장만 단어별로 모읍니다.
 *  4. 단어당 목표 개수(기본 10)까지 모으면 멈춥니다.
 *
 * 결과 (scripts/output/ 폴더):
 *  - coverage.csv      : 단어별 확보 개수 (부족한 단어 확인용)
 *  - preview.csv       : 수집된 예문 미리보기 (사람이 훑어보는 용도)
 *  - insert.sql        : DB 에 넣을 SQL (0018 마이그레이션의 english_examples 테이블이 있어야 실행됩니다)
 *
 * 주의:
 *  - 외부 API 는 이 스크립트에서만 호출합니다. 앱은 DB 만 읽습니다.
 *  - 요청 사이에 기본 1초를 쉽니다. 서버에 부담을 주지 않기 위해서입니다.
 *  - 이 스크립트는 API 키가 필요 없습니다.
 */

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const ROOT = join(here, "..");
const WORDS_FILE = join(ROOT, "data", "english", "elementary800_words.json");
const OUT_DIR = join(here, "output");

const START_URL =
  "https://api.tatoeba.org/v1/sentences?lang=eng&trans:lang=kor&showtrans:lang=kor&sort=random&limit=100";
const USER_AGENT = "daily-level-up-example-builder/0.1";

// 명령줄 옵션 읽기
const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [key, value] = a.replace(/^--/, "").split("=");
    return [key, value ?? "true"];
  }),
);
const TARGET = Number(args.target ?? 10); // 단어당 목표 개수
const MAX_REQUESTS = Number(args["max-requests"] ?? 300); // API 요청 최대 횟수
const DELAY_MS = Number(args.delay ?? 1000); // 요청 사이 대기 (ms)

// 초등 학습용 금칙어 (필요하면 계속 추가하세요)
const BANNED = new Set([
  "fuck", "shit", "bitch", "damn", "bastard", "sex", "drunk", "drug", "drugs",
  "gun", "guns", "kill", "killed", "murder", "blood", "war", "suicide",
]);

const MAX_EN_WORDS = 8; // 영어 문장 최대 단어 수
const MAX_KO_CHARS = 25; // 한국어 번역 최대 글자 수

// ---------- 단어 목록 ----------
const raw = JSON.parse(readFileSync(WORDS_FILE, "utf8"));
const words = raw.words.map((w) => String(w.word).trim().toLowerCase()).filter(Boolean);
const wordSet = new Set(words);
const pool = new Map(words.map((w) => [w, []]));

// ---------- 도우미 ----------
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** 영어 문장을 소문자 단어 목록으로 나눕니다. */
function tokens(text) {
  return (text.toLowerCase().match(/[a-z]+(?:'[a-z]+)?/g) ?? []);
}

/** 이 문장이 조건에 맞는지 확인하고, 맞으면 단어별 풀에 넣습니다. */
const seenSentenceIds = new Set();
let accepted = 0;

function handleSentence(s) {
  if (s.is_unapproved) return;
  if (seenSentenceIds.has(s.id)) return;
  seenSentenceIds.add(s.id);

  // 라이선스: CC BY 계열만, 비상업(NC) 제외
  const license = String(s.license ?? "");
  if (!/^CC BY/.test(license) || /NC/.test(license)) return;

  // 영어 문장 길이와 금칙어
  const enTokens = tokens(s.text);
  if (enTokens.length === 0 || enTokens.length > MAX_EN_WORDS) return;
  if (enTokens.some((t) => BANNED.has(t))) return;

  // 한국어 번역 (승인된 것 중 첫 번째)
  const tr = (s.translations ?? []).find((t) => t.lang === "kor" && !t.is_unapproved && t.text);
  if (!tr) return;
  const ko = String(tr.text).trim();
  if ([...ko].length > MAX_KO_CHARS) return;

  // 우리 단어가 들어 있는지 확인
  const matches = [...new Set(enTokens)].filter((t) => wordSet.has(t));
  if (matches.length === 0) return;

  for (const w of matches) {
    const list = pool.get(w);
    if (list.length >= TARGET) continue;
    list.push({
      enId: s.id,
      koId: tr.id,
      en: String(s.text).trim(),
      ko,
      owner: String(s.owner ?? ""),
      license,
    });
  }
  accepted += 1;
}

function allFull() {
  for (const list of pool.values()) {
    if (list.length < TARGET) return false;
  }
  return true;
}

// ---------- 수집 ----------
async function collect() {
  let url = START_URL;
  let requests = 0;
  console.log(`단어 ${words.length}개, 목표 ${TARGET}개씩, 최대 요청 ${MAX_REQUESTS}회`);

  while (url && requests < MAX_REQUESTS) {
    if (allFull()) {
      console.log("모든 단어가 목표 개수에 도달했습니다.");
      break;
    }
    const res = await fetch(url, {
      headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
    });
    requests += 1;
    if (!res.ok) {
      console.error(`요청 실패 (${res.status}). 여기서 멈춥니다.`);
      break;
    }
    const json = await res.json();
    for (const s of json.data ?? []) handleSentence(s);

    if (requests % 10 === 0) {
      const filled = [...pool.values()].filter((l) => l.length >= TARGET).length;
      console.log(`요청 ${requests}회 · 채택 문장 ${accepted}개 · 목표 도달 단어 ${filled}/${words.length}`);
    }

    url = json.paging?.has_next ? json.paging.next : null;
    await sleep(DELAY_MS);
  }
  console.log(`끝. 요청 ${requests}회, 채택 문장 ${accepted}개.`);
}

// ---------- 결과 파일 ----------
function csvCell(value) {
  const text = String(value ?? "").replace(/"/g, '""');
  return `"${text}"`;
}

function sqlText(value) {
  return `'${String(value ?? "").replace(/'/g, "''")}'`;
}

function writeOutputs() {
  mkdirSync(OUT_DIR, { recursive: true });

  // 1) 커버리지 보고서
  const coverageLines = ["word,count,status"];
  for (const w of words) {
    const n = pool.get(w).length;
    const status = n === 0 ? "없음" : n < 5 ? "부족(1~4)" : n < TARGET ? "보통(5~9)" : "충분";
    coverageLines.push(`${csvCell(w)},${n},${csvCell(status)}`);
  }
  writeFileSync(join(OUT_DIR, "coverage.csv"), coverageLines.join("\n"), "utf8");

  // 2) 미리보기 CSV
  const previewLines = ["word,tatoeba_en_id,tatoeba_ko_id,en,ko,owner,license"];
  const rows = [];
  for (const w of words) {
    for (const item of pool.get(w)) {
      rows.push({ word: w, ...item });
      previewLines.push(
        [w, item.enId, item.koId, item.en, item.ko, item.owner, item.license].map(csvCell).join(","),
      );
    }
  }
  writeFileSync(join(OUT_DIR, "preview.csv"), previewLines.join("\n"), "utf8");

  // 3) DB 입력용 SQL (english_examples 는 0018 마이그레이션에서 만듭니다)
  const values = rows
    .map(
      (r) =>
        `  (${sqlText(r.word)}, ${Number(r.enId)}, ${Number(r.koId)}, ${sqlText(r.en)}, ${sqlText(r.ko)}, ${sqlText(r.owner)}, ${sqlText(r.license)})`,
    )
    .join(",\n");
  const sql = [
    "-- 자동 생성: scripts/build-examples.mjs",
    "-- 0018 마이그레이션 실행 후 SQL Editor 에서 실행하세요.",
    "insert into public.english_examples (word_id, tatoeba_en_id, tatoeba_ko_id, en, ko, owner, license)",
    "select w.id, v.en_id, v.ko_id, v.en, v.ko, v.owner, v.license",
    "from (values",
    values || "  (null, null, null, null, null, null, null)",
    ") as v(word, en_id, ko_id, en, ko, owner, license)",
    "join public.english_words w on w.word = v.word",
    "where v.word is not null",
    "on conflict (word_id, tatoeba_en_id) do nothing;",
    "",
  ].join("\n");
  writeFileSync(join(OUT_DIR, "insert.sql"), sql, "utf8");

  const filled = [...pool.values()].filter((l) => l.length >= TARGET).length;
  const empty = [...pool.values()].filter((l) => l.length === 0).length;
  console.log("");
  console.log(`결과 파일: ${OUT_DIR}`);
  console.log(`  - 예문 총 ${rows.length}개`);
  console.log(`  - 목표(${TARGET}개) 도달 단어: ${filled}/${words.length}`);
  console.log(`  - 예문 0개 단어: ${empty}개 (coverage.csv 에서 확인)`);
}

await collect();
writeOutputs();
