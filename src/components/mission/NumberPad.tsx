import { buttonClassName } from "@/components/ui/Button";

interface NumberPadProps {
  onDigit: (digit: string) => void;
  onDelete: () => void;
  onSubmit: () => void;
  disabled?: boolean;
  canSubmit: boolean;
}

const DIGITS = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];

/** 큼직한 숫자 키패드 (터치 최소 64px) */
export function NumberPad({ onDigit, onDelete, onSubmit, disabled = false, canSubmit }: NumberPadProps) {
  const keyClass =
    "flex min-h-16 items-center justify-center rounded-3xl bg-white text-3xl font-extrabold text-ink shadow-[0_5px_0_0_#d8d2f0] [@media(max-height:860px)]:min-h-14 transition duration-100 hover:brightness-105 active:translate-y-1 active:shadow-[0_1px_0_0_#d8d2f0] disabled:opacity-50";

  return (
    <div className="grid grid-cols-3 gap-3" aria-label="숫자 키패드">
      {DIGITS.map((digit) => (
        <button key={digit} type="button" className={keyClass} disabled={disabled} onClick={() => onDigit(digit)}>
          {digit}
        </button>
      ))}
      <button type="button" className={`${keyClass} text-lg`} disabled={disabled} onClick={onDelete}>
        지우기
      </button>
      <button type="button" className={keyClass} disabled={disabled} onClick={() => onDigit("0")}>
        0
      </button>
      <button
        type="button"
        className={buttonClassName({ className: "min-h-16 text-lg sm:text-xl" })}
        disabled={disabled || !canSubmit}
        onClick={onSubmit}
      >
        확인
      </button>
    </div>
  );
}
