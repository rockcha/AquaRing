// src/app/KeepAlive.tsx
"use client";
import { useEffect } from "react";
import supabase from "@/lib/supabase";
import { refreshXp } from "@/features/xp/xpStore";
import { refreshGold } from "@/features/gold/goldStore";
import { refreshBaits } from "@/features/baits/baitStore";

export default function KeepAlive() {
  useEffect(() => {
    let cancelled = false;
    const sync = async () => {
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      const token = data.session?.access_token || "";
      supabase.realtime.setAuth(token);
      await Promise.allSettled([refreshXp(), refreshGold(), refreshBaits()]);
    };
    const onFocus = () => void sync();
    const onVisible = () => {
      if (document.visibilityState === "visible") void sync();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);
  return null;
}
