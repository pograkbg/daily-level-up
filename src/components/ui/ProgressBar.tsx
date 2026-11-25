interface ProgressBarProps {
  /** 0 ~ 100 */
  value: number;
  /** 접근성용 이름 (스크린리더가 읽음) */
  label: string;
  colorClass?: string;
  heightClass?: string;
}

/** 게임 느낌의 둥근 진행 바 */
export function ProgressBar({
  value,
  label,
  colorClass = "bg-xp",
  heightClass = "h-5",
}: ProgressBarProps) {
  const safeValue = Math.min(100, Math.max(0, value));

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={safeValue}
      className={`w-full overflow-hidden rounded-full bg-ink/10 ${heightClass}`}
    >
      <div
        className={`h-full rounded-full transition-all duration-500 ${colorClass}`}
        style={{ width: `${safeValue}%` }}
      />
    </div>
  );
}
