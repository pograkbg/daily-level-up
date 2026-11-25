import type { HTMLAttributes } from "react";

/** 둥근 모서리와 부드러운 그림자의 공통 카드 */
export function Card({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-[2rem] border-4 border-white bg-white/85 p-5 shadow-xl shadow-primary/10 backdrop-blur sm:p-4 ${className}`}
      {...props}
    />
  );
}
