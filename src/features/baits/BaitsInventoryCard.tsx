// src/widgets/BaitsInventoryCard.tsx
"use client";

import { RefreshCcw } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useBaits, refreshBaits } from "@/features/baits/baitStore";

export default function BaitsInventoryCard() {
  const { items, loading, err } = useBaits();

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base font-semibold">
          내 미끼 인벤토리
        </CardTitle>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => void refreshBaits()}
          aria-label="새로고침"
        >
          <RefreshCcw className="h-4 w-4" />
        </Button>
      </CardHeader>

      <CardContent>
        {err ? (
          <p className="text-sm text-rose-600">{err}</p>
        ) : (
          <>
            <ul className="divide-y">
              {loading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <li
                      key={i}
                      className="flex items-center justify-between py-2"
                    >
                      <span className="h-5 w-24 rounded bg-gray-200 dark:bg-zinc-800 animate-pulse" />
                      <span className="h-4 w-10 rounded bg-gray-200 dark:bg-zinc-800 animate-pulse" />
                    </li>
                  ))
                : items.map((b) => (
                    <li
                      key={b.bait_id}
                      className="flex items-center justify-between py-2"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{b.emoji}</span>
                        <span className="text-sm">{b.title}</span>
                      </div>
                      <span className="text-sm font-medium tabular-nums">
                        {b.qty}
                      </span>
                    </li>
                  ))}
            </ul>

            {!loading && items.length === 0 && (
              <p className="text-sm text-muted-foreground pt-4">
                표시할 미끼가 없어요.
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
