"use client";

import Link from "next/link";
import { useRef, useState, useTransition, useEffect } from "react";
import { getPronunciationAction } from "@/app/english/actions";
import { recordEarlyAction } from "@/app/early/actions";
import { PronounceButton } from "@/components/english/PronounceButton";
import type { EarlyItem, EarlySubject } from "@/lib/data/early-repository";
import { playCorrectChime, playWrongTone } from "@/lib/sound";

interface EarlyQuizProps {
  title: string;
  subject: EarlySubject;
  items: EarlyItem[];
  /** 학년 (0 = 유아). 1학년 영어에만 발음 기호를 보여 줍니다. */
  grade: number;
  /** 모의고사: 통과에 필요한 정답 수. 있으면 결과 화면에 통과 여부를 보여 줍니다. */
  passScore?: number;
}

const LETTERS = ["A", "B", "C", "D"];

/** 현재 시각(ms). 풀이 시간을 재기 위해서만 씁니다. */
function clockMs(): number {
  return Date.now();
}

/**
 * 유아·1학년 문제 풀이 화면. 한 문제에 보기 4개 중 하나를 고릅니다.
 * 정답 소리는 기존과 같고, 기록은 아이 정보로 저장됩니다.
 */
export function EarlyQuiz({ title, subject, items, grade, passScore }: EarlyQuizProps) {
  const [index, setIndex] = useState(0);
  const [chosen, setChosen] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const startedAt = useRef(0);
  const [ipaState, setIpaState] = useState<{ word: string; ipa: string } | null>(null);

  useEffect(() => {
    startedAt.current = clockMs();
  }, [index]);

  const total = items.length;
  const current = items[index];

  // 영어 단어(글자로 된 문제)에만 듣기 버튼을 붙입니다.
  const englishWord =
    subject === "english" && current && /^[A-Za-z][A-Za-z -]*$/.test(current.prompt) ? current.prompt : null;

  // 1학년 영어만 발음 기호를 가져옵니다. 유아는 기호 없이 듣기 버튼만 보입니다.
  useEffect(() => {
    if (!englishWord || grade !== 1) return;
    let cancelled = false;
    getPronunciationAction(englishWord).then((result) => {
      if (!cancelled && result.ok && result.data.ipa) {
        setIpaState({ word: englishWord, ipa: result.data.ipa });
      }
    });
    return () => {
      cancelled = true;
    };
  }, [englishWord, grade]);

  const ipaText = englishWord && ipaState?.word === englishWord ? ipaState.ipa : null;

  if (total === 0) {
    return (
      <div className="mx-auto flex w-full max-w-md flex-col items-center gap-4 rounded-[2rem] bg-white p-8 text-center shadow-xl">
        <p className="text-lg font-extrabold text-ink">아직 문제가 없어요.</p>
        <Link href="/early" className="font-bold text-primary-dark underline">
          다시 고르기
        </Link>
      </div>
    );
  }

  if (!current) {
    return (
      <div className="mx-auto flex w-full max-w-md flex-col items-center gap-6 rounded-[2rem] bg-white p-8 text-center shadow-xl">
        <span className="text-6xl" aria-hidden>
          🏆
        </span>
        <h2 className="text-2xl font-extrabold text-ink">{title} 끝!</h2>
        <p className="text-lg font-bold text-ink">
          {total}문제 중 <span className="text-primary">{score}</span>개 맞혔어요
        </p>
        {passScore !== undefined && (
          <p className={`rounded-2xl px-5 py-3 text-lg font-extrabold ${score >= passScore ? "bg-xp/40 text-ink" : "bg-ink/5 text-ink-soft"}`}>
            {score >= passScore
              ? "🎉 모의고사 통과! 다음 학기로 넘어갈 수 있어요."
              : `아쉬워요. ${passScore}개 이상 맞히면 통과예요.`}
          </p>
        )}
        <div className="flex w-full flex-col gap-3 sm:flex-row">
          <Link href="/early" className="flex min-h-14 flex-1 items-center justify-center rounded-2xl bg-primary font-bold text-white">
            다른 놀이 하기
          </Link>
          <Link href="/" className="flex min-h-14 flex-1 items-center justify-center rounded-2xl bg-ink/5 font-bold text-ink">
            홈으로
          </Link>
        </div>
      </div>
    );
  }

  const answered = chosen !== null;
  const percent = Math.round((index / total) * 100);

  function choose(choice: string) {
    if (answered || pending || !current) return;
    const correct = choice === current.answer;
    const elapsedMs = clockMs() - startedAt.current;
    setChosen(choice);
    setError(null);
    if (correct) {
      setScore((s) => s + 1);
      playCorrectChime();
    } else {
      playWrongTone();
    }
    startTransition(async () => {
      const result = await recordEarlyAction({
        problemId: current.problemId,
        kind: current.kind,
        input: choice,
        correct,
        elapsedMs,
      });
      if (!result.ok) setError(result.error);
    });
  }

  function next() {
    setChosen(null);
    setError(null);
    setIndex((i) => i + 1);
  }

  const isMath = subject === "math";
  const promptClass = isMath ? "text-5xl font-extrabold sm:text-6xl" : "text-5xl font-extrabold sm:text-6xl";

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-5">
      <div className="flex items-center gap-4">
        <Link href="/early" aria-label="놀이 닫기" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-xl font-bold text-ink shadow-md">
          ✕
        </Link>
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div className="flex items-center justify-between text-sm font-bold text-ink">
            <span className="truncate">{title}</span>
            <span>
              {index + 1} / {total}
            </span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-ink/10" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
            <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${percent}%` }} />
          </div>
        </div>
      </div>

      <section className="flex flex-col items-center gap-6 rounded-[2rem] border-4 border-white bg-white p-6 text-center shadow-xl sm:p-10">
        <p className="text-lg font-extrabold text-primary-dark">
          {isMath ? "알맞은 답을 골라요" : "알맞은 뜻이나 글자를 골라요"}
        </p>
        <p className={`break-words ${promptClass} text-ink`}>{current.prompt}</p>
        {ipaText && <p className="text-xl font-bold text-ink-soft">/{ipaText.replace(/^\/|\/$/g, "")}/</p>}
        {englishWord && <PronounceButton word={englishWord} />}

        <div className="grid w-full grid-cols-2 gap-3 sm:gap-4">
          {current.choices.map((choice, i) => {
            const isCorrect = answered && choice === current.answer;
            const isWrong = answered && chosen === choice && choice !== current.answer;
            return (
              <button
                key={`${current.key}-${choice}`}
                type="button"
                disabled={answered || pending}
                onClick={() => choose(choice)}
                className={`flex min-h-20 items-center justify-center gap-3 rounded-2xl border-2 px-4 py-3 text-2xl font-extrabold shadow-md transition sm:min-h-24 sm:text-3xl ${
                  isCorrect
                    ? "border-xp bg-xp text-white"
                    : isWrong
                      ? "border-red-400 bg-red-400 text-white"
                      : "border-white bg-white text-ink"
                }`}
              >
                <span className="text-base text-ink-soft" aria-hidden>
                  {LETTERS[i] ?? i + 1}
                </span>
                {choice}
              </button>
            );
          })}
        </div>

        {error && (
          <p role="alert" className="font-bold text-red-500">
            {error}
          </p>
        )}

        {answered && (
          <div className="flex w-full flex-col items-center gap-3">
            <p className="text-xl font-extrabold text-ink">
              {chosen === current.answer ? "🎉 잘했어요!" : `괜찮아요. 정답은 ${current.answer}`}
            </p>
            <button
              type="button"
              onClick={next}
              className="flex min-h-14 w-full items-center justify-center rounded-2xl bg-primary font-extrabold text-white shadow-md"
            >
              {index + 1 < total ? "다음 문제" : "결과 보기"}
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
