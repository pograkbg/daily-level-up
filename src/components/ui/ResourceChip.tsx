interface ResourceChipProps {
  icon: string;
  label: string;
  value: string | number;
  title?: string; // 마우스를 올리면 보이는 설명
  className?: string;
}

/** 캐릭터 레벨·경험치·코인 같은 요약 값을 작은 알약 모양으로 보여줍니다. */
export function ResourceChip({ icon, label, value, title, className = "" }: ResourceChipProps) {
  return (
    <div
      title={title}
      className={`flex items-center gap-2 rounded-full bg-white px-4 py-2 shadow-md ${className}`}
    >
      <span aria-hidden className="text-2xl">
        {icon}
      </span>
      <div className="flex flex-col leading-tight">
        <span className="text-xs font-bold text-ink-soft">{label}</span>
        <span className="text-lg font-extrabold text-ink">{value}</span>
      </div>
    </div>
  );
}
