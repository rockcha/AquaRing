// src/widgets/BaitShopCard.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Coins, RefreshCcw, ShoppingCart } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

import {
  getBaitsCatalog,
  purchaseBaitByTitle,
  type CatalogBait,
} from "@/features/baits/api";
import { useGold } from "../gold/goldStore"; // { amount, loading }
import { useBaits, refreshBaits } from "@/features/baits/baitStore";

export default function BaitShopCard() {
  const [catalog, setCatalog] = useState<CatalogBait[]>([]);
  const [loading, setLoading] = useState(true);

  // 선택 & 구매 다이얼로그
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string>(""); // title
  const [qtyText, setQtyText] = useState("1");
  const [pending, setPending] = useState(false);

  const { amount: gold, loading: goldLoading } = useGold();
  const { items: myBaits } = useBaits();

  const refresh = async () => {
    try {
      setLoading(true);
      const rows = await getBaitsCatalog();
      setCatalog(rows);
    } catch (e: any) {
      toast.error(e?.message ?? "상점 목록을 불러오지 못했어요");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const current = useMemo(
    () => catalog.find((b) => b.title === selected) ?? null,
    [catalog, selected]
  );

  const currentOwnedQty = useMemo(() => {
    if (!selected) return 0;
    return myBaits.find((x) => x.title === selected)?.qty ?? 0;
  }, [selected, myBaits]);

  // qty 파싱 (빈값/0/음수 방지)
  const qty = useMemo(() => {
    const n = Number(qtyText);
    if (!Number.isFinite(n)) return 1;
    const i = Math.trunc(n);
    return i > 0 ? i : 1;
  }, [qtyText]);

  const total = current ? current.price * qty : 0;
  // 골드 로딩 중에는 버튼 비활성 사유가 되지 않도록 분리
  const notEnough = current ? !goldLoading && gold < total : true;
  const ownedAfter = currentOwnedQty + qty;

  const openDialogFor = (title: string) => {
    setSelected(title);
    setQtyText("1");
    setOpen(true);
  };

  const buy = async () => {
    if (!current || pending) return;
    setPending(true);
    try {
      const res = await purchaseBaitByTitle(current.title, qty);
      toast.success(
        `구매 완료: ${res.title} × ${
          res.purchased
        } (−${res.cost.toLocaleString()} 골드)`
      );
      setOpen(false);
      setQtyText("1");
      void refreshBaits(); // 보정
    } catch (e: any) {
      const msg = String(e?.message ?? e);
      if (msg.includes("INSUFFICIENT_GOLD")) toast.error("골드가 부족합니다.");
      else toast.error(`구매 실패: ${msg}`);
    } finally {
      setPending(false);
    }
  };

  return (
    <>
      <Card className="w-full max-w-3xl">
        <CardHeader className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base font-semibold">미끼 상점</CardTitle>
            <CardDescription>
              네모 칸을 눌러 수량/총액을 확인하고 구매하세요
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => void refresh()}
            aria-label="새로고침"
            disabled={loading}
          >
            <RefreshCcw className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* 보유 골드 */}
          <div className="flex justify-end items-center gap-2 text-sm">
            <Coins className="h-4 w-4 text-yellow-500" />
            <span className="font-semibold tabular-nums">
              {gold.toLocaleString()}
            </span>
          </div>

          {/* 네모칸 그리드 */}
          <TooltipProvider>
            <div className="grid grid-cols-3 gap-3 sm:gap-4">
              {loading
                ? Array.from({ length: 9 }).map((_, i) => (
                    <div
                      key={i}
                      className="aspect-square rounded-lg border bg-neutral-50 dark:bg-neutral-900/40 animate-pulse"
                    />
                  ))
                : catalog.map((b) => (
                    <Tooltip key={b.id}>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          onClick={() => openDialogFor(b.title)}
                          aria-label={b.title}
                          className={[
                            "aspect-square w-full rounded-lg border transition",
                            "bg-neutral-50 hover:bg-neutral-100 dark:bg-neutral-900/40 dark:hover:bg-neutral-900",
                            "ring-1 ring-transparent hover:ring-neutral-300/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400",
                          ].join(" ")}
                        >
                          <div className="h-full w-full flex flex-col items-center justify-center p-2">
                            <div className="text-3xl leading-none">
                              {b.emoji}
                            </div>
                            <div className="mt-2 flex items-center gap-1 text-[11px] text-muted-foreground tabular-nums">
                              <Coins className="h-3 w-3 text-yellow-500" />
                              {b.price.toLocaleString()}
                            </div>
                          </div>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top" align="center">
                        {b.title}
                      </TooltipContent>
                    </Tooltip>
                  ))}
            </div>
          </TooltipProvider>
        </CardContent>
      </Card>

      {/* 구매 다이얼로그 */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {current ? (
                <>
                  <span className="text-2xl">{current.emoji}</span>
                  <span>{current.title}</span>
                </>
              ) : (
                "미끼 구매"
              )}
            </DialogTitle>
            <DialogDescription>
              수량을 정하고 총 비용을 확인한 뒤 구매할 수 있어요.
            </DialogDescription>
          </DialogHeader>

          {current && (
            <div className="space-y-4">
              {/* 내 골드만 간단히 표시 (단가 박스 제거) */}
              <div className="flex items-center justify-end gap-2 text-sm">
                <Coins className="h-4 w-4 text-yellow-500" />
                <span className="font-medium tabular-nums">
                  {gold.toLocaleString()}
                </span>
              </div>

              {/* 수량 + (현재 보유 → 보유+입력수량) */}
              <div className="grid gap-1.5">
                <label htmlFor="qty" className="text-sm text-muted-foreground">
                  수량
                </label>
                <div className="flex items-center gap-3">
                  <Input
                    id="qty"
                    className="w-28 text-right"
                    value={qtyText}
                    onChange={(e) => setQtyText(e.target.value)}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="1"
                  />
                  <div className="text-xs text-muted-foreground">
                    현재 보유 {currentOwnedQty} →{" "}
                    <span className="font-medium text-foreground">
                      {ownedAfter}
                    </span>
                  </div>
                </div>
              </div>

              {/* 총액 */}
              <div className="flex items-center justify-between rounded-md border p-3">
                <div className="text-sm text-muted-foreground">총 비용</div>
                <div className="inline-flex items-center gap-1 font-semibold tabular-nums">
                  <Coins className="h-4 w-4 text-yellow-500" />
                  {total.toLocaleString()}
                </div>
              </div>

              {/* 경고/액션 */}
              <div className="flex items-center justify-between">
                {notEnough ? (
                  <span className="text-xs text-rose-600">
                    골드가 부족합니다
                  </span>
                ) : (
                  <span />
                )}
                <DialogFooter className="gap-2">
                  <Button variant="secondary" onClick={() => setOpen(false)}>
                    취소
                  </Button>
                  <Button
                    onClick={buy}
                    // 골드 로딩 중일 땐 notEnough 판정 보류 → 버튼 활성 가능
                    disabled={
                      pending ||
                      qty <= 0 ||
                      !current ||
                      (!goldLoading && gold < total)
                    }
                  >
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    구매
                  </Button>
                </DialogFooter>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
