"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { approveNextGradeAction } from "@/app/mission/actions";
import { buttonClassName } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

interface GradeApprovalProps {
  approved: boolean;
  gradeName: string;
}

/** 학년 완료 후 보호자가 다음 학년을 여는 카드 */
export function GradeApproval({ approved, gradeName }: GradeApprovalProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function approve() {
    if (pending) return;
    startTransition(async () => {
      const result = await approveNextGradeAction();
      if (result.ok) {
        setError(null);
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <Card className="flex flex-col gap-4 border-honey">
      <p className="text-lg font-extrabold text-ink">🎉 {gradeName} 모든 레벨을 완료했어요!</p>
      {approved ? (
        <p className="font-bold text-primary-dark">
          보호자 승인이 끝났어요. 다음 학년 내용은 준비 중이라, 지금은 {gradeName} 랜덤 연습이 계속돼요.
        </p>
      ) : (
        <>
          <p className="text-sm text-ink-soft">
            보호자가 확인 버튼을 눌러야 다음 학년이 열려요. 그전까지는 {gradeName} 랜덤 연습이 계속돼요.
          </p>
          <button type="button" disabled={pending} onClick={approve} className={buttonClassName({ variant: "secondary" })}>
            ✅ 보호자 확인 · 다음 학년 열기
          </button>
        </>
      )}
      {error && (
        <p role="alert" className="text-sm font-bold text-red-500">
          {error}
        </p>
      )}
    </Card>
  );
}
