import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import { Card } from "@/components/ui/Card";

export const dynamic = "force-dynamic";

/** 메일 링크로 들어온 뒤 새 비밀번호를 정하는 화면 */
export default function ResetPasswordPage() {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-6 px-4 py-10">
      <div className="text-center">
        <p className="text-5xl" aria-hidden>🔐</p>
        <h1 className="mt-2 text-3xl font-extrabold text-ink">새 비밀번호 정하기</h1>
        <p className="mt-1 text-base font-bold text-ink-soft">기억하기 쉬운 6자리 이상으로 정해 주세요.</p>
      </div>
      <Card>
        <ResetPasswordForm />
      </Card>
    </div>
  );
}
