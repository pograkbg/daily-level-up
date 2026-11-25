"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { claimRewardAction, startNextAttemptAction, submitAnswerAction } from "@/app/mission/actions";
import { NumberPad } from "@/components/mission/NumberPad";
import { BgmPlayer } from "@/components/mission/BgmPlayer";
import { buttonClassName } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { ANSWER_MAX_DIGITS, MAX_MISSIONS_PER_DAY } from "@/lib/game/mission-config";
import { getMissionProgressPercent } from "@/lib/game/mission";
import { playCorrectChime, playWrongTone } from "@/lib/sound";
import type { AnswerResult, MissionView } from "@/types/game";

interface MissionScreenProps {
  initialView: MissionView;
  bgmSrc: string | null; // 레벨에 맞는 배경음악 (없으면 음악 없음)
}

/**
 * 오늘의 수학 미션 화면.
 * 정답 검사는 서버에서만 하고, 여기서는 결과와 해설을 보여줍니다.
 */
export function MissionScreen({ initialView, bgmSrc }: MissionScreenProps) {
  const [view, setView] = useState<MissionView>(initialView);
  const [input, setInput] = useState("");
  const [feedback, setFeedback] = useState<AnswerResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  // 문제가 화면에 뜬 시각 (풀이 시간 측정용). 피드백을 넘기면 다시 잽니다.
  const questionStartedAt = useRef<number>(0);
  useEffect(() => {
    questionStartedAt.current = Date.now();
  }, []);

  const question = view.currentQuestion;
  const showingFeedback = feedback !== null;
  const canType = !pending && !showingFeedback && question !== null;

  function pressDigit(digit: string) {
    if (!canType || input.length >= ANSWER_MAX_DIGITS) return;
    setError(null);
    setInput((prev) => prev + digit);
  }

  function pressDelete() {
    if (!canType) return;
    setInput((prev) => prev.slice(0, -1));
  }

  function submitAnswer() {
    if (!canType || !question || input === "") return;
    const elapsedMs = Date.now() - questionStartedAt.current;
    startTransition(async () => {
      const result = await submitAnswerAction(view.mission.id, question.index, input, elapsedMs);
      if (result.ok) {
        setView(result.data);
        setFeedback(result.data.lastResult);
        if (result.data.lastResult?.correct) playCorrectChime();
        else playWrongTone();
        setInput("");
        setError(null);
      } else {
        setError(result.error);
      }
    });
  }

  function claimReward() {
    if (pending) return;
    startTransition(async () => {
      const result = await claimRewardAction(view.mission.id);
      if (result.ok) {
        setView(result.data);
        setFeedback(null);
        setError(null);
      } else {
        setError(result.error);
      }
    });
  }

  function startNextAttempt() {
    if (pending) return;
    startTransition(async () => {
      const result = await startNextAttemptAction();
      if (result.ok) {
        questionStartedAt.current = Date.now();
        setView(result.data);
        setFeedback(null);
        setInput("");
        setError(null);
      } else {
        setError(result.error);
      }
    });
  }

  // 실제 키보드(PC)로도 입력할 수 있게 합니다.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (/^\d$/.test(event.key)) pressDigit(event.key);
      else if (event.key === "Backspace") pressDelete();
      else if (event.key === "Enter") submitAnswer();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  const percent = getMissionProgressPercent(view.mission);
  const finished = question === null && !showingFeedback;
  const dayDone = view.attempts.started >= MAX_MISSIONS_PER_DAY && view.mission.status === "rewarded";

  return (
    <div className="relative min-h-dvh">
      <main className="relative mx-auto flex w-full max-w-3xl flex-col gap-5 px-4 py-6 sm:px-6 sm:py-10">
        <nav className="flex items-center justify-between gap-3">
          <Link href="/" className="flex min-h-12 items-center rounded-full bg-white px-5 font-bold text-ink shadow-md">
            ← 홈으로
          </Link>
          <div className="flex items-center gap-2">
            <BgmPlayer src={bgmSrc} />
            <span className="text-right text-sm font-bold text-ink-soft">
              {view.mission.attemptNo}회차 · {view.mission.planLabel}
            </span>
          </div>
        </nav>

        <Card className="flex flex-col gap-3">
          <div className="flex justify-between text-sm font-bold text-ink">
            <span>문제 진행</span>
            <span>
              {view.mission.solvedCount} / {view.mission.totalQuestions}
            </span>
          </div>
          <ProgressBar value={percent} label={`미션 진행률 ${percent}%`} colorClass="bg-honey" heightClass="h-4" />
          <p className="text-right text-xs font-bold text-ink-soft">
            오늘 {view.attempts.started} / {view.attempts.max}회 도전
          </p>
        </Card>

        {showingFeedback && feedback && (
          <Card className="flex flex-col items-center gap-4 text-center" aria-live="polite">
            {feedback.correct ? (
              <>
                <span className="text-6xl" aria-hidden>🎉</span>
                <p className="text-3xl font-extrabold text-xp">정답이에요!</p>
              </>
            ) : (
              <>
                <span className="text-6xl" aria-hidden>💪</span>
                <p className="text-2xl font-extrabold text-ink">
                  아쉬워요! 정답은 <span className="text-primary">{feedback.correctAnswer}</span> 이에요.
                </p>
                <div className="w-full rounded-2xl bg-butter p-4 text-left">
                  <p className="mb-1 font-extrabold text-ink">💡 해설</p>
                  <p className="text-base leading-relaxed text-ink">{feedback.explanation}</p>
                </div>
              </>
            )}
            <button
              type="button"
              className={buttonClassName({ className: "max-w-md" })}
              onClick={() => {
                questionStartedAt.current = Date.now();
                setFeedback(null);
              }}
            >
              {view.currentQuestion ? "다음 문제" : "결과 보기"}
            </button>
          </Card>
        )}

        {canType && question && (
          <Card className="flex flex-col gap-6">
            <p className="text-center text-base font-bold text-ink-soft">{question.index + 1}번 문제</p>
            <p className="text-center text-5xl font-extrabold tracking-wide text-ink sm:text-6xl">
              {question.prompt.replace("?", input === "" ? "?" : input)}
            </p>
            <p className="text-center text-sm text-ink-soft">
              숫자 키패드를 누르거나 PC 키보드로 입력하세요. (Enter = 확인)
            </p>
            {error && (
              <p role="alert" className="text-center font-bold text-red-500">
                {error}
              </p>
            )}
            <div className="mx-auto w-full max-w-sm">
              <NumberPad
                onDigit={pressDigit}
                onDelete={pressDelete}
                onSubmit={submitAnswer}
                disabled={pending}
                canSubmit={input !== ""}
              />
            </div>
          </Card>
        )}

        {finished && (
          <Card className="flex flex-col items-center gap-5 text-center">
            <span className="text-6xl" aria-hidden>🏆</span>
            <h2 className="text-3xl font-extrabold text-ink">
              {view.mission.status === "rewarded" ? "미션 클리어!" : "모든 문제를 풀었어요!"}
            </h2>
            <p className="text-lg font-bold text-ink-soft">
              {view.mission.totalQuestions}문제 중 {view.mission.correctCount}문제 정답
            </p>

            {view.mission.status === "completed" && (
              <>
                <p className="text-base text-ink">보상을 받아 모험을 이어가요!</p>
                <button
                  type="button"
                  className={buttonClassName({ className: "max-w-md" })}
                  disabled={pending}
                  onClick={claimReward}
                >
                  🎁 보상 받기 (+{view.mission.rewardXp} XP, +{view.mission.rewardCoins} 코인)
                </button>
              </>
            )}

            {view.mission.status === "rewarded" && view.reward && !view.reward.alreadyClaimed && (
              <p className="text-lg font-extrabold text-xp">
                +{view.reward.xp} XP, +{view.reward.coins} 코인을 받았어요!
              </p>
            )}
            {view.mission.status === "rewarded" && (!view.reward || view.reward.alreadyClaimed) && (
              <p className="text-base font-bold text-ink-soft">이미 받은 보상이에요.</p>
            )}

            {view.mission.status === "rewarded" && view.attempts.canStartNext && (
              <button
                type="button"
                className={buttonClassName({ className: "max-w-md" })}
                disabled={pending}
                onClick={startNextAttempt}
              >
                ⚔️ 다음 도전 ({view.attempts.started + 1}회차 / 최대 {view.attempts.max}회)
              </button>
            )}

            {dayDone && (
              <p className="text-lg font-extrabold text-primary-dark">
                오늘 {view.attempts.max}번의 도전을 모두 끝냈어요! 내일 다시 만나요.
              </p>
            )}

            {error && (
              <p role="alert" className="font-bold text-red-500">
                {error}
              </p>
            )}

            <Link href="/" className={buttonClassName({ variant: "secondary", className: "max-w-md" })}>
              🏠 홈으로 돌아가기
            </Link>
          </Card>
        )}
      </main>
    </div>
  );
}
