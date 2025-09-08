// src/components/Header.tsx
"use client";

import { Bubbles, Fish, type LucideIcon } from "lucide-react";
import UserMenu from "./UserMenu";

import UserXpBadge from "@/features/xp/UserXpBadge";
import AddGoldButton from "@/features/gold/AddGoldButton";
import UserGoldDisplay from "@/features/gold/UserGoldDisplay";
// import UserXpPlusOne from "@/features/xp/UserXpPlusOneButton";

type Props = {
  title?: string;
  slogan?: string;
  icon?: LucideIcon; // ⬅️ 루시드 아이콘 타입
  className?: string;
};

export default function Header({
  title = "아쿠아링",
  slogan = "슬로건은 여기에",
  icon = Bubbles,
  className,
}: Props) {
  const Icon = icon ?? Fish;

  return (
    <header
      className={[
        "sticky top-0 z-40 w-full border-b bg-background/70 backdrop-blur",
        className ?? "",
      ].join(" ")}
      role="banner"
    >
      <div className="mx-auto max-w-screen-2xl px-4">
        {/* 1행: 좌측 로고/제목, 우측 XP배지 + 프로필 메뉴 */}
        <div className="flex h-14 items-center justify-between">
          <a
            href="/"
            className="inline-flex items-center gap-2"
            aria-label={`${title} 홈으로 이동`}
          >
            <Icon className="h-8 w-8 text-sky-600" />
            <span className="text-2xl font-bold tracking-tight">{title}</span>
          </a>

          {/* 우측 묶음: XP 배지 + 프로필 메뉴 나란히 */}
          <div className="flex items-center gap-3">
            <UserXpBadge />
            <UserMenu />
          </div>
        </div>

        {/* 2행: 슬로건 */}
        <div className="pb-3">
          <p className="text-sm text-muted-foreground">{slogan}</p>
        </div>
      </div>

      <AddGoldButton />
      <UserGoldDisplay />
      {/* 기존: 헤더 밖에 있던 배지는 제거 */}
      {/* <UserXpBadge /> */}
      {/* <UserXpPlusOne /> */}
    </header>
  );
}
