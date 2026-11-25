import { signOutAction } from "@/app/login/actions";

export const dynamic = "force-dynamic";

/** 승인 대기 화면: 가입은 됐지만 관리자가 아직 승인하지 않은 계정이 보입니다. */
export default function PendingPage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center gap-6 px-4 py-10 text-center">
      <span aria-hidden className="text-6xl">⏳</span>
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-extrabold text-ink">가입 승인을 기다리고 있어요</h1>
        <p className="text-base font-bold text-ink-soft">
          가입은 잘 접수됐어요. 관리자가 승인하면 바로 이용할 수 있어요.
        </p>
      </div>
      <form action={signOutAction} className="w-full">
        <button
          type="submit"
          className="flex min-h-14 w-full items-center justify-center rounded-2xl bg-butter px-5 text-lg font-extrabold text-ink shadow-[0_4px_0_0_#e8d88a]"
        >
          로그아웃
        </button>
      </form>
    </main>
  );
}
