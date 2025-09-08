// src/widgets/UserXpBadge.tsx
"use client";

import { useEffect, useRef, useState, type ComponentType } from "react";
import * as Lucide from "lucide-react";
import type { SVGProps } from "react";
import { describeXp, type XpDescriptor } from "@/features/xp/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { useXp } from "@/features/xp/xpStore";
import { toast } from "sonner";

export default function UserXpBadge() {
  const { xp, loading, err } = useXp();

  const SIZE = 28,
    ICON = 16,
    DENOM = 30;

  const d: XpDescriptor = describeXp(xp);
  type LucideName = keyof typeof Lucide;
  const Icon = (Lucide[d.majorIcon as LucideName] ??
    Lucide.Fish) as ComponentType<SVGProps<SVGSVGElement>>;

  const n = xp % DENOM;
  const [percent, setPercent] = useState<number>((n / DENOM) * 100);

  const prevTierLabelRef = useRef<string>(d.label);
  const prevNRef = useRef<number>(n);
  const mountedRef = useRef(false);

  useEffect(() => {
    const prevLabel = prevTierLabelRef.current;
    const tierChanged = prevLabel !== d.label;
    const wrappedDown = n < prevNRef.current;

    if (mountedRef.current && tierChanged) {
      toast.success(`승급! ${prevLabel} → ${d.label}`);
    }

    if (tierChanged || wrappedDown) {
      setPercent(0);
      const id = setTimeout(() => setPercent((n / DENOM) * 100), 30);
      prevTierLabelRef.current = d.label;
      prevNRef.current = n;
      mountedRef.current = true;
      return () => clearTimeout(id);
    }

    setPercent((n / DENOM) * 100);
    prevTierLabelRef.current = d.label;
    prevNRef.current = n;
    mountedRef.current = true;
  }, [d.label, n]);

  if (loading) {
    return (
      <div className="inline-flex flex-col items-start gap-1">
        <div className="flex items-center gap-2">
          <span
            className="inline-flex items-center justify-center rounded-full animate-pulse bg-gray-200 dark:bg-zinc-700"
            style={{ width: SIZE, height: SIZE }}
          />
          <div className="h-5 w-24 rounded bg-gray-200 dark:bg-zinc-700 animate-pulse" />
        </div>
        <div className="h-2 w-[calc(28px+0.5rem+6rem)] rounded-full bg-gray-200 dark:bg-zinc-800 animate-pulse" />
      </div>
    );
  }
  if (err) return null;

  return (
    <TooltipProvider>
      {/* 래퍼를 inline-flex로 → 너비가 헤더 내용에 맞춰짐 */}
      <div className="inline-flex flex-col items-start gap-1">
        {/* 헤더: 뱃지(왼쪽) + 티어 이름(오른쪽) */}
        <div className="flex items-center gap-2">
          <div
            className="inline-flex select-none items-center cursor-default"
            role="img"
            aria-label={`Tier: ${d.label}`}
            title={d.label}
          >
            <span
              aria-hidden
              style={{
                width: SIZE,
                height: SIZE,
                backgroundColor: d.majorColor,
              }}
              className="inline-flex items-center justify-center rounded-full shadow-sm ring-1 ring-black/5"
            >
              <Icon width={ICON} height={ICON} color="#fff" />
            </span>
          </div>
          <span className="text-sm font-semibold text-foreground">
            {d.label}
          </span>
        </div>

        {/* 프로그레스바: w-full → 위 헤더와 동일 너비 */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className="group relative h-2 w-full overflow-hidden rounded-full bg-secondary shadow-inner ring-1 ring-black/5"
              role="progressbar"
              aria-label={`${n}/30`}
              aria-valuemin={0}
              aria-valuemax={30}
              aria-valuenow={n}
            >
              <div
                className="h-full rounded-full transition-[width] duration-500 ease-out"
                style={{ width: `${percent}%`, backgroundColor: d.majorColor }}
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/20 to-transparent mix-blend-overlay" />
            </div>
          </TooltipTrigger>
          <TooltipContent side="top" align="center">
            <div className="text-xs font-medium tabular-nums">{n}/30</div>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
