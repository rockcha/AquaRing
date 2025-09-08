// src/features/baits/api.ts
"use client";

import supabase from "@/lib/supabase";

export type MyBait = {
  bait_id: number;
  title: string;
  emoji: string;
  qty: number;
};

export type AdjustResp = {
  title: string;
  emoji: string;
  bait_id: number;
  prev_qty: number;
  delta: number;
  qty: number;
};

/** 내 모든 미끼 (qty=0 포함) */
export async function getMyBaits(): Promise<MyBait[]> {
  const { data, error } = await supabase.rpc("get_my_baits");
  if (error) throw error;
  return (data as MyBait[]) ?? [];
}

/** title로 특정 미끼 수량 증감 */
export async function adjustMyBaitByTitle(
  title: string,
  delta: number
): Promise<AdjustResp> {
  const { data, error } = await supabase.rpc("adjust_my_bait_by_title", {
    p_title: title,
    p_delta: delta,
  });
  if (error) throw error;
  return data as AdjustResp;
}

export type CatalogBait = {
  id: number;
  title: string;
  emoji: string;
  price: number;
};

export async function getBaitsCatalog(): Promise<CatalogBait[]> {
  const { data, error } = await supabase
    .from("baits")
    .select("id,title,emoji,price")
    .order("id", { ascending: true });
  if (error) throw error;
  return (data as CatalogBait[]) ?? [];
}

export async function purchaseBaitByTitle(title: string, qty: number) {
  const { data, error } = await supabase.rpc("purchase_bait_by_title", {
    p_title: title,
    p_qty: qty,
  });
  if (error) throw error;
  return data as {
    title: string;
    emoji: string;
    bait_id: number;
    unit_price: number;
    purchased: number;
    cost: number;
    gold_before: number;
    gold_after: number;
    qty_before: number;
    qty_after: number;
  };
}
