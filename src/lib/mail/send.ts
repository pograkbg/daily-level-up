/**
 * 이메일 발송 (서버 전용). 운영자의 Gmail 계정으로 SMTP 를 통해 보냅니다. 도메인이 필요 없습니다.
 *
 * - 필요한 값(.env.local): GMAIL_USER, GMAIL_APP_PASSWORD, ADMIN_NOTIFY_EMAIL, NEXT_PUBLIC_SITE_URL
 * - GMAIL_APP_PASSWORD 는 Google 계정의 "앱 비밀번호"(16자리)입니다. 일반 비밀번호가 아닙니다.
 * - 값이 없으면 보내지 않고 서버 기록에만 남깁니다. 메일이 실패해도 가입·승인 자체는 그대로 진행됩니다.
 * - 메일 주소와 본문은 서버 기록에 남기지 않습니다.
 * - Gmail 개인 계정은 하루 발송량에 제한이 있습니다. 소규모 가족 서비스 용도로 맞춰 쓰세요.
 */

import nodemailer, { type Transporter } from "nodemailer";

export interface MailInput {
  to: string[];
  subject: string;
  text: string;
}

let transporter: Transporter | null = null;

function getTransporter(user: string, pass: string): Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: { user, pass },
      connectionTimeout: 8000,
      socketTimeout: 8000,
    });
  }
  return transporter;
}

/** 메일 한 통 보내기. 성공하면 true. */
export async function sendMail(input: MailInput): Promise<boolean> {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) {
    console.warn("[mail] GMAIL_USER 또는 GMAIL_APP_PASSWORD 가 없어서 메일을 보내지 않았어요.");
    return false;
  }
  if (input.to.length === 0) {
    console.warn("[mail] 받을 사람이 없어서 메일을 보내지 않았어요. (ADMIN_NOTIFY_EMAIL 확인)");
    return false;
  }
  // 기록에는 제목과 받는 사람 수만 남깁니다. 주소와 본문은 남기지 않습니다.
  console.info(`[mail] 발송 시도: "${input.subject}" (받는 사람 ${input.to.length}명)`);
  try {
    const info = await getTransporter(user, pass).sendMail({
      from: `"오늘의 미션" <${user}>`,
      to: input.to.join(", "),
      subject: input.subject,
      text: input.text,
    });
    console.info(`[mail] 발송 성공: 서버 응답 ${info.response ?? "(없음)"}, 거부된 주소 ${(info.rejected ?? []).length}개`);
    return true;
  } catch (error) {
    const e = error as { code?: string; responseCode?: number; response?: string; message?: string };
    console.error(
      `[mail] 발송 실패: ${e.message ?? "알 수 없는 오류"} (code: ${e.code ?? "-"}, responseCode: ${e.responseCode ?? "-"})`,
    );
    return false;
  }
}

/** 관리자 알림을 받을 주소 (쉼표로 여러 개 적을 수 있습니다) */
export function adminNotifyAddresses(): string[] {
  return (process.env.ADMIN_NOTIFY_EMAIL ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

/** 메일 안의 링크에 쓸 사이트 주소 */
export function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
}
