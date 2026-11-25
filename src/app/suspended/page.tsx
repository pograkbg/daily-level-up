import { signOutAction } from "@/app/login/actions";

export const dynamic = "force-dynamic";

/** 중지된 계정 안내 화면 */
export default function SuspendedPage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center gap-6 px-4 py-10 text-center">
      <span aria-hidden className="text-6xl">🔒</span>
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-extrabold text-ink">이용이 잠시 중지되었어요</h1>
        <p className="text-base font-bold text-ink-soft">
          관리자에게 문의해 주세요. 기록은 그대로 남아 있어요.
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
