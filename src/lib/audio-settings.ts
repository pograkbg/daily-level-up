/**
 * 소리 크기 설정 (배경음, 효과음). 기기마다 따로 기억합니다 (개인 설정이라 서버에 저장하지 않습니다).
 * - 값은 0~100 (기본 50). 50이 지금의 기본 소리 크기입니다.
 * - 저장소를 쓸 수 없으면 기본값으로 동작합니다.
 */
import { useSyncExternalStore } from "react";

const BGM_KEY = "dlu-bgm-volume";
const SFX_KEY = "dlu-sfx-volume";
export const DEFAULT_VOLUME = 50;

const listeners = new Set<() => void>();

function read(key: string): number {
  try {
    const raw = localStorage.getItem(key);
    const n = raw === null ? DEFAULT_VOLUME : Number(raw);
    return Number.isFinite(n) ? Math.min(100, Math.max(0, n)) : DEFAULT_VOLUME;
  } catch {
    return DEFAULT_VOLUME;
  }
}

function write(key: string, value: number) {
  const clamped = Math.min(100, Math.max(0, Math.round(value)));
  try {
    localStorage.setItem(key, String(clamped));
  } catch {
    // 저장 실패는 무시합니다. 이번 화면에서는 그대로 동작합니다.
  }
  listeners.forEach((l) => l());
}

function subscribe(callback: () => void) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

/** 배경음 크기 (0~100) */
export function getBgmVolume(): number {
  return read(BGM_KEY);
}

/** 효과음 크기 (0~100) */
export function getSfxVolume(): number {
  return read(SFX_KEY);
}

export function setBgmVolume(value: number) {
  write(BGM_KEY, value);
}

export function setSfxVolume(value: number) {
  write(SFX_KEY, value);
}

/** 화면에서 배경음 크기를 읽고 바뀌면 다시 그립니다 */
export function useBgmVolume(): number {
  return useSyncExternalStore(subscribe, getBgmVolume, () => DEFAULT_VOLUME);
}

/** 화면에서 효과음 크기를 읽고 바뀌면 다시 그립니다 */
export function useSfxVolume(): number {
  return useSyncExternalStore(subscribe, getSfxVolume, () => DEFAULT_VOLUME);
}
