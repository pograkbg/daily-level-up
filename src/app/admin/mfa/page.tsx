import Link from "next/link";
import { redirect } from "next/navigation";
import { MfaPanel } from "@/components/admin/MfaPanel";
import { isCurrentAdmin, isSupabaseSourceForAdmin } from "@/lib/data/admin-repository";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/** 관리자 2단계 인증 화면: 등록하거나, 인증 코드를 입력해서 관리자 화면에 들어갑니다. */
export default async function AdminMfaPage() {
  if (!isSupabaseSourceForAdmin()) {
    redirect("/");
  }
  if (!(await isCurrentAdmin())) {
    redirect("/");
  }
  // 이미 인증 코드를 맞혔다면 바로 관리자 화면으로 보냅니다.
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (data?.currentLevel === "aal2") {
    redirect("/admin");
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
      <nav className="flex items-center justify-between gap-3">
        <Link href="/" className="flex min-h-12 items-center rounded-2xl bg-butter px-5 font-extrabold text-ink shadow-[0_4px_0_0_#e8d88a]">
          ← 홈으로
        </Link>
        <p className="text-sm font-bold text-ink-soft">관리자 인증</p>
      </nav>
      <h1 className="text-2xl font-extrabold text-ink">2단계 인증</h1>
      <MfaPanel />
    </div>
  );
}
