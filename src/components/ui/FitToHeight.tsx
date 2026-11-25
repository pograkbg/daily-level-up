"use client";

import { useEffect, useRef } from "react";

/** 이 높이(CSS 픽셀)를 기준으로 설계했습니다. 이보다 낮은 화면에서는 내용 전체를 같은 비율로 줄입니다. */
const DESIGN_HEIGHT = 780;
/** 너무 작아지지 않도록 하한을 둡니다. */
const MIN_SCALE = 0.6;

/**
 * 화면 높이에 맞춰 안쪽 내용 전체를 같은 비율로 줄이는 부품 (학습 화면용).
 * - 높이가 기준 이상이면 원래 크기 그대로입니다.
 * - 기기를 돌리거나 창 크기가 바뀌면 다시 계산합니다.
 * 비율은 화면 높이를 직접 바꾸는 값이라 상태(state)로 두지 않고, 요소의 스타일에만 씁니다.
 */
export function FitToHeight({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function apply() {
      if (!ref.current) return;
      const scale = Math.min(1, Math.max(MIN_SCALE, window.innerHeight / DESIGN_HEIGHT));
      ref.current.style.zoom = String(scale);
    }
    apply();
    window.addEventListener("resize", apply);
    return () => window.removeEventListener("resize", apply);
  }, []);

  return <div ref={ref}>{children}</div>;
}
