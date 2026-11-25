import { redirect } from "next/navigation";
import { ChildSetupForm } from "@/components/setup/ChildSetupForm";
import { Card } from "@/components/ui/Card";
import { hasChildProfile } from "@/lib/data/child-repository";

export const dynamic = "force-dynamic";

/** 처음 로그인한 부모가 아이 프로필을 만드는 화면 */
export default async function SetupPage() {
  // 이미 아이 프로필이 있으면 홈으로 보냅니다.
  if (await hasChildProfile()) {
    redirect("/");
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-xl flex-col justify-center gap-6 px-4 py-10">
      <div className="text-center">
        <p className="text-5xl" aria-hidden>🥚</p>
        <h1 className="mt-2 text-3xl font-extrabold text-ink">아이 프로필 만들기</h1>
        <p className="mt-1 text-base font-bold text-ink-soft">아이의 모험 기록을 시작해요.</p>
      </div>
      <Card>
        <ChildSetupForm />
      </Card>
    </div>
  );
}
