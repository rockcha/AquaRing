// src/features/baits/baitStore.ts
"use client";

import { useSyncExternalStore } from "react";
import supabase from "@/lib/supabase";

export type MyBait = {
  bait_id: number;
  title: string;
  emoji: string;
  qty: number;
};

type Snapshot = {
  items: MyBait[];
  loading: boolean;
  err: string | null;
};

// ---- 내부 상태 & 유틸
let state: Snapshot = { items: [], loading: true, err: null };
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const set = (patch: Partial<Snapshot>) => {
  state = { ...state, ...patch };
  emit();
};

let inited = false;
let channel: ReturnType<typeof supabase.channel> | null = null;
let authSub: ReturnType<typeof supabase.auth.onAuthStateChange> | null = null;

// ---- API: 서버에서 목록 재조회 (qty=0 포함)
export async function refreshBaits() {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) {
    set({ items: [], loading: false, err: null });
    return;
  }

  set({ loading: true, err: null });
  const { data, error } = await supabase.rpc("get_my_baits");
  if (error) {
    set({
      err: error.message ?? "미끼 목록을 불러오지 못했어요",
      loading: false,
    });
  } else {
    set({ items: (data as MyBait[]) ?? [], loading: false, err: null });
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

async function subscribeRealtime(userId: string) {
  if (channel) {
    supabase.removeChannel(channel);
    channel = null;
  }

  channel = supabase
    .channel(`user_bait_${userId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "user_bait",
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        const row = payload.new as { bait_id?: number; qty?: number } | null;
        const old = payload.old as { bait_id?: number } | null;

        // DELETE → 해당 bait qty=0 처리
        if (!row && old && typeof old.bait_id === "number") {
          const idx = state.items.findIndex((i) => i.bait_id === old.bait_id);
          if (idx >= 0) {
            const items = state.items.slice();
            items[idx] = { ...items[idx], qty: 0 };
            set({ items });
          } else {
            void refreshBaits();
          }
          return;
        }

        // INSERT/UPDATE → qty 패치
        if (row && typeof row.bait_id === "number") {
          const idx = state.items.findIndex((i) => i.bait_id === row.bait_id);
          if (idx >= 0) {
            const items = state.items.slice();
            items[idx] = { ...items[idx], qty: Math.max(0, row.qty ?? 0) };
            set({ items });
          } else {
            void refreshBaits();
          }
        }
      }
    )
    .subscribe();
}

// ---- 최초 초기화 (1회)
function ensureInit() {
  if (inited) return;
  inited = true;

  (async () => {
    const { data: auth } = await supabase.auth.getUser();

    if (auth.user) {
      await refreshBaits();
      await subscribeRealtime(auth.user.id);
    } else {
      set({ items: [], loading: false, err: null });
    }

    authSub = supabase.auth.onAuthStateChange(async (_evt, session) => {
      if (session?.user) {
        await refreshBaits();
        await subscribeRealtime(session.user.id);
      } else {
        cleanupSubs();
        set({ items: [], loading: false, err: null });
      }
    });
  })();
}

// ---- 수량 조정 (title 기반, 낙관적 업데이트)
export async function adjustBait(title: string, delta: number) {
  const idx = state.items.findIndex((i) => i.title === title);
  const prevItems = state.items;

  // 낙관적 패치
  if (idx >= 0) {
    const itemsCopy = prevItems.slice();
    const cur = itemsCopy[idx];
    itemsCopy[idx] = { ...cur, qty: Math.max(0, cur.qty + delta) };
    set({ items: itemsCopy });
  }

  const { data, error } = await supabase.rpc("adjust_my_bait_by_title", {
    p_title: title,
    p_delta: delta,
  });

  if (error) {
    // 롤백
    if (idx >= 0) set({ items: prevItems });
    set({ err: error.message ?? "수량 변경 실패" });
  } else {
    // 서버 응답으로 정착
    const res = data as { bait_id: number; qty: number };
    const j = state.items.findIndex((i) => i.bait_id === res.bait_id);
    if (j >= 0) {
      const items2 = state.items.slice();
      items2[j] = { ...items2[j], qty: Math.max(0, res.qty) };
      set({ items: items2, err: null });
    } else {
      void refreshBaits();
    }
  }
}

// ---- 훅 (구독자)
export function useBaits() {
  ensureInit();
  return useSyncExternalStore<Snapshot>(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => state
  );
}
