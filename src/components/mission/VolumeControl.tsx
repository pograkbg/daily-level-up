"use client";

import { setBgmVolume, setSfxVolume, useBgmVolume, useSfxVolume } from "@/lib/audio-settings";

/** 미션 화면의 소리 크기 조절 (배경음, 효과음). 값은 이 기기에만 저장됩니다. */
export function VolumeControl() {
  const bgm = useBgmVolume();
  const sfx = useSfxVolume();

  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-2xl bg-white/80 px-4 py-3 shadow-sm">
      <label className="flex items-center gap-3 text-sm font-bold text-ink">
        🎵 배경음
        <input
          type="range"
          min={0}
          max={100}
          step={5}
          value={bgm}
          onChange={(e) => setBgmVolume(Number(e.target.value))}
          aria-label="배경음 크기"
          className="h-3 w-32 accent-primary sm:w-40"
        />
        <span className="w-8 text-right tabular-nums text-ink-soft">{bgm}</span>
      </label>
      <label className="flex items-center gap-3 text-sm font-bold text-ink">
        🔔 효과음
        <input
          type="range"
          min={0}
          max={100}
          step={5}
          value={sfx}
          onChange={(e) => setSfxVolume(Number(e.target.value))}
          aria-label="효과음 크기"
          className="h-3 w-32 accent-primary sm:w-40"
        />
        <span className="w-8 text-right tabular-nums text-ink-soft">{sfx}</span>
      </label>
    </div>
  );
}
