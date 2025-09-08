// src/pages/shop/ShopPage.tsx
"use client";

import BaitsInventoryCard from "@/features/baits/BaitsInventoryCard";
import BaitShopGridCard from "@/features/baits/BaitShopCard";
import { ShoppingBag } from "lucide-react";

export default function ShopPage() {
  return (
    <div className="mx-auto w-full max-w-6xl p-4 sm:p-6">
      {/* 헤더 */}
      <header className="mb-4 sm:mb-6 flex items-center gap-2">
        <ShoppingBag className="h-5 w-5 text-sky-600" />
        <h1 className="text-xl font-bold">미끼 상점</h1>
      </header>

      {/* 본문: 좌측 인벤토리 / 우측 상점 */}
      <div className="grid gap-4 lg:gap-6 lg:grid-cols-[1fr_minmax(0,1.2fr)]">
        {/* Left: 내 인벤토리 */}
        <div className="space-y-4">
          <BaitsInventoryCard />
        </div>

        {/* Right: 상점 (스크롤시 따라오게) */}
        <div className="space-y-4 lg:sticky lg:top-6">
          <BaitShopGridCard />
        </div>
      </div>
    </div>
  );
}
