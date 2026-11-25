import Link from "next/link";
import { signOutAction } from "@/app/login/actions";
import { DragonMascot } from "@/components/ui/DragonMascot";
import { ResourceChip } from "@/components/ui/ResourceChip";
import { getLevelInfo } from "@/lib/game/level";
import type { PlayerProfile } from "@/types/game";

interface HomeHeaderProps {
  profile: PlayerProfile;
  isAdmin?: boolean;
  loginEmail?: string | null;
}

/** 이름을 부를 때 붙이는 말: 받침이 있으면 "아", 없으면 "야" (예: 도율아, 서아야). */
function greetingName(name: string): string {
  const last = name.trim().slice(-1);
  const code = last.charCodeAt(0);
  const hasBatchim = code >= 0xac00 && code <= 0xd7a3 && (code - 0xac00) % 28 !== 0;
  return `${name}${hasBatchim ? "아" : "야"}`;
}

/** 상단 알약 한 종류의 모양. 같은 높이·같은 둥근 모양을 써서 한 줄이 통일돼 보이게 합니다. */
const PILL = "flex h-14 w-full items-center justify-center gap-2 rounded-full bg-white px-3 font-bold text-ink shadow-md";

/**
 * 상단 요약 (대시보드).
 * 왼쪽: 드래곤과 인사말 · 오른쪽: 수치(캐릭터 레벨, 경험치, 코인, 연속 학습) → 계정(관리자, 로그인 계정, 로그아웃)
 * 관리자 메뉴는 관리자 계정에만 보입니다.
 */
export function HomeHeader({ profile, isAdmin = false, loginEmail = null }: HomeHeaderProps) {
  const levelInfo = getLevelInfo(profile.characterXp);
  const isSupabase = process.env.DATA_SOURCE === "supabase";

  return (
    <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div className="flex items-center gap-4">
        <DragonMascot className="h-28 w-28 shrink-0 drop-shadow-md sm:h-32 sm:w-32" />
        <div className="relative min-w-[20rem] rounded-3xl bg-white px-7 py-5 shadow-md sm:min-w-[26rem]">
          <p className="text-2xl font-extrabold leading-snug text-ink sm:text-3xl">
            <span className="whitespace-nowrap">{greetingName(profile.nickname)}.</span>
            <br />
            <span className="whitespace-nowrap">도전해봐 오늘의 미션을! 🌟</span>
          </p>
        </div>
      </div>

      <div className="grid w-full grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3 md:w-[46rem]">
        <ResourceChip
          className="h-14 w-full justify-center"
          icon="🏆"
          label="캐릭터 레벨"
          value={`Lv. ${levelInfo.level}`}
          title="지금 키우는 친구의 레벨이에요. 성충(레벨 9)이 되면 새 친구를 고를 수 있어요."
        />
        <ResourceChip
          className="h-14 w-full justify-center"
          icon="⭐"
          label="누적 경험치"
          value={profile.totalXp.toLocaleString("ko-KR")}
          title="지금까지 모은 경험치 전체예요. 줄어들지 않아요."
        />
        <ResourceChip
          className="h-14 w-full justify-center"
          icon="🪙"
          label="보유 코인"
          value={profile.coins.toLocaleString("ko-KR")}
          title="통장에 모인 코인 잔액이에요. 미션을 끝내면 쌓여요."
        />
        <ResourceChip
          className="h-14 w-full justify-center"
          icon="🔥"
          label="연속 학습"
          value={`${profile.streakDays}일`}
          title="연속으로 공부한 날 수예요."
        />

        {isSupabase && (
          <Link href="/friends" className={`${PILL} hover:brightness-105`}>
            👫 친구 랭킹
          </Link>
        )}
        {isSupabase && loginEmail && (
          <Link href="/account" className={`${PILL} hover:brightness-105`}>
            👤 내 계정
          </Link>
        )}
        {isSupabase && (
          <form action={signOutAction} className="flex w-full">
            <button type="submit" className={`${PILL} hover:brightness-105`}>
              로그아웃
            </button>
          </form>
        )}
        {isSupabase && isAdmin && (
          <Link href="/admin" className={`${PILL} hover:brightness-105`}>
            🛠 관리자 모드
          </Link>
        )}
      </div>
    </header>
  );
}
