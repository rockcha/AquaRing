// src/features/nav/AppNav.tsx
"use client";

import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { NAV_ITEMS, matchNav } from "./nav-items";
import { usePageHeader } from "@/layouts/PageLayout";

type Props = { className?: string };

export default function AppNav({ className = "" }: Props) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const setHeader = usePageHeader();

  // 라우트 변경 시 헤더(아이콘/타이틀/슬로건) 자동 맞춤
  useEffect(() => {
    const current = matchNav(pathname);
    if (current) {
      setHeader({
        title: current.label,
        icon: current.icon,
        slogan: current.slogan,
      });
    }
  }, [pathname, setHeader]);

  return (
    <nav
      className={[
        "flex items-center gap-2 py-2",
        "rounded-xl border bg-card/70 backdrop-blur px-2",
        "shadow-sm",
        className,
      ].join(" ")}
      aria-label="주요 화면 이동"
    >
      {NAV_ITEMS.map((item) => {
        const ActiveIcon = item.icon;
        const isActive = pathname.startsWith(item.path);

        return (
          <Tooltip key={item.key}>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                onClick={() => navigate(item.path)}
                aria-current={isActive ? "page" : undefined}
                aria-label={item.label}
                className={[
                  "group grid place-items-center",
                  "h-12 w-12 rounded-xl",
                  "border transition-all duration-200",
                  isActive
                    ? "bg-primary/10 text-primary border-primary/30"
                    : "bg-background/80 text-foreground/80 hover:bg-accent hover:text-foreground border-border",
                  "focus-visible:ring-2 focus-visible:ring-ring",
                ].join(" ")}
              >
                <ActiveIcon className="h-5 w-5" />
                <span className="sr-only">{item.label}</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              {item.label}
            </TooltipContent>
          </Tooltip>
        );
      })}
    </nav>
  );
}
