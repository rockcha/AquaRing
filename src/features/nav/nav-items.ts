// src/features/nav/nav-items.ts
import type { LucideIcon } from "lucide-react";
import { Home, User, ShoppingBag } from "lucide-react";

export type NavItem = {
  key: string;
  path: string;
  label: string;
  icon: LucideIcon;
  slogan?: string; // 선택: 헤더 슬로건도 맞추고 싶으면 넣기
};

export const NAV_ITEMS: NavItem[] = [
  {
    key: "home",
    path: "/main",
    label: "메인페이지",
    icon: Home,
    slogan: "환영합니다!",
  },
  {
    key: "me",
    path: "/me",
    label: "마이페이지",
    icon: User,
    slogan: "내 정보와 활동",
  },
  {
    key: "shop",
    path: "/shop",
    label: "상점",
    icon: ShoppingBag,
    slogan: "필요한 걸 찾아보세요",
  },
];

// path 매칭 도우미 (prefix 매칭)
export function matchNav(pathname: string): NavItem | undefined {
  // 가장 긴 path 우선 매칭 (중첩 라우트 고려)
  return [...NAV_ITEMS]
    .sort((a, b) => b.path.length - a.path.length)
    .find((item) => pathname.startsWith(item.path));
}
