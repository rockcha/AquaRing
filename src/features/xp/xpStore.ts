// src/features/xp/xpStore.ts
"use client";

import { useSyncExternalStore } from "react";
import supabase from "@/lib/supabase";

type Snapshot = {
  xp: number;
  loading: boolean;
  err: string | null;
};

// ❗ 객체를 재할당할 수 있게 let
let state: Snapshot = { xp: 0, loading: true, err: null };

const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

// ❗ 불변 업데이트: 새 객체를 만들어 재할당
const set = (patch: Partial<Snapshot>) => {
  state = { ...state, ...patch };
  emit();
};

let inited = false;
let channel: ReturnType<typeof supabase.channel> | null = null;
let authSub: ReturnType<typeof supabase.auth.onAuthStateChange> | null = null;

async function subscribeRealtime(userId: string) {
  if (channel) {
    supabase.removeChannel(channel);
    channel = null;
  }
  channel = supabase
    .channel("user_xp_me")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "user_xp",
        filter: `id=eq.${userId}`,
      },
      (payload) => {
        const next = (payload.new as { xp?: number } | null)?.xp;
        if (typeof next === "number") {
          set({ xp: next, loading: false, err: null });
        } else {
          void refreshXp(); // 안전망
        }
      }
    )
    .subscribe();
}

export async function refreshXp() {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) {
    // 비로그인: 에러 없이 idle
    set({ xp: 0, loading: false, err: null });
    return;
  }
  set({ loading: true, err: null });
  const { data, error } = await supabase.rpc("get_my_xp");
  if (error) {
    set({ err: error.message ?? "XP를 불러오지 못했어요", loading: false });
  } else {
    set({
      xp: (data as { id: string; xp: number } | null)?.xp ?? 0,
      loading: false,
      err: null,
    });
  }
}

function cleanupSubs() {
  if (channel) {
    supabase.removeChannel(channel);
    channel = null;
  }
  if (authSub) {
    authSub.data.subscription.unsubscribe();
    authSub = null;
  }
}

function ensureInit() {
  if (inited) return;
  inited = true;

  (async () => {
    // 1) 인증 먼저 확인
    const { data: auth } = await supabase.auth.getUser();

    if (auth.user) {
      // 2) 로그인 상태면 RPC + Realtime
      await refreshXp();
      await subscribeRealtime(auth.user.id);
    } else {
      // 3) 비로그인 초기화
      set({ xp: 0, loading: false, err: null });
    }

    // 4) 인증 상태 변화 반영
    authSub = supabase.auth.onAuthStateChange(async (_evt, session) => {
      if (session?.user) {
        await refreshXp();
        await subscribeRealtime(session.user.id);
      } else {
        cleanupSubs();
        set({ xp: 0, loading: false, err: null });
      }
    });
  })();
}

export async function increaseXp(delta: number) {
  const prev = state.xp;
  // 낙관적 업데이트
  set({ xp: prev + delta });
  const { data, error } = await supabase.rpc("user_xp_increase", {
    p_delta: delta,
  });
  if (error) {
    // 롤백 + 에러 노출
    set({ xp: prev, err: error.message ?? "XP 업데이트 실패" });
  } else {
    set({
      xp: (data as { id: string; xp: number } | null)?.xp ?? prev + delta,
      err: null,
    });
  }
}

export function useXp() {
  ensureInit();
  return useSyncExternalStore<Snapshot>(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => state
  );
}
