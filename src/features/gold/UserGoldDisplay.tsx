// src/widgets/UserGoldDisplay.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { Coins } from "lucide-react";
import { useGold } from "./goldStore";

type Props = {
  className?: string;
  iconSize?: number;
};

export default function UserGoldDisplay({
  className = "",
  iconSize = 18,
}: Props) {
  const { amount, loading, err } = useGold();

  // 화면에 표시되는 값(롤링용)
  const [displayed, setDisplayed] = useState<number>(amount ?? 0);
  // 색 하이라이트 방향
  const [direction, setDirection] = useState<"up" | "down" | null>(null);
  const rafRef = useRef<number | null>(null);
  const firstMountRef = useRef(true);

  // amount 변경 시 롤링 애니메이션
  useEffect(() => {
    if (loading || err) return;
    if (firstMountRef.current) {
      // 첫 마운트는 애니메이션 없이 정착
      firstMountRef.current = false;
      setDisplayed(amount);
      return;
    }
    if (amount === displayed) return;

    const start = displayed;
    const target = amount;
    const diff = Math.abs(target - start);
    const dir = target > start ? "up" : "down";
    setDirection(dir);

    // 적응형 step: 작은 변화는 1씩, 큰 변화는 빠르게(총 프레임 ~ 45~90)
    const minFrames = 45;
    const maxFrames = 90;
    const frames = Math.min(maxFrames, Math.max(minFrames, diff)); // 프레임 수
    const step = Math.max(1, Math.round(diff / frames));
    const sign = dir === "up" ? 1 : -1;

    // rAF 루프
    const tick = () => {
      setDisplayed((prev) => {
        const next = prev + sign * step;
        if ((sign > 0 && next >= target) || (sign < 0 && next <= target)) {
          // 끝
          setDirection(null);
          return target;
        }
        return next;
      });
      rafRef.current = requestAnimationFrame(tick);
    };

    // 시작 전에 기존 rAF 정리
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [amount, loading, err]); // displayed는 내부에서 업데이트

  if (loading) {
    return (
      <div className={`inline-flex items-center gap-2 ${className}`}>
        <span
          className="inline-block rounded-full bg-amber-200 animate-pulse"
          style={{ width: iconSize + 4, height: iconSize + 4 }}
        />
        <span className="h-4 w-12 rounded bg-gray-200 dark:bg-zinc-800 animate-pulse" />
      </div>
    );
  }
  if (err) return null;

  const colorClass =
    direction === "up"
      ? "text-emerald-600"
      : direction === "down"
      ? "text-rose-600"
      : "text-foreground";

  const scaleClass = direction ? "scale-105" : "scale-100";

  return (
    <div
      className={`inline-flex items-center gap-2 ${className}`}
      aria-label="현재 골드"
    >
      <Coins className="text-yellow-500" width={iconSize} height={iconSize} />
      <span
        className={[
          "text-sm font-semibold tabular-nums transition-colors duration-200",
          "transform transition-transform duration-150",
          colorClass,
          scaleClass,
        ].join(" ")}
        aria-live="polite"
      >
        {displayed.toLocaleString()}
      </span>
    </div>
  );
}
