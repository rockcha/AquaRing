// src/layouts/PageLayout.tsx
"use client";

import {
  useMemo,
  useState,
  useCallback,
  createContext,
  useContext,
} from "react";
import Header from "./header/Header";
import { Outlet } from "react-router-dom";
import { Bubbles, type LucideIcon } from "lucide-react";
import FriendsDock from "@/features/friend/FriendsDock";
import AppNav from "@/features/nav/AppNav";

type HeaderConfig = {
  title?: string;
  slogan?: string;
  icon?: LucideIcon;
};
type Ctx = {
  header: HeaderConfig;
  setHeader: (patch: Partial<HeaderConfig>) => void;
};

const HeaderContext = createContext<Ctx | null>(null);

export function usePageHeader() {
  const ctx = useContext(HeaderContext);
  if (!ctx) throw new Error("usePageHeader must be used within <PageLayout>");
  return ctx.setHeader;
}

export default function PageLayout() {
  const [header, setHeaderState] = useState<HeaderConfig>({
    title: "아쿠아링",
    slogan: "슬로건 영역",
    icon: Bubbles,
  });

  // ✅ 레퍼런스 고정 + 같은 값이면 업데이트 스킵
  const setHeader = useCallback((patch: Partial<HeaderConfig>) => {
    setHeaderState((prev) => {
      const next: HeaderConfig = { ...prev, ...patch };
      if (
        prev.title === next.title &&
        prev.slogan === next.slogan &&
        prev.icon === next.icon
      ) {
        return prev; // 변경 없음 → 렌더 방지
      }
      return next;
    });
  }, []);

  const value = useMemo(() => ({ header, setHeader }), [header, setHeader]);

  return (
    <HeaderContext.Provider value={value}>
      <Header title={header.title} slogan={header.slogan} icon={header.icon} />
      <main className="mx-auto max-w-screen-2xl px-4 py-6">
        <AppNav />
        <FriendsDock />
        <Outlet />
      </main>
    </HeaderContext.Provider>
  );
}
