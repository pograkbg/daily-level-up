"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

/**
 * 관리자 2단계 인증 (구글 OTP 등 인증 앱의 6자리 코드).
 * - 처음이면: 인증 앱에 등록하는 QR 코드를 보여 주고, 코드를 한 번 맞혀서 등록을 끝냅니다.
 * - 등록이 끝났으면: 매번 인증 앱의 6자리 코드를 입력해야 관리자 화면에 들어갈 수 있습니다.
 */
export function MfaPanel() {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [status, setStatus] = useState<"loading" | "enroll" | "verify" | "error">("loading");
  const [factorId, setFactorId] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  // 이미 등록된 인증 앱이 있는지 확인합니다.
  useEffect(() => {
    let cancelled = false;
    supabase.auth.mfa.listFactors().then(({ data, error }) => {
      if (cancelled) return;
      if (error || !data) {
        setStatus("error");
        setMessage("인증 정보를 불러오지 못했어요.");
        return;
      }
      const verified = data.totp.find((f) => f.status === "verified");
      if (verified) {
        setFactorId(verified.id);
        setStatus("verify");
      } else {
        setStatus("enroll");
      }
    });
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  async function startEnroll() {
    setPending(true);
    setMessage(null);
    const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp", friendlyName: "관리자" });
    setPending(false);
    if (error || !data) {
      setMessage("인증 등록을 시작하지 못했어요. 잠시 후 다시 시도해 주세요.");
      return;
    }
    setFactorId(data.id);
    setQrCode(data.totp.qr_code);
    setSecret(data.totp.secret);
  }

  async function submitCode() {
    if (!factorId) return;
    if (!/^\d{6}$/.test(code)) {
      setMessage("인증 앱에 보이는 6자리 숫자를 입력해 주세요.");
      return;
    }
    setPending(true);
    setMessage(null);
    const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId });
    if (challengeError || !challenge) {
      setPending(false);
      setMessage("인증을 시작하지 못했어요. 다시 시도해 주세요.");
      return;
    }
    const { error } = await supabase.auth.mfa.verify({ factorId, challengeId: challenge.id, code });
    setPending(false);
    if (error) {
      setMessage("코드가 맞지 않아요. 인증 앱의 현재 코드를 다시 입력해 주세요.");
      setCode("");
      return;
    }
    router.refresh();
    router.push("/admin");
  }

  if (status === "loading") {
    return <p className="text-base font-bold text-ink-soft">인증 정보를 확인하고 있어요…</p>;
  }

  if (status === "error") {
    return <p className="text-base font-bold text-red-500">{message}</p>;
  }

  return (
    <div className="flex flex-col gap-4 rounded-3xl border-4 border-white bg-white p-5 shadow-md">
      {status === "enroll" && !qrCode && (
        <div className="flex flex-col gap-3">
          <p className="text-base font-bold text-ink">
            관리자 화면은 인증 앱의 6자리 코드가 있어야 들어갈 수 있어요. 구글 OTP 같은 인증 앱에 아래 과정으로 등록해 주세요.
          </p>
          <button
            type="button"
            disabled={pending}
            onClick={startEnroll}
            className="min-h-14 rounded-2xl bg-primary px-5 font-extrabold text-white disabled:opacity-50"
          >
            인증 앱 등록 시작
          </button>
        </div>
      )}

      {status === "enroll" && qrCode && (
        <div className="flex flex-col items-center gap-3">
          <p className="text-base font-bold text-ink">인증 앱에서 아래 QR 코드를 스캔하세요.</p>
          {/* Supabase 가 만들어 준 QR 이미지(data URI) */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrCode} alt="2단계 인증 QR 코드" className="h-48 w-48 rounded-xl bg-white p-2" />
          {secret && (
            <p className="text-center text-sm font-bold text-ink-soft">
              QR을 스캔할 수 없으면 직접 입력: <span className="select-all break-all text-ink">{secret}</span>
            </p>
          )}
        </div>
      )}

      {(status === "verify" || (status === "enroll" && qrCode)) && (
        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-2 text-base font-bold text-ink">
            인증 앱의 6자리 코드
            <input
              value={code}
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              className="min-h-14 rounded-2xl border-2 border-ink/10 bg-white px-4 text-center text-2xl font-extrabold tracking-widest text-ink"
            />
          </label>
          <button
            type="button"
            disabled={pending || code.length !== 6}
            onClick={submitCode}
            className="min-h-14 rounded-2xl bg-primary px-5 font-extrabold text-white disabled:opacity-50"
          >
            확인
          </button>
        </div>
      )}

      {message && (
        <p role="alert" className="text-sm font-bold text-red-500">
          {message}
        </p>
      )}
    </div>
  );
}
