"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";

const MUTE_KEY = "dlu-bgm-muted";
const TARGET_VOLUME = 0.02; // 잔잔한 배경음 (0~1)
const FADE_IN_MS = 3000; // 시작할 때 서서히 켜지는 시간
const listeners = new Set<() => void>();

function readMuted(): boolean {
  try {
    return localStorage.getItem(MUTE_KEY) === "1";
  } catch {
    return false; // 저장소를 못 쓰면 기본값(소리 켜짐)
  }
}

function subscribe(callback: () => void) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function writeMuted(value: boolean) {
  try {
    localStorage.setItem(MUTE_KEY, value ? "1" : "0");
  } catch {
    // 저장 실패는 무시합니다. 이번 화면에서는 그대로 동작합니다.
  }
  listeners.forEach((l) => l());
}

/** 배경음악 재생 (반복, 소리 끄기 버튼). 음악 파일이 없으면 아무것도 하지 않습니다. */
export function BgmPlayer({ src }: { src: string | null }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const muted = useSyncExternalStore(subscribe, readMuted, () => false);

  useEffect(() => {
    if (!src) return;
    const audio = new Audio(src);
    audio.loop = true;
    audio.volume = 0;
    audioRef.current = audio;

    // 서서히 켜지기 (페이드인)
    const startedAt = Date.now();
    const fade = window.setInterval(() => {
      const t = Math.min(1, (Date.now() - startedAt) / FADE_IN_MS);
      audio.volume = TARGET_VOLUME * t;
      if (t >= 1) window.clearInterval(fade);
    }, 100);

    if (!muted) {
      // 브라우저가 자동 재생을 막으면 조용히 넘어갑니다. 버튼으로 다시 켤 수 있습니다.
      audio.play().catch(() => undefined);
    }
    return () => {
      window.clearInterval(fade);
      audio.pause();
      audioRef.current = null;
    };
    // muted 변화는 아래 effect에서 처리합니다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (muted) {
      audio.pause();
    } else {
      audio.play().catch(() => undefined);
    }
  }, [muted]);

  if (!src) return null;

  function toggle() {
    writeMuted(!muted);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={!muted}
      className="flex min-h-12 items-center gap-2 rounded-full bg-white px-4 font-bold text-ink shadow-md"
    >
      {muted ? "🔇 배경음 끔" : "🔊 배경음 켬"}
    </button>
  );
}
