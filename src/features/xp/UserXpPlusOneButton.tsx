// 예: src/widgets/SomeAction.tsx
"use client";
import { increaseXp } from "@/features/xp/xpStore";
import { Button } from "@/components/ui/button";

export default function SomeAction() {
  return (
    <Button
      onClick={async () => {
        await increaseXp(3); // ✅ 전역 스토어로 즉시 반영 + 서버 보정
      }}
    >
      +3 XP
    </Button>
  );
}
