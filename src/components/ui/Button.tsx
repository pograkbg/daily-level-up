import type { ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "secondary";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

const VARIANT_CLASS: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-white shadow-[0_6px_0_0_var(--color-primary-dark)] hover:brightness-105 active:translate-y-1 active:shadow-[0_2px_0_0_var(--color-primary-dark)]",
  secondary:
    "bg-butter text-ink shadow-[0_6px_0_0_#e8d88a] hover:brightness-105 active:translate-y-1 active:shadow-[0_2px_0_0_#e8d88a]",
};

/** 버튼 모양 클래스 (링크에도 같은 모양을 쓰고 싶을 때 사용) */
export function buttonClassName({
  variant = "primary",
  className = "",
}: { variant?: ButtonVariant; className?: string } = {}): string {
  return `flex min-h-16 w-full items-center justify-center gap-3 rounded-3xl px-6 py-4 text-xl font-extrabold transition duration-100 disabled:opacity-50 sm:text-2xl ${VARIANT_CLASS[variant]} ${className}`;
}

/**
 * 큼직한 터치 버튼.
 * 높이 64px 이상 → 아이 손가락, 태블릿 터치에도 편하게 누를 수 있습니다.
 */
export function Button({ variant = "primary", className = "", type = "button", ...props }: ButtonProps) {
  return <button type={type} className={buttonClassName({ variant, className })} {...props} />;
}
