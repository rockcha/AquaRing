// src/widgets/BaitsAdjustCard.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useBaits, adjustBait, refreshBaits } from "@/features/baits/baitStore";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Minus, Plus, RefreshCcw } from "lucide-react";

export default function BaitsAdjustCard() {
  const { items, loading, err } = useBaits();
  const [title, setTitle] = useState<string>("");
  const [deltaText, setDeltaText] = useState("1");
  const [pending, setPending] = useState(false);

  // 첫 로드 시 기본 선택값
  useEffect(() => {
    if (!title && !loading && items.length > 0) {
      setTitle(items[0].title);
    }
  }, [loading, items, title]);

  const delta = useMemo(() => {
    const n = Number(deltaText);
    return Number.isFinite(n) ? Math.trunc(n) : 1;
  }, [deltaText]);

  const doAdjust = async (d: number) => {
    if (!title || pending) return;
    setPending(true);
    try {
      // 현재 수량 스냅샷(토스트 표시용)
      const cur = items.find((b) => b.title === title)?.qty ?? 0;
      await adjustBait(title, d); // 전역 스토어: 낙관적 업데이트 + Realtime/서버 보정
      const next = Math.max(0, cur + d);
      toast.success(`${title} 수량: ${cur} → ${next}`);
    } catch (e: any) {
      toast.error(e?.message ?? "수량 변경 실패");
    } finally {
      setPending(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="flex items-start justify-between">
        <div>
          <CardTitle className="text-base font-semibold">
            미끼 수량 조정 (테스트)
          </CardTitle>
          <CardDescription>title로 선택 후 + / - 테스트</CardDescription>
        </div>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          onClick={() => void refreshBaits()}
          aria-label="새로고침"
          disabled={loading}
        >
          <RefreshCcw className="h-4 w-4" />
        </Button>
      </CardHeader>

      <CardContent className="space-y-3">
        {err ? (
          <p className="text-sm text-rose-600">{err}</p>
        ) : (
          <>
            {/* 미끼 선택 */}
            <div className="grid gap-1.5">
              <label
                htmlFor="bait-select"
                className="text-sm text-muted-foreground"
              >
                미끼 선택
              </label>
              <select
                id="bait-select"
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={loading || items.length === 0}
              >
                {items.map((b) => (
                  <option key={b.bait_id} value={b.title}>
                    {b.emoji} {b.title} (보유 {b.qty})
                  </option>
                ))}
              </select>
            </div>

            {/* 증감 값 */}
            <div className="grid gap-1.5">
              <label htmlFor="delta" className="text-sm text-muted-foreground">
                증감 값 (정수, 음수 가능)
              </label>
              <Input
                id="delta"
                value={deltaText}
                onChange={(e) => setDeltaText(e.target.value)}
                inputMode="numeric"
                pattern="-?[0-9]*"
                placeholder="예: 1, -1, 5"
              />
            </div>

            {/* 액션 버튼들 */}
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => doAdjust(-Math.abs(delta || 1))}
                disabled={loading || !title || pending}
              >
                <Minus className="mr-1 h-4 w-4" /> 감소
              </Button>
              <Button
                type="button"
                onClick={() => doAdjust(Math.abs(delta || 1))}
                disabled={loading || !title || pending}
              >
                <Plus className="mr-1 h-4 w-4" /> 증가
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
