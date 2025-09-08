// src/widgets/AddGoldButton.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { adjustGold } from "./goldStore";
import { Loader2, Plus } from "lucide-react";

type Props = {
  delta?: number; // 기본 +1, 음수로 주면 차감 버튼으로도 사용 가능
  className?: string;
  children?: React.ReactNode; // 라벨 커스터마이즈 가능
};

export default function AddGoldButton({
  delta = 10,
  className,
  children,
}: Props) {
  const [pending, setPending] = useState(false);

  return (
    <Button
      className={className}
      disabled={pending}
      onClick={async () => {
        setPending(true);
        try {
          await adjustGold(delta);
        } finally {
          setPending(false);
        }
      }}
    >
      {pending ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Plus className="mr-2 h-4 w-4" />
      )}
      {children ?? (delta >= 0 ? `+${delta} Gold` : `${delta} Gold`)}
    </Button>
  );
}
