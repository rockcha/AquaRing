// src/features/xp/useMyXp.ts
"use client";

import { useCallback, useEffect, useState } from "react";
import supabase from "@/lib/supabase";

type MyXp = { id: string; xp: number };

export function useMyXp() {
  const [xp, setXp] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const { data, error } = await supabase.rpc("get_my_xp");
    if (error) setErr(error.message);
    else setXp((data as MyXp)?.xp ?? 0);
  }, []);

  useEffect(() => {
    let sub: ReturnType<typeof supabase.channel> | null = null;
    (async () => {
      setLoading(true);
      await refresh();
      setLoading(false);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // 🔔 내 user_xp 행의 INSERT/UPDATE를 실시간 반영
      sub = supabase
        .channel("user_xp_me")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "user_xp",
            filter: `id=eq.${user.id}`,
          },
          (payload) => {
            const next = (payload.new as MyXp | null)?.xp;
            if (typeof next === "number") setXp(next);
            else refresh(); // 안전망
          }
        )
        .subscribe();
    })();
    return () => {
      if (sub) supabase.removeChannel(sub);
    };
  }, [refresh]);

  // ⬆️ 낙관적 업데이트 → 즉시 오르고, 서버 응답으로 보정
  const increase = useCallback(async (delta: number) => {
    setXp((prev) => (prev ?? 0) + delta);
    const { data, error } = await supabase.rpc("user_xp_increase", {
      p_delta: delta,
    });
    if (error) {
      setErr(error.message);
      setXp((prev) => (prev ?? 0) - delta); // 롤백
    } else {
      setXp((data as MyXp)?.xp ?? 0); // 서버 값으로 정착
    }
  }, []);

  return { xp, loading, err, refresh, increase };
}
