import Link from "next/link";
import { SignupForm } from "@/components/auth/SignupForm";
import { Card } from "@/components/ui/Card";
import { buttonClassName } from "@/components/ui/Button";

export const dynamic = "force-dynamic";

/** 회원가입 신청 화면 (로그인 화면과 따로 둡니다) */
export default function SignupPage() {
  const isSupabase = process.env.DATA_SOURCE === "supabase";

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-6 px-4 py-10">
      <div className="text-center">
        <p className="text-5xl" aria-hidden>
          ✨
        </p>
        <h1 className="mt-2 text-3xl font-extrabold text-ink">회원가입</h1>
        <p className="mt-1 text-base font-bold text-ink-soft">보호자 이메일로 가입을 신청해 주세요</p>
        <p className="mt-1 text-sm text-ink-soft">관리자가 승인하면 메일로 알려 드리고, 그 뒤에 로그인할 수 있어요.</p>
      </div>

      <Card className="flex flex-col gap-5">
        {isSupabase ? (
          <SignupForm />
        ) : (
          <p className="text-center font-bold text-ink">지금은 테스트용 목업 모드라서 회원가입이 필요 없어요.</p>
        )}
        <Link href="/login" className={buttonClassName({ variant: "secondary" })}>
          ← 로그인으로 돌아가기
        </Link>
      </Card>
    </div>
  );
}
