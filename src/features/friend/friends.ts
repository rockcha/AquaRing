// src/services/friends.ts
import supabase from "@/lib/supabase";

/** friend_edges 한 행 타입 */
export type FriendStatus = "pending" | "accepted" | "declined";
export type FriendEdge = {
  id: number;
  user_a: string;
  user_b: string;
  status: FriendStatus;
  requested_by: string;
  requested_at: string;
  responded_by: string | null;
  responded_at: string | null;
};

export type UserLite = { id: string; nickname?: string | null };

export const FriendService = {
  /** 로그인한 내 UID */
  async getCurrentUserId() {
    const { data } = await supabase.auth.getUser();
    return data.user?.id ?? null;
  },

  /** 나를 포함하는 모든 friend_edges (최신 요청순) */
  async listEdgesForUser(uid: string): Promise<FriendEdge[]> {
    const { data, error } = await supabase
      .from("friend_edges")
      .select("*")
      .or(`user_a.eq.${uid},user_b.eq.${uid}`)
      .order("requested_at", { ascending: false });

    if (error) throw error;
    return (data ?? []) as FriendEdge[];
  },

  /** 여러 UID → nickname 맵 */
  async getNickMap(ids: string[]): Promise<Record<string, string>> {
    if (!ids.length) return {};
    try {
      const { data } = await supabase
        .from("app_users")
        .select("id, nickname")
        .in("id", ids);

      const map: Record<string, string> = {};
      (data as UserLite[] | null)?.forEach((u) => {
        if (u.id && u.nickname) map[u.id] = u.nickname;
      });
      return map;
    } catch {
      // 읽기 권한 없을 수 있음 → 빈 맵
      return {};
    }
  },

  /** 닉네임으로 요청 */
  async requestByNickname(nickname: string) {
    console.log(nickname);
    const { data, error } = await supabase.rpc("request_friend_by_nickname", {
      p_nickname: nickname.trim(),
    });
    if (error) throw error;
    return data as FriendEdge;
  },

  /** 수락/거절 (닉 있으면 닉 기반, 없으면 UUID 기반) */
  async respond(p: {
    action: "accept" | "decline";
    nickname?: string;
    otherId?: string;
  }) {
    if (p.nickname) {
      const { data, error } = await supabase.rpc("respond_friend_by_nickname", {
        p_nickname: p.nickname,
        p_action: p.action,
      });
      if (error) throw error;
      return data as FriendEdge;
    } else {
      const { data, error } = await supabase.rpc("respond_friend", {
        p_other: p.otherId,
        p_action: p.action,
      });
      if (error) throw error;
      return data as FriendEdge;
    }
  },

  /** 보낸 요청 취소 */
  async cancel(p: { nickname?: string; otherId?: string }) {
    if (p.nickname) {
      const { data, error } = await supabase.rpc(
        "cancel_friend_request_by_nickname",
        { p_nickname: p.nickname }
      );
      if (error) throw error;
      return data as FriendEdge;
    } else {
      const { data, error } = await supabase.rpc("cancel_friend_request", {
        p_other: p.otherId,
      });
      if (error) throw error;
      return data as FriendEdge;
    }
  },

  /** 친구 끊기 */
  async unfriend(p: { nickname?: string; otherId?: string }) {
    if (p.nickname) {
      const { error } = await supabase.rpc("unfriend_by_nickname", {
        p_nickname: p.nickname,
      });
      if (error) throw error;
    } else {
      const { error } = await supabase.rpc("unfriend", { p_other: p.otherId });
      if (error) throw error;
    }
  },
};
