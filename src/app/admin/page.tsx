import Link from "next/link";
import { redirect } from "next/navigation";
import { AccountTable } from "@/components/admin/AccountTable";
import { ChildPanel } from "@/components/admin/ChildPanel";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  currentLoginEmail,
  isCurrentAdmin,
  isSupabaseSourceForAdmin,
  listAccounts,
  listChildren,
} from "@/lib/data/admin-repository";

export const dynamic = "force-dynamic";

/** 관리자 화면: 가입한 계정을 보고 승인하거나 승인을 취소합니다. 관리자가 아니면 홈으로 보냅니다. */
export default async function AdminPage() {
  if (!isSupabaseSourceForAdmin()) {
    return (
      <Shell email={null}>
        <p className="text-base font-bold text-ink-soft">관리자 기능은 Supabase 모드에서만 쓸 수 있어요.</p>
      </Shell>
    );
  }
  if (!(await isCurrentAdmin())) {
    redirect("/");
  }
  // 관리자는 2단계 인증 코드를 맞혀야 들어갈 수 있습니다.
  const mfa = await createSupabaseServerClient();
  const { data: aal } = await mfa.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aal?.currentLevel !== "aal2") {
    redirect("/admin/mfa");
  }
  const [result, children, email] = await Promise.all([listAccounts(), listChildren(), currentLoginEmail()]);

  return (
    <Shell email={email}>
      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-extrabold text-ink">아이 학습 설정</h2>
        {children.ok ? (
          <ChildPanel rows={children.data} />
        ) : (
          <p role="alert" className="text-base font-bold text-red-500">
            {children.error}
          </p>
        )}
      </section>
      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-extrabold text-ink">계정 승인</h2>
        {result.ok ? (
          <AccountTable accounts={result.data} />
        ) : (
          <p role="alert" className="text-base font-bold text-red-500">
            {result.error}
          </p>
        )}
      </section>
    </Shell>
  );
}

function Shell({ children, email }: { children: React.ReactNode; email: string | null }) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-4xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
      <nav className="flex items-center justify-between gap-3">
        <Link href="/" className="flex min-h-12 items-center rounded-2xl bg-butter px-5 font-extrabold text-ink shadow-[0_4px_0_0_#e8d88a]">
          ← 홈으로
        </Link>
        <p className="truncate text-sm font-bold text-ink-soft">
          관리자 · 로그인: {email ?? "확인 안 됨"}
        </p>
      </nav>
      <h1 className="text-2xl font-extrabold text-ink sm:text-3xl">가입 승인</h1>
      {children}
    </div>
  );
}
