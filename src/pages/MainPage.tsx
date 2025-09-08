"use client";

import BaitsInventoryCard from "@/features/baits/BaitsInventoryCard";
import BaitsAdjustCard from "@/features/baits/BaitsAdjustCard";
import BaitShopCard from "@/features/baits/BaitShopCard";

export default function MainPage() {
  return (
    <div className="min-h-screen grid place-items-center p-6">
      <div className="p-4 flex gap-4 max-w-3xl">
        <BaitsInventoryCard />
        <BaitsAdjustCard />
        <BaitShopCard />
      </div>
    </div>
  );
}
