import Link from "next/link";
import { LoginForm } from "@/components/auth/LoginForm";
import { Card } from "@/components/ui/Card";
import { buttonClassName } from "@/components/ui/Button";
import { DragonMascot } from "@/components/ui/DragonMascot";

export const dynamic = "force-dynamic";

/** 부모님 로그인 화면 */
export default function LoginPage() {
  const isSupabase = process.env.DATA_SOURCE === "supabase";

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-6 px-4 py-10">
      <div className="text-center">
        <DragonMascot className="mx-auto h-24 w-24 drop-shadow-md" />
        <h1 className="mt-2 text-3xl font-extrabold text-ink">오늘의 미션 도장깨기</h1>
        <p className="mt-1 text-base font-bold text-ink-soft">이메일 계정으로 로그인해 주세요</p>
        <p className="mt-1 text-sm text-ink-soft">아이는 로그인 후 바로 모험을 시작할 수 있어요.</p>
      </div>

      <Card>
        {isSupabase ? (
          <div className="flex flex-col gap-4">
            <LoginForm />
            <Link href="/login/forgot" className="text-center font-bold text-primary-dark underline">
              비밀번호를 잊으셨나요?
            </Link>
            <div className="flex flex-col gap-3 border-t-2 border-ink/10 pt-4">
              <p className="text-center text-sm font-bold text-ink-soft">처음 오셨나요?</p>
              <Link href="/signup" className={buttonClassName({ variant: "secondary" })}>
                ✨ 회원가입 신청하기
              </Link>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4 text-center">
            <p className="font-bold text-ink">
              지금은 테스트용 목업 모드예요. 로그인 없이 바로 사용할 수 있어요.
            </p>
            <Link href="/" className={buttonClassName()}>
              🏠 홈으로 가기
            </Link>
          </div>
        )}
      </Card>
      <p className="text-center text-sm text-ink-soft">
        <Link href="/privacy" className="underline">
          개인정보 처리방침
        </Link>
      </p>
    </div>
  );
}
