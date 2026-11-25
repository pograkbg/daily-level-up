import Link from "next/link";
import { redirect } from "next/navigation";
import { RenameButton } from "@/components/home/RenameButton";
import { hasChildProfile } from "@/lib/data/child-repository";
import { currentLoginEmail } from "@/lib/data/admin-repository";
import { getHomeData } from "@/lib/data/home-repository";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/** 내 계정: 네이버 계정 화면처럼 항목을 한 줄씩 보여 주고, 바꿀 수 있는 것은 "변경"으로 연결합니다. */
export default async function AccountPage() {
  if (!(await hasChildProfile())) {
    redirect("/setup");
  }
  const [home, email] = await Promise.all([getHomeData(), currentLoginEmail()]);

  const supabase = await createSupabaseServerClient();
  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  const twoFactorOn = aal?.currentLevel === "aal2" || aal?.nextLevel === "aal2";

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
      <nav className="flex items-center justify-between gap-3">
        <Link href="/" className="flex min-h-12 items-center rounded-2xl bg-butter px-5 font-extrabold text-ink shadow-[0_4px_0_0_#e8d88a]">
          ← 홈으로
        </Link>
        <p className="text-sm font-bold text-ink-soft">내 계정</p>
      </nav>

      <h1 className="text-2xl font-extrabold text-ink sm:text-3xl">내 계정 정보</h1>

      <section className="flex flex-col divide-y divide-ink/10 overflow-hidden rounded-3xl border-4 border-white bg-white shadow-md">
        <Row label="이름" value={home.profile.nickname}>
          <RenameButton current={home.profile.nickname} label="변경" />
        </Row>
        <Row label="이메일" value={email ?? "확인할 수 없어요"} note="이메일은 바꿀 수 없어요." />
        <Row label="2단계 인증" value={twoFactorOn ? "사용 중" : "사용 안 함"} note="관리자 계정은 인증 앱 코드가 필요해요." />
      </section>
    </div>
  );
}

function Row({
  label,
  value,
  note,
  children,
}: {
  label: string;
  value: string;
  note?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-4">
      <div className="flex min-w-0 flex-col">
        <span className="text-sm font-bold text-ink-soft">{label}</span>
        <span className="truncate text-lg font-extrabold text-ink">{value}</span>
        {note && <span className="text-xs font-bold text-ink-soft">{note}</span>}
      </div>
      {children}
    </div>
  );
}
