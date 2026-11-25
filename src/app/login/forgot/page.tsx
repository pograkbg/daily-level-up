import Link from "next/link";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";
import { Card } from "@/components/ui/Card";
import { buttonClassName } from "@/components/ui/Button";

export const dynamic = "force-dynamic";

/** 비밀번호 재설정 메일 요청 화면 */
export default function ForgotPasswordPage() {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-6 px-4 py-10">
      <div className="text-center">
        <p className="text-5xl" aria-hidden>🔑</p>
        <h1 className="mt-2 text-3xl font-extrabold text-ink">비밀번호 재설정</h1>
        <p className="mt-1 text-base font-bold text-ink-soft">이메일로 재설정 링크를 보내 드려요.</p>
      </div>
      <Card className="flex flex-col gap-5">
        <ForgotPasswordForm />
        <Link href="/login" className={buttonClassName({ variant: "secondary" })}>
          ← 로그인으로 돌아가기
        </Link>
      </Card>
    </div>
  );
}
