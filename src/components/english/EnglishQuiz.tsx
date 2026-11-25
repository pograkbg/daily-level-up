"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { answerEnglishAction, nextEnglishExampleAction } from "@/app/english/actions";
import { PronounceButton } from "@/components/english/PronounceButton";
import { playCorrectChime, playWrongTone } from "@/lib/sound";
import { englishLevelName } from "@/lib/game/english-quiz";
import type { EnglishAnswerResult, EnglishExample, EnglishQuestion } from "@/types/english";

/** 예문 출처 문구. Tatoeba 예문이면 라이선스와 작성자를, 기본 예문이면 교육과정 자료 출처를 보여 줍니다. */
function exampleSourceText(owner: string, license: string): string {
  if (!license) return "예문 출처: 교육과정 단어 자료";
  return `예문 출처: Tatoeba · ${license}${owner ? ` · 작성자 ${owner}` : ""}`;
}

interface EnglishQuizProps {
  level: number;
  items: EnglishQuestion[];
  /** 이어 풀기: 이미 푼 문제 수 (앞에서부터 푼 문제). 0이면 처음부터. */
  startIndex?: number;
  /** 이어 풀기: 이미 맞힌 개수 */
  startScore?: number;
}

const LETTERS = ["A", "B", "C", "D"];

/** 현재 시각(ms). 풀이 시간을 재기 위해서만 씁니다. */
function clockMs(): number {
  return Date.now();
}
const LISTEN_REQUIRED = 2;

/**
 * 영어 4지선다 퀴즈 (단어 → 뜻 고르기).
 * 넓은 화면(lg 이상): 왼쪽 문제 카드 | 오른쪽 보기와 해설 (스크롤 없이 한 화면)
 * 좁은 화면: 위에서 아래로 쌓임
 * 정답은 서버에서 확인하고, 발음을 두 번 들어야 답할 수 있습니다.
 */
export function EnglishQuiz({ level, items, startIndex = 0, startScore = 0 }: EnglishQuizProps) {
  const [index, setIndex] = useState(startIndex);
  const [feedback, setFeedback] = useState<EnglishAnswerResult | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(startScore);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  // 이어 풀기: 앞에서 이미 푼 문제는 답한 것으로 표시해 다시 답하지 않게 합니다.
  const [answeredIds, setAnsweredIds] = useState<string[]>(() => items.slice(0, startIndex).map((item) => item.id));
  const [plays, setPlays] = useState(0);
  const listened = plays >= LISTEN_REQUIRED;
  // 해설 예문: 기본은 채점 결과의 예문, "다른 예문 보기"는 문제당 한 번만 누를 수 있습니다.
  const [extra, setExtra] = useState<EnglishExample | null>(null);
  const [extraTried, setExtraTried] = useState(false);
  const [extraLoading, setExtraLoading] = useState(false);
  const [extraMessage, setExtraMessage] = useState<string | null>(null);

  function loadOtherExample() {
    if (!feedback || extraLoading) return;
    setExtraLoading(true);
    setExtraMessage(null);
    nextEnglishExampleAction(feedback.correctWordId)
      .then((result) => {
        if (!result.ok) {
          setExtraMessage(result.error);
        } else if (result.data) {
          setExtra(result.data);
        } else {
          setExtraMessage("다른 예문이 아직 없어요.");
        }
      })
      .catch(() => setExtraMessage("예문을 불러오지 못했어요."))
      .finally(() => {
        setExtraTried(true);
        setExtraLoading(false);
      });
  }
  // 문제가 뜬 시각 (풀이 시간 측정용). 다음 문제로 넘어갈 때 다시 잽니다.
  const questionStartedAt = useRef<number>(0);
  const answeringRef = useRef(false);
  // 이미 답이 기록된 문제라 결과 화면이 없을 때 "다음 문제" 버튼을 보여 줍니다.
  const [canSkip, setCanSkip] = useState(false);
  useEffect(() => {
    questionStartedAt.current = Date.now();
  }, []);

  const total = items.length;
  const current = items[index];
  const percent = total === 0 ? 0 : Math.round((index / total) * 100);

  function choose(choiceId: number) {
    // 답을 보내는 중에는 다시 누를 수 없게 바로 잠급니다 (두 번 보내면 "이미 답한 문제"가 됩니다).
    if (answeringRef.current || pending || feedback || !current || answeredIds.includes(current.id) || !listened) return;
    answeringRef.current = true;
    setSelected(choiceId);
    setError(null);
    const elapsedMs = clockMs() - questionStartedAt.current;
    startTransition(async () => {
      const result = await answerEnglishAction(current.id, choiceId, elapsedMs);
      if (result.ok) {
        setFeedback(result.data);
        setAnsweredIds((prev) => [...prev, current.id]);
        if (result.data.correct) {
          setScore((s) => s + 1);
          playCorrectChime();
        } else {
          playWrongTone();
        }
      } else if (result.error === "이미 답한 문제예요.") {
        // 이미 답이 기록된 문제입니다. 결과 화면이 없으니 다음 문제로 넘어갈 수 있게 합니다.
        setAnsweredIds((prev) => [...prev, current.id]);
        setCanSkip(true);
        setError(null);
      } else {
        setError(result.error);
        setSelected(null);
        answeringRef.current = false;
      }
    });
  }

  function next() {
    questionStartedAt.current = Date.now();
    setExtra(null);
    setExtraTried(false);
    setFeedback(null);
    setSelected(null);
    setPlays(0);
    setCanSkip(false);
    answeringRef.current = false;
    setIndex((i) => i + 1);
  }

  if (index >= total) {
    return (
      <div className="mx-auto flex w-full max-w-xl flex-col items-center gap-6 rounded-[2rem] bg-white p-8 text-center shadow-xl">
        <span className="text-6xl" aria-hidden>🏆</span>
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-extrabold text-ink">{englishLevelName(level)} 완료!</h2>
          <p className="text-lg font-bold text-ink">
            {total}문제 중 <span className="text-primary">{score}</span>개 정답
          </p>
          <p className="text-sm text-ink-soft">맞힌 문제마다 경험치 5점을 받았어요.</p>
        </div>
        <div className="flex w-full flex-col gap-3 sm:flex-row">
          <Link href={`/english/notebook?level=${level}`} className="flex min-h-14 flex-1 items-center justify-center rounded-2xl bg-ink/5 font-bold text-ink">
            📒 오답노트 보기
          </Link>
          <Link href="/english" className="flex min-h-14 flex-1 items-center justify-center rounded-2xl bg-primary font-bold text-white shadow-md">
            레벨 선택으로
          </Link>
        </div>
      </div>
    );
  }

  if (!current) {
    return null;
  }

  const correctChoice = feedback?.correct ? feedback.correctWordId : null;
  const shownExample = extra
    ? { en: extra.en, ko: extra.ko, owner: extra.owner, license: extra.license }
    : {
        en: feedback?.example ?? "",
        ko: feedback?.exampleKo ?? "",
        owner: feedback?.exampleSource?.owner ?? "",
        license: feedback?.exampleSource?.license ?? "",
      };
  const panelTone = feedback ? (feedback.correct ? "bg-xp/15 border-xp" : "bg-red-100 border-red-300") : "";

  return (
    <div className="mx-auto flex w-full max-w-[960px] flex-col gap-5 [@media(max-height:860px)]:gap-2">
      {/* 상단: 닫기, 레벨, 진행 */}
      <div className="flex items-center gap-4">
        <Link
          href="/english"
          aria-label="퀴즈 닫기"
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-xl font-bold text-ink shadow-md"
        >
          ✕
        </Link>
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div className="flex items-center justify-between text-sm font-bold text-ink sm:text-base">
            <span className="truncate">{englishLevelName(level)}</span>
            <span className="shrink-0">
              {index + 1} / {total}
            </span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-ink/10" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
            <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${percent}%` }} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        {/* 왼쪽: 문제 카드 */}
        <section className="flex flex-col items-center gap-5 rounded-[2rem] border-4 border-white bg-white p-6 text-center shadow-xl sm:p-8 lg:min-h-[480px] lg:justify-center">
          <p className="text-sm font-extrabold tracking-wide text-primary-dark sm:text-lg">이 단어의 뜻은?</p>
          <div className="flex flex-col items-center gap-2">
            <p className="break-words text-4xl font-extrabold text-ink sm:text-5xl lg:text-6xl">{current.word}</p>
            {current.ipa ? (
              <p className="text-lg font-bold text-ink-soft sm:text-xl">/{current.ipa.replace(/^\/|\/$/g, "")}/</p>
            ) : (
              <p className="text-sm text-ink-soft sm:text-base">발음 기호 정보가 없어요</p>
            )}
          </div>

          <div className="flex flex-col items-center gap-2">
            <PronounceButton word={current.word} onPlay={() => setPlays((p) => p + 1)} />
            {!feedback && (
              <div className="flex items-center gap-2 text-sm font-bold text-ink-soft sm:text-base" aria-live="polite">
                {Array.from({ length: LISTEN_REQUIRED }, (_, i) => (
                  <span key={i} className={`h-3 w-3 rounded-full ${i < plays ? "bg-primary" : "bg-ink/15"}`} />
                ))}
                <span>{listened ? "이제 답을 고를 수 있어요" : `발음을 ${LISTEN_REQUIRED}번 들어 주세요`}</span>
              </div>
            )}
          </div>
        </section>

        {/* 오른쪽: 보기와 해설 */}
        <div className="flex flex-col gap-4">
          <section className="grid grid-cols-1 gap-3 sm:grid-cols-2" aria-label="보기">
            {current.choices.map((choice, i) => {
              const isSelected = selected === choice.id;
              const isCorrect = correctChoice === choice.id;
              const isWrong = !!feedback && isSelected && !feedback.correct;
              const locked = pending || feedback !== null || !listened;
              return (
                <button
                  key={choice.id}
                  type="button"
                  disabled={locked}
                  onClick={() => choose(choice.id)}
                  className={`flex min-h-20 items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left text-lg font-bold shadow-md transition sm:text-xl ${
                    isCorrect
                      ? "border-xp bg-xp text-white"
                      : isWrong
                        ? "border-red-400 bg-red-400 text-white"
                        : "border-white bg-white text-ink"
                  } ${locked && !isCorrect && !isWrong ? "opacity-60" : ""}`}
                >
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-base font-extrabold ${
                      isCorrect || isWrong ? "bg-white/25 text-white" : "bg-ink/5 text-ink"
                    }`}
                    aria-hidden
                  >
                    {LETTERS[i] ?? i + 1}
                  </span>
                  <span className="min-w-0 break-words">{choice.meaning}</span>
                </button>
              );
            })}
          </section>

          {error && (
            <p role="alert" className="text-center font-bold text-red-500">
              {error}
            </p>
          )}

          {canSkip && !feedback && (
            <div className="flex flex-col gap-2 rounded-2xl border-2 border-white bg-white p-4 text-center shadow-md">
              <p className="font-bold text-ink-soft">이 문제는 이미 답이 기록됐어요. 다음 문제로 넘어가 주세요.</p>
              <button
                type="button"
                onClick={next}
                className="flex min-h-14 items-center justify-center rounded-2xl bg-primary font-extrabold text-white shadow-md"
              >
                {index + 1 < total ? "다음 문제" : "결과 보기"}
              </button>
            </div>
          )}

          {feedback && (
            <section className={`flex flex-col gap-3 rounded-2xl border-2 p-5 [@media(max-height:860px)]:gap-2 [@media(max-height:860px)]:p-3 ${panelTone}`} aria-live="polite">
              <p className="text-xl font-extrabold text-ink sm:text-2xl">
                {feedback.correct ? "🎉 정답이에요! +5 XP" : `아쉬워요. 정답은 "${feedback.correctMeaning}"`}
              </p>
              <div className="flex flex-col gap-1 rounded-xl bg-white/70 p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-bold text-ink-soft sm:text-base">예문</p>
                  {!extraTried && (
                    <button
                      type="button"
                      disabled={extraLoading}
                      onClick={loadOtherExample}
                      className="text-sm font-extrabold text-primary-dark underline underline-offset-4 disabled:opacity-50"
                    >
                      {extraLoading ? "불러오는 중…" : "다른 예문 보기 ▸"}
                    </button>
                  )}
                </div>
                <p className="text-base text-ink sm:text-lg">{shownExample.en}</p>
                <p className="text-sm text-ink-soft sm:text-base">{shownExample.ko}</p>
                <p className="mt-1 text-xs font-bold text-ink-soft">{exampleSourceText(shownExample.owner, shownExample.license)}</p>
                {extraMessage && <p role="status" className="text-xs font-bold text-red-500">{extraMessage}</p>}
              </div>
              <button
                type="button"
                onClick={next}
                className="flex min-h-14 items-center justify-center rounded-2xl bg-primary font-extrabold text-white shadow-md"
              >
                {index + 1 < total ? "다음 문제" : "결과 보기"}
              </button>
            </section>
          )}
        </div>
      </div>

      {/* 하단 출처 */}
      <footer className="flex flex-col gap-2 pb-1 text-xs text-ink-soft sm:flex-row sm:flex-wrap sm:justify-center sm:gap-x-10 sm:gap-y-1 sm:text-sm [@media(max-height:860px)]:pb-0">
        <div className="flex flex-col items-center gap-1 text-center">
          <p className="text-base font-extrabold text-ink sm:text-lg">API 출처</p>
          <p>
            발음 기호:{" "}
            <a href="https://freedictionaryapi.com" target="_blank" rel="noreferrer" className="underline">
              FreeDictionaryAPI.com (Wiktionary, CC BY-SA 4.0)
            </a>
          </p>
          <p>음성: dictionaryapi.dev (저장하지 않고 재생만 합니다)</p>
          <p>
            예문 수집:{" "}
            <a href="https://tatoeba.org" target="_blank" rel="noreferrer" className="underline">
              Tatoeba API (CC BY 2.0 FR)
            </a>
          </p>
        </div>
        <div className="flex flex-col items-center gap-1 text-center">
          <p className="text-base font-extrabold text-ink sm:text-lg">자료 출처</p>
          <p>단어 목록: 교육부 고시 제2022-33호 [별책 14]</p>
        </div>
      </footer>
    </div>
  );
}
