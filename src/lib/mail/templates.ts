/**
 * 메일 템플릿 (서버 전용). 표(table) 레이아웃과 인라인 스타일만 씁니다.
 * 메일 앱마다 지원하는 기능이 달라서, 이미지 없이도 보이도록 색과 글자로만 꾸밉니다.
 * 각 메일은 HTML 본문과 글자만 있는 본문(text)을 함께 만듭니다.
 */

const COLOR = {
  bg: "#f6f3ff",
  card: "#ffffff",
  primary: "#7c6cf0",
  primaryDark: "#5f4fd6",
  mint: "#d9f7e8",
  sky: "#dff3ff",
  butter: "#fff6c9",
  ink: "#3b3660",
  inkSoft: "#6f6a8f",
};

const FONT = "'Malgun Gothic','맑은 고딕',Apple SD Gothic Neo,Arial,sans-serif";

function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** 메일 바깥 틀: 배경, 흰 카드, 숨은 미리보기 문구 */
function shell(preheader: string, inner: string): string {
  return `<!doctype html>
<html lang="ko">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:${COLOR.bg};font-family:${FONT};color:${COLOR.ink};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${COLOR.bg};">
  <tr><td align="center" style="padding:96px 12px 32px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:${COLOR.card};border-radius:28px;overflow:hidden;box-shadow:0 8px 24px rgba(124,108,240,0.12);">
      ${inner}
    </table>
    <p style="margin:18px 0 0;font-size:12px;line-height:1.6;color:${COLOR.inkSoft};text-align:center;">오늘의 미션 도장깨기 · 가족과 지인을 위한 비상업 학습 서비스</p>
  </td></tr>
</table>
</body>
</html>`;
}

/** 머리글 띠: 색 배경 위에 큰 이모지와 제목 */
function header(emoji: string, title: string, bg: string, fg: string): string {
  return `<tr><td align="center" style="background:${bg};padding:36px 24px 30px;">
    <div style="font-size:44px;line-height:1;">${emoji}</div>
    <h1 style="margin:14px 0 0;font-size:24px;font-weight:800;color:${fg};">${esc(title)}</h1>
  </td></tr>`;
}

/** 색 박스 안의 항목 목록 */
function box(title: string, bg: string, items: string[]): string {
  const rows = items
    .map((item) => `<p style="margin:0 0 8px;font-size:15px;line-height:1.7;color:${COLOR.ink};">✓&nbsp; ${item}</p>`)
    .join("");
  return `<tr><td style="padding:0 28px 28px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${bg};border-radius:18px;">
      <tr><td style="padding:18px 20px;">
        <p style="margin:0 0 10px;font-size:15px;font-weight:800;color:${COLOR.ink};">${title}</p>
        ${rows}
      </td></tr>
    </table>
  </td></tr>`;
}

/** 둥근 버튼 */
function button(label: string, href: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" align="center" style="margin:8px auto 0;">
    <tr><td align="center" style="border-radius:999px;background:${COLOR.primary};">
      <a href="${esc(href)}" style="display:inline-block;padding:16px 38px;font-size:17px;font-weight:800;color:#ffffff;text-decoration:none;border-radius:999px;">${label}</a>
    </td></tr>
  </table>`;
}

/* ---------- 승인 완료 메일 (신청자에게) ---------- */

export function approvalMail(loginUrl: string): { subject: string; text: string; html: string } {
  const subject = "[오늘의 미션] 가입이 승인됐어요 🎉";

  const inner = `
    ${header("🌳", "가입이 승인됐어요!", COLOR.primary, "#ffffff")}
    <tr><td style="padding:40px 28px 20px;">
      <p style="margin:0;font-size:16px;line-height:1.8;">안녕하세요! 오늘의 미션 도장깨기입니다.</p>
      <p style="margin:10px 0 0;font-size:20px;font-weight:800;line-height:1.5;">🎉 가입을 축하드립니다!</p>
      <p style="margin:12px 0 0;font-size:15px;line-height:1.8;color:${COLOR.inkSoft};">
        보호자님의 가입 신청이 승인되어 지금부터 서비스를 이용하실 수 있습니다.
        오늘의 미션 도장깨기는 아이들이 매일 작은 미션에 도전하고, 성취의 즐거움을 느끼며 성장할 수 있도록 만든
        비상업 학습 서비스입니다.
      </p>
    </td></tr>
    ${box("📚 서비스 이용 안내", COLOR.mint, [
      "가입하신 이메일 계정으로 로그인해 주세요.",
      "아이의 학습 프로필을 설정하고 오늘의 미션을 시작해 주세요.",
      "보호자님은 아이의 학습 기록과 성장 과정을 확인하실 수 있습니다.",
    ])}
    ${box("🔒 개인정보 보호 안내", COLOR.sky, [
      "수집된 개인정보는 서비스 운영 및 학습 관리 목적으로만 이용됩니다.",
      "보호자님은 언제든지 아이의 개인정보 열람·정정·삭제를 요청하실 수 있습니다.",
      "자세한 내용은 서비스 내 개인정보 처리방침을 참고해 주세요.",
    ])}
    <tr><td align="center" style="padding:28px 28px 12px;">
      <p style="margin:0 0 16px;font-size:16px;font-weight:800;">🚀 오늘의 미션 시작하기</p>
      ${button("오늘의 미션 시작하기 →", loginUrl)}
    </td></tr>
    <tr><td align="center" style="padding:40px 28px 12px;">
      <p style="margin:0;font-size:15px;line-height:1.8;color:${COLOR.inkSoft};">
        매일 하나씩, 작은 도전이 모여 큰 성장이 됩니다.<br>아이들의 즐거운 도전과 성장을 응원합니다!
      </p>
      <p style="margin:18px 0 0;font-size:15px;line-height:1.8;">감사합니다.<br><b>오늘의 미션 도장깨기 운영자 드림</b></p>
    </td></tr>
    <tr><td align="center" style="padding:28px 28px 40px;border-top:1px solid #ece6ff;">
      <p style="margin:14px 0 0;font-size:12px;line-height:1.7;color:${COLOR.inkSoft};">
        문의: <a href="mailto:pograkbg@kakao.com" style="color:${COLOR.primaryDark};">pograkbg@kakao.com</a><br>
        ※ 본 서비스는 가족과 지인을 대상으로 운영하는 비상업 학습 서비스입니다.<br>
        ※ 본 메일은 가입 승인에 따른 자동 발송 안내 메일입니다.
      </p>
    </td></tr>`;

  const text = [
    "안녕하세요! 오늘의 미션 도장깨기입니다.",
    "",
    "🎉 가입을 축하드립니다!",
    "보호자님의 가입 신청이 승인되어 지금부터 서비스를 이용하실 수 있습니다.",
    "오늘의 미션 도장깨기는 아이들이 매일 작은 미션에 도전하고, 성취의 즐거움을 느끼며 성장할 수 있도록 만든 비상업 학습 서비스입니다.",
    "",
    "📚 서비스 이용 안내",
    "- 가입하신 이메일 계정으로 로그인해 주세요.",
    "- 아이의 학습 프로필을 설정하고 오늘의 미션을 시작해 주세요.",
    "- 보호자님은 아이의 학습 기록과 성장 과정을 확인하실 수 있습니다.",
    "",
    "🔒 개인정보 보호 안내",
    "- 수집된 개인정보는 서비스 운영 및 학습 관리 목적으로만 이용됩니다.",
    "- 보호자님은 언제든지 아이의 개인정보 열람·정정·삭제를 요청하실 수 있습니다.",
    "- 자세한 내용은 서비스 내 개인정보 처리방침을 참고해 주세요.",
    "",
    `🚀 오늘의 미션 시작하기: ${loginUrl}`,
    "",
    "매일 하나씩, 작은 도전이 모여 큰 성장이 됩니다.",
    "아이들의 즐거운 도전과 성장을 응원합니다!",
    "감사합니다.",
    "오늘의 미션 도장깨기 운영자 드림",
    "",
    "문의: pograkbg@kakao.com",
    "※ 본 서비스는 가족과 지인을 대상으로 운영하는 비상업 학습 서비스입니다.",
    "※ 본 메일은 가입 승인에 따른 자동 발송 안내 메일입니다.",
  ].join("\n");

  return { subject, text, html: shell("가입이 승인됐어요. 지금 바로 로그인해 보세요.", inner) };
}

/* ---------- 가입 승인 요청 메일 (관리자에게) ---------- */

export function signupRequestMail(params: {
  applicantEmail: string;
  requestedAt: string;
  adminLink: string;
}): { subject: string; text: string; html: string } {
  const subject = "[오늘의 미션] 가입 승인 요청";

  const inner = `
    ${header("📮", "새 가입 신청이 들어왔어요", COLOR.butter, COLOR.ink)}
    <tr><td style="padding:36px 28px 12px;">
      <p style="margin:0;font-size:15px;line-height:1.8;color:${COLOR.inkSoft};">관리자 화면에서 승인해 주세요.</p>
    </td></tr>
    <tr><td style="padding:20px 28px 16px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f3ff;border-radius:18px;">
        <tr><td style="padding:16px 20px;font-size:14px;color:${COLOR.inkSoft};">신청 이메일</td></tr>
        <tr><td style="padding:0 20px 14px;font-size:17px;font-weight:800;color:${COLOR.ink};word-break:break-all;">${esc(params.applicantEmail)}</td></tr>
        <tr><td style="padding:0 20px 16px;font-size:14px;color:${COLOR.inkSoft};">신청 시각 · ${esc(params.requestedAt)} (한국 시간)</td></tr>
      </table>
    </td></tr>
    <tr><td align="center" style="padding:32px 28px 40px;">
      ${button("관리자 화면에서 승인하기 →", params.adminLink)}
    </td></tr>`;

  const text = [
    "새 가입 신청이 들어왔어요.",
    "",
    `신청 이메일: ${params.applicantEmail}`,
    `신청 시각: ${params.requestedAt} (한국 시간)`,
    "",
    `관리자 화면에서 승인해 주세요: ${params.adminLink}`,
  ].join("\n");

  return {
    subject,
    text,
    html: shell("새 가입 신청이 들어왔어요. 관리자 화면에서 승인해 주세요.", inner),
  };
}
