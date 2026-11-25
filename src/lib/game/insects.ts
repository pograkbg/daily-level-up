/**
 * 곤충 도감 (배움의 숲에 모이는 친구들)
 * 각 곤충은 겹치지 않도록 몸의 특징을 분명하게 적었습니다.
 * 칭호(용사, 기사 등) 없이 곤충 이름만 씁니다.
 * icon 은 임시 이모지입니다. 나중에 곤충 일러스트로 바꿉니다.
 */

export type InsectId =
  | "honeybee"
  | "mantis"
  | "grasshopper"
  | "cicada"
  | "ladybug"
  | "butterfly"
  | "dragonfly"
  | "ant";

export interface InsectInfo {
  id: InsectId;
  name: string; // 꿀벌
  icon: string; // 임시 아이콘
  features: string[]; // 생김새 특징 (겹치지 않게)
  habitat: string; // 사는 곳
  tagline: string; // 한 줄 소개
}

export const INSECTS: InsectInfo[] = [
  {
    id: "honeybee",
    name: "꿀벌",
    icon: "🐝",
    features: ["동그랗고 통통한 몸", "노란색과 검은색 줄무늬", "작은 날개 두 쌍"],
    habitat: "꽃밭과 벌집",
    tagline: "꿀을 모아 친구들에게 나눠 줘요.",
  },
  {
    id: "mantis",
    name: "사마귀",
    icon: "svg:mantis",
    features: ["삼각형 모양의 머리", "접어 든 긴 앞다리", "가늘고 긴 몸"],
    habitat: "풀숲과 나뭇가지",
    tagline: "앞다리를 모으고 기다렸다가 재빠르게 움직여요.",
  },
  {
    id: "grasshopper",
    name: "메뚜기",
    icon: "🦗",
    features: ["뒷다리가 아주 긴 점프 다리", "짧고 굵은 더듬이", "초록이나 갈색 몸"],
    habitat: "풀밭과 들판",
    tagline: "뒷다리로 높이, 멀리 뛰어요.",
  },
  {
    id: "cicada",
    name: "매미",
    icon: "🪲",
    features: ["투명하고 넓은 날개", "머리 옆의 큰 눈", "검은 몸에 굵은 가슴"],
    habitat: "여름 나무 위",
    tagline: "여름 내내 큰 소리로 노래해요.",
  },
  {
    id: "ladybug",
    name: "무당벌레",
    icon: "🐞",
    features: ["빨간 등딱지", "검은 점 무늬", "둥글고 작은 몸"],
    habitat: "잎사귀와 정원",
    tagline: "진딧물을 잡아 식물을 지켜요.",
  },
  {
    id: "butterfly",
    name: "나비",
    icon: "🦋",
    features: ["알록달록한 넓은 날개", "돌돌 말린 긴 빨대 입", "가느다란 더듬이"],
    habitat: "꽃밭",
    tagline: "꽃에서 꽃으로 날아다니며 색을 전해요.",
  },
  {
    id: "dragonfly",
    name: "잠자리",
    icon: "svg:dragonfly",
    features: ["길고 가느다란 몸", "커다란 겹눈", "투명한 날개 두 쌍"],
    habitat: "연못과 냇가",
    tagline: "물가를 빠르게 날며 하늘을 살펴요.",
  },
  {
    id: "ant",
    name: "개미",
    icon: "🐜",
    features: ["작고 검은 몸", "가느다란 허리", "긴 더듬이"],
    habitat: "땅속 개미집",
    tagline: "친구들과 줄 지어 일하고 함께 나눠요.",
  },
];

export const INSECT_IDS = INSECTS.map((i) => i.id);

export function insectById(id: string): InsectInfo | undefined {
  return INSECTS.find((i) => i.id === id);
}
