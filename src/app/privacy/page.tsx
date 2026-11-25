import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { buttonClassName } from "@/components/ui/Button";

export const dynamic = "force-static";

const EFFECTIVE_DATE = "2026년 11월 25일";

/** 개인정보 처리방침. 로그인 없이 볼 수 있습니다. */
export default function PrivacyPage() {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col gap-6 px-4 py-8 sm:px-6">
      <nav className="flex items-center justify-between gap-3">
        <Link href="/signup" className={buttonClassName({ variant: "secondary", className: "px-4" })}>
          ← 돌아가기
        </Link>
        <p className="text-sm font-bold text-ink-soft">시행일 {EFFECTIVE_DATE}</p>
      </nav>

      <h1 className="text-2xl font-extrabold text-ink sm:text-3xl">개인정보 처리방침</h1>

      <Card className="flex flex-col gap-6 text-base leading-relaxed text-ink">
        <p>
          &quot;오늘의 미션 도장깨기&quot;(이하 &quot;서비스&quot;)는 가족과 지인이 함께 쓰는 비상업 학습 서비스입니다.
          서비스는 보호자가 가입하고, 보호자가 아이의 학습을 관리하는 방식으로 운영합니다. 이 방침은 어떤 정보를 왜
          모으고 어떻게 보호하는지 설명합니다.
        </p>

        <Section title="1. 모으는 정보">
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <b>보호자:</b> 이메일 주소, 비밀번호(암호화된 값으로만 저장하며 원문은 저장하지 않습니다), 가입 동의 시각.
            </li>
            <li>
              <b>아이:</b> 닉네임, 학년, 학습 기록(문제 풀이 결과, 풀이 시간, 틀린 문제, 레벨, 경험치, 코인, 캐릭터).
            </li>
            <li>
              <b>이용 과정:</b> 로그인 상태를 유지하기 위한 세션 정보.
            </li>
          </ul>
        </Section>

        <Section title="2. 이용 목적">
          <ul className="list-disc space-y-1 pl-5">
            <li>로그인, 계정 확인, 관리자 승인 여부 확인</li>
            <li>아이의 학습 기록 저장과 학습 안내(코칭)</li>
            <li>가입 승인 요청과 승인 완료를 알리는 메일 발송</li>
            <li>오류 확인과 서비스 개선</li>
          </ul>
        </Section>

        <Section title="3. 보유 기간">
          <p>
            계정을 삭제할 때까지 보관합니다. 보호자가 삭제를 요청하면 특별한 사정이 없는 한 지체 없이 삭제하며,
            백업본에 남은 정보는 백업 주기에 따라 자동으로 지워집니다.
          </p>
        </Section>

        <Section title="4. 처리 위탁과 외부 서비스">
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <b>데이터 저장과 로그인:</b> Supabase (계정, 학습 기록 저장)
            </li>
            <li>
              <b>메일 발송:</b> Google Gmail (가입 승인 요청과 승인 완료 메일 발송에 필요한 주소와 내용)
            </li>
            <li>
              <b>영어 단어 발음·음성 조회:</b> FreeDictionaryAPI.com, dictionaryapi.dev. 조회하는 영어 단어와 접속
              기기의 정보(IP 주소 등)가 전달될 수 있습니다. 아이의 이름과 보호자 이메일은 전달하지 않습니다.
            </li>
          </ul>
        </Section>

        <Section title="5. 아동의 개인정보">
          <p>
            아이의 정보는 보호자가 입력합니다. 만 14세 미만 아동의 개인정보는 법정대리인인 보호자의 동의를 받은 뒤에만
            처리합니다. 보호자는 가입할 때 이 방침에 동의합니다.
          </p>
        </Section>

        <Section title="6. 보호자의 권리">
          <p>
            보호자는 언제든지 아이의 정보를 열람·정정·삭제하거나 처리를 멈추도록 요청하고, 계정을 삭제할 수 있습니다.
            아래 연락처로 요청해 주세요.
          </p>
        </Section>

        <Section title="7. 안전성 확보 조치">
          <ul className="list-disc space-y-1 pl-5">
            <li>모든 연결은 암호화(HTTPS)로 주고받습니다.</li>
            <li>비밀번호는 암호화하여 저장합니다.</li>
            <li>데이터마다 접근 권한을 나눠, 본인 계정의 정보만 볼 수 있게 합니다.</li>
            <li>관리자 화면은 2단계 인증을 거쳐야 들어갈 수 있습니다.</li>
            <li>가입은 관리자가 승인한 계정만 이용할 수 있습니다.</li>
          </ul>
        </Section>

        <Section title="8. 쿠키">
          <p>로그인 상태를 유지하기 위한 필수 쿠키만 씁니다. 광고나 추적을 위한 쿠키는 쓰지 않습니다.</p>
        </Section>

        <Section title="9. 개인정보 보호책임자">
          <ul className="list-disc space-y-1 pl-5">
            <li>이름: [도율아빠]</li>
            <li>연락처: [pograkbg@kakao.com]</li>
          </ul>
        </Section>

        <Section title="10. 방침의 변경">
          <p>이 방침의 내용이 바뀌면 시행일 전에 이 페이지에서 미리 알려 드립니다.</p>
        </Section>
      </Card>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-lg font-extrabold text-ink">{title}</h2>
      {children}
    </section>
  );
}
