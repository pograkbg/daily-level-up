/**
 * 영어 학습(English Quest) 타입
 * 화면은 이 타입만 보고, 정답은 서버에서만 확인합니다.
 */

export interface EnglishChoice {
  id: number; // 단어 번호 (정답 여부는 알려주지 않음)
  meaning: string; // 한국어 뜻
}

export interface EnglishQuestion {
  id: string; // 문제 번호 (서버 기록용)
  idx: number;
  word: string; // 영어 단어
  choices: EnglishChoice[]; // 4지선다
  ipa?: string | null; // 발음 기호 (예: /bʌy/), 서버에서 채움
}

export interface EnglishLevelSummary {
  level: number; // 1 ~ 5
  total: number; // 레벨의 단어 수
  learned: number; // 한 번이라도 맞힌 단어 수
  unlocked: boolean; // 보호자가 연 레벨인지 (선택한 레벨까지만 열림)
  manualOpen?: boolean; // 관리자가 직접 연 레벨이면 true (앞 레벨을 깨지 않아도 열림)
}

/** 영어 학습 기록 (전체와 레벨별) */
export interface EnglishStats {
  total: number; // 푼 문제 수
  correct: number; // 맞힌 문제 수
  totalMs: number; // 전체 풀이 시간 (ms)
  todayMs: number; // 오늘 풀이 시간 (ms)
  byLevel: { level: number; total: number; correct: number }[];
}

/** 오답노트 항목 (한 번이라도 틀린 단어) */
export interface WrongWord {
  id: number;
  word: string;
  meaning: string;
  example: string;
  exampleKo: string;
  wrong: number; // 틀린 횟수
  attempts: number;
  correct: number;
}

export interface EnglishQuizStart {
  sessionId: string;
  items: EnglishQuestion[];
  /** 이어 풀기: 이미 푼 문제 수 (화면은 여기서부터 시작) */
  startIndex?: number;
  /** 이어 풀기: 지금까지 맞힌 개수 */
  score?: number;
}

export interface EnglishAnswerResult {
  correct: boolean;
  correctWordId: number;
  correctMeaning: string;
  example: string; // 영어 예문
  exampleKo: string; // 한국어 해석
  exampleSource?: { owner: string; license: string } | null; // Tatoeba 예문이면 출처 정보, 아니면 없음
}

/** 예문 풀(Tatoeba 기반)에서 고른 예문 한 개 */
export interface EnglishExample {
  id: number;
  en: string;
  ko: string;
  owner: string;
  license: string;
}
