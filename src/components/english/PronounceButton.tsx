"use client";

import { useEffect, useRef, useState } from "react";
import { getAudioAction } from "@/app/english/actions";

/**
 * 단어 소리 듣기.
 * - 문제가 뜰 때 음성 주소를 미리 받아 둡니다. 버튼을 누르면 바로 재생합니다.
 * - 음성 주소가 아직 없거나 재생에 실패하면 기기 음성으로 읽습니다.
 * - 출처 문구는 화면 아래 출처 영역에 있으므로 여기에는 따로 쓰지 않습니다.
 */
export function PronounceButton({ word, onPlay }: { word: string; onPlay?: () => void }) {
  // 어느 단어의 음성 주소인지 함께 기억합니다. 단어가 바뀌면 이전 주소는 쓰지 않습니다.
  const [loaded, setLoaded] = useState<{ word: string; url: string } | null>(null);
  const audioUrl = loaded?.word === word ? loaded.url : null;
  const [message, setMessage] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // 문제가 뜨면 이 단어의 음성 주소를 미리 가져옵니다.
  useEffect(() => {
    let cancelled = false;
    getAudioAction(word).then((result) => {
      if (!cancelled && result.ok && result.data.url) setLoaded({ word, url: result.data.url });
    });
    return () => {
      cancelled = true;
    };
  }, [word]);

  function speakWithVoice() {
    try {
      if (typeof window === "undefined" || !("speechSynthesis" in window)) {
        setMessage("이 기기에서는 소리 재생을 지원하지 않아요.");
        return;
      }
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.lang = "en-US";
      utterance.rate = 0.8;
      window.speechSynthesis.speak(utterance);
      setMessage(null);
    } catch {
      setMessage("소리를 재생하지 못했어요.");
    }
  }

  function speak() {
    onPlay?.();
    if (audioUrl) {
      try {
        if (!audioRef.current || audioRef.current.src !== audioUrl) {
          audioRef.current = new Audio(audioUrl);
          audioRef.current.onerror = () => speakWithVoice();
        }
        audioRef.current.currentTime = 0;
        void audioRef.current.play().catch(() => speakWithVoice());
        setMessage(null);
        return;
      } catch {
        // 아래 기기 음성으로 넘어갑니다.
      }
    }
    speakWithVoice();
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={speak}
        aria-label={`${word} 소리 듣기`}
        className="flex min-h-12 items-center gap-2 rounded-full bg-white px-5 font-bold text-ink shadow-md"
      >
        🔊 듣기
      </button>

      {message && (
        <p role="status" className="text-sm font-bold text-red-500">
          {message}
        </p>
      )}
    </div>
  );
}
