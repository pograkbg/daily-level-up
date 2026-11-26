"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { DEFAULT_VOLUME, getBgmVolume, useBgmVolume } from "@/lib/audio-settings";

const MUTE_KEY = "dlu-bgm-muted";
const TARGET_VOLUME = 0.02; // 잔잔한 배경음 기본값 (0~1). 설정 50일 때 이 크기입니다.

/** 설정값(0~100)을 실제 음량(0~1)으로 바꿉니다. 기본값 50이면 TARGET_VOLUME과 같습니다. */
function levelFor(setting: number): number {
  return TARGET_VOLUME * (setting / DEFAULT_VOLUME);
}
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
  const bgmVolume = useBgmVolume();

  useEffect(() => {
    if (!src) return;
    const audio = new Audio(src);
    audio.loop = true;
    audio.volume = 0;
    audioRef.current = audio;

    // 서서히 켜지기 (페이드인). 음량 설정은 매번 읽어서 바로 반영합니다.
    const startedAt = Date.now();
    const fade = window.setInterval(() => {
      const t = Math.min(1, (Date.now() - startedAt) / FADE_IN_MS);
      audio.volume = levelFor(getBgmVolume()) * t;
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

  // 음량 슬라이더를 움직이면 지금 재생 중인 소리에도 바로 반영합니다.
  useEffect(() => {
    const audio = audioRef.current;
    if (audio && audio.volume > 0) audio.volume = levelFor(bgmVolume);
  }, [bgmVolume]);

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
