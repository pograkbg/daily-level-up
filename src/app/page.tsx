import { redirect } from "next/navigation";
import { HomeScreen } from "@/components/home/HomeScreen";
import { hasChildProfile } from "@/lib/data/child-repository";
import { getHomeData } from "@/lib/data/home-repository";
import { getEnglishDailyStatus, getEnglishStats, getEnglishSummary } from "@/lib/data/english-repository";
import { currentLoginEmail, isCurrentAdmin } from "@/lib/data/admin-repository";
import { getWrongEnglish, getWrongMath } from "@/lib/data/wrong-answers-repository";

// 미션 결과가 바로 반영되도록 요청마다 새로 그립니다.
export const dynamic = "force-dynamic";

/** 아이 홈 화면 (서버에서 데이터를 가져와 화면에 전달) */
export default async function HomePage() {
  if (!(await hasChildProfile())) {
    redirect("/setup");
  }
  const [data, summary, daily, englishStats, isAdmin, loginEmail, wrongMath, wrongEnglish] = await Promise.all([
    getHomeData(),
    getEnglishSummary(),
    getEnglishDailyStatus(),
    getEnglishStats(),
    isCurrentAdmin(),
    currentLoginEmail(),
    getWrongMath(30),
    getWrongEnglish(30),
  ]);
  return (
    <HomeScreen
      data={data}
      isAdmin={isAdmin}
      loginEmail={loginEmail}
      wrong={{ math: wrongMath, english: wrongEnglish }}
      english={{ summary, dailyUsed: daily.used, dailyMax: daily.max, stats: englishStats }}
    />
  );
}
