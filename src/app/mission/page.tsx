import { redirect } from "next/navigation";
import { MissionScreen } from "@/components/mission/MissionScreen";
import { hasChildProfile } from "@/lib/data/child-repository";
import { getHomeData } from "@/lib/data/home-repository";
import { getMissionView } from "@/lib/data/mission-repository";
import { BGM_BY_BAND, bandForProgress } from "@/lib/game/music";

// 답을 제출할 때마다 최신 상태를 보여야 하므로 요청마다 새로 그립니다.
export const dynamic = "force-dynamic";

/** 오늘의 수학 미션 화면 */
export default async function MissionPage() {
  if (!(await hasChildProfile())) {
    redirect("/setup");
  }
  const [view, home] = await Promise.all([getMissionView(), getHomeData()]);
  const bgmSrc = BGM_BY_BAND[bandForProgress(home.profile.progress)];
  return <MissionScreen initialView={view} bgmSrc={bgmSrc} />;
}
