// src/features/gold/goldStore.ts
"use client";

import { useSyncExternalStore } from "react";
import supabase from "@/lib/supabase";

type Snapshot = {
  amount: number;
  loading: boolean;
  err: string | null;
};

type MyGold = { user_id: string; amount: number };

// ---- 내부 상태(전역 단일 인스턴스)
let state: Snapshot = { amount: 0, loading: true, err: null };
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const set = (patch: Partial<Snapshot>) => {
  state = { ...state, ...patch };
  emit();
};

let inited = false;
let channel: ReturnType<typeof supabase.channel> | null = null;
let authSub: ReturnType<typeof supabase.auth.onAuthStateChange> | null = null;

// ---- Realtime 구독
async function subscribeRealtime(userId: string) {
  if (channel) {
    supabase.removeChannel(channel);
    channel = null;
  }
  channel = supabase
    .channel(`user_gold_${userId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "user_gold",
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        const next = (payload.new as MyGold | null)?.amount;
        if (typeof next === "number") {
          set({ amount: next, loading: false, err: null });
        } else {
          void refreshGold(); // 안전망
        }
      }
    )
    .subscribe();
}

// ---- 현재 골드 조회 (없으면 0행 생성하는 RPC 사용)
export async function refreshGold() {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) {
    set({ amount: 0, loading: false, err: null });
    return;
  }
  set({ loading: true, err: null });
  const { data, error } = await supabase.rpc("get_my_gold");
  if (error) {
    set({ err: error.message ?? "골드를 불러오지 못했어요", loading: false });
  } else {
    set({
      amount: (data as MyGold | null)?.amount ?? 0,
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

// ---- 최초 초기화(한 번만)
function ensureInit() {
  if (inited) return;
  inited = true;

  (async () => {
    const { data: auth } = await supabase.auth.getUser();

    if (auth.user) {
      await refreshGold();
      await subscribeRealtime(auth.user.id);
    } else {
      set({ amount: 0, loading: false, err: null });
    }

    // 로그인/로그아웃 전환 처리
    authSub = supabase.auth.onAuthStateChange(async (_evt, session) => {
      if (session?.user) {
        await refreshGold();
        await subscribeRealtime(session.user.id);
      } else {
        cleanupSubs();
        set({ amount: 0, loading: false, err: null });
      }
    });
  })();
}

// ---- 조정 RPC (낙관적 업데이트 + 서버값으로 보정)
export async function adjustGold(delta: number) {
  const prev = state.amount;
  set({ amount: Math.max(0, prev + delta) }); // optimistic

  const { data, error } = await supabase.rpc("adjust_my_gold", {
    p_delta: delta,
  });
  if (error) {
    set({ amount: prev, err: error.message ?? "골드 업데이트 실패" }); // 롤백
  } else {
    set({
      amount: (data as MyGold | null)?.amount ?? Math.max(0, prev + delta),
      err: null,
    });
  }
}

// ---- 훅
export function useGold() {
  ensureInit();
  return useSyncExternalStore<Snapshot>(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => state
  );
}
