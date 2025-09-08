// src/features/xp/constants.ts
export const BLOCK_SIZE = 30; // 초/중/고급 한 단계 크기
export const SUB_LABELS = ["초급", "중급", "고급"] as const;

export type MajorTierId =
  | "novice"
  | "apprentice"
  | "skilled"
  | "expert"
  | "master";
export type MajorTier = {
  id: MajorTierId;
  label: string; // 한글
  color: string; // 배경색 (원형)
  icon: string; // lucide-react 아이콘 이름
};

export const MAJOR_TIERS: MajorTier[] = [
  { id: "novice", label: "입문자", color: "#93C5FD", icon: "Fish" },
  { id: "apprentice", label: "견습생", color: "#60A5FA", icon: "Waves" },
  { id: "skilled", label: "숙련자", color: "#06B6D4", icon: "Anchor" },
  { id: "expert", label: "전문가", color: "#14B8A6", icon: "Medal" },
  { id: "master", label: "마스터", color: "#6366F1", icon: "Crown" },
];

export const SUBS_PER_MAJOR = 3; // 초/중/고
export const MAJOR_SIZE = BLOCK_SIZE * SUBS_PER_MAJOR; // 90 xp
